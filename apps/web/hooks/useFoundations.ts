"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { foundationsApi, type FoundationProgress } from "@/lib/api"
import {
  FOUNDATIONS_CURRICULUM_VERSION,
  seedLessonById,
  seedLessonsByTrack,
} from "@/lib/foundations-data"
import { getUserId } from "@/lib/auth-store"
import { useLogActivity } from "@/hooks/useLogActivity"
import type {
  LearnTrack,
  LessonAttemptResult,
  LessonDetail,
  LessonSummary,
} from "@/lib/types"

// Lesson content comes from the local seed; progress is server-backed so it
// syncs across devices. We still mirror completion to localStorage as an
// offline cache for when the backend is unreachable.
const PROGRESS_KEY = "foundations-progress"

type LocalProgress = Record<string, { completed: boolean; progress: number }>

function readLocalProgress(): LocalProgress {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}") as LocalProgress
  } catch {
    return {}
  }
}

function writeLocalProgress(next: LocalProgress) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
}

// Overlay completion onto seed lessons. The server is authoritative; localStorage
// fills in anything not yet synced (offline attempts), and we take the best of all.
function mergeProgress<T extends LessonSummary>(lessons: T[], server: FoundationProgress[]): T[] {
  const local = readLocalProgress()
  const byId = new Map(server.map((p) => [p.lessonId, p]))
  return lessons.map((lesson) => {
    const remote = byId.get(lesson.id)
    const cached = local[lesson.id]
    return {
      ...lesson,
      completed: (remote?.completed ?? false) || (cached?.completed ?? false) || lesson.completed,
      progress: Math.max(remote?.progress ?? 0, cached?.progress ?? 0, lesson.progress),
    }
  })
}

// Grade a set of answers against a lesson's exercises locally — the seed holds
// the correct answers, so grading happens client-side and only the result is
// persisted to the backend.
function gradeLocally(lesson: LessonDetail, answers: Array<number | string>): LessonAttemptResult {
  const results = lesson.exercises.map((exercise, i) => {
    const given = answers[i]
    if (exercise.type === "multiple-choice") {
      return given === exercise.answerIndex
    }
    const expected = (exercise.answer ?? "").trim().toLowerCase()
    return String(given ?? "").trim().toLowerCase() === expected
  })
  const score = results.filter(Boolean).length
  const total = results.length
  const accuracy = total === 0 ? 0 : Math.round((score / total) * 100)
  return {
    lessonId: lesson.id,
    score,
    total,
    accuracy,
    completed: accuracy >= 60,
    results,
  }
}

export const foundationsListKey = (track: LearnTrack, userId?: string | null) =>
  ["foundations", "lessons", FOUNDATIONS_CURRICULUM_VERSION, track, userId] as const

export const foundationsLessonKey = (id: string, userId?: string | null) =>
  ["foundations", "lesson", FOUNDATIONS_CURRICULUM_VERSION, id, userId] as const

// Track list for the /learn page: seed lessons with the user's server-backed
// progress overlaid. If the backend is unreachable we fall back to the
// localStorage mirror so the page still reflects recent attempts.
export function useFoundationsLessons(track: LearnTrack) {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: foundationsListKey(track, userId),
    queryFn: async () => {
      const lessons = seedLessonsByTrack(track)
      if (userId == null) return mergeProgress(lessons, [])

      let server: FoundationProgress[] = []
      try {
        server = await foundationsApi.getProgress()
      } catch {
        /* backend unreachable — overlay localStorage only */
      }
      return mergeProgress(lessons, server)
    },
    placeholderData: () => mergeProgress(seedLessonsByTrack(track), []),
  })

  return {
    lessons: data ?? [],
    loading: isPending,
    error: isError ? "Failed to load lessons." : "",
  }
}

// Single-lesson runner. Content is served straight from the seed; completing a
// lesson grades locally, mirrors to localStorage, and persists to the backend.
export function useFoundationsLesson(id: string) {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const { logActivity } = useLogActivity("foundations")

  const { data, isPending, isError } = useQuery({
    queryKey: foundationsLessonKey(id, userId),
    queryFn: async () => {
      const seed = seedLessonById(id)
      if (!seed) throw new Error("Lesson not found")
      return seed
    },
    enabled: Boolean(id),
  })

  const complete = useCallback(
    async (answers: Array<number | string>): Promise<LessonAttemptResult> => {
      const lesson = data
      if (!lesson) throw new Error("Lesson unavailable")
      const result = gradeLocally(lesson, answers)

      // Mirror locally so the track list reflects it immediately / offline.
      const local = readLocalProgress()
      local[id] = { completed: result.completed, progress: result.accuracy }
      writeLocalProgress(local)

      // Persist to the backend so progress syncs across devices (best-effort).
      if (userId != null) {
        try {
          await foundationsApi.saveProgress(id, {
            track: lesson.track,
            accuracy: result.accuracy,
            completed: result.completed,
          })
        } catch {
          /* offline — localStorage holds it until the next online attempt */
        }
      }

      queryClient.invalidateQueries({ queryKey: foundationsListKey(lesson.track, userId) })
      if (result.completed) void logActivity()
      return result
    },
    [data, id, queryClient, userId, logActivity]
  )

  return {
    lesson: data ?? null,
    loading: isPending,
    error: isError ? "Lesson not found." : "",
    complete,
  }
}
