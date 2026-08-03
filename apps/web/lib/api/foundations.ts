import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import type { LearnTrack } from "@/lib/types"

// Foundations module — beginner basics (Hangul) and grammar. The lesson CONTENT
// (cards + exercises) lives in the frontend seed (lib/foundations-data.ts) and
// is graded client-side. Supabase owns only per-user PROGRESS so completion
// syncs across devices (kori_foundation_progress).

export interface FoundationProgress {
  lessonId: string
  track: LearnTrack
  completed: boolean
  progress: number
  attempts: number
}

type ProgressRow = {
  lesson_id: string
  track: LearnTrack
  completed: boolean
  progress: number
  attempts: number
}

function toProgress(row: ProgressRow): FoundationProgress {
  return {
    lessonId: row.lesson_id,
    track: row.track,
    completed: row.completed,
    progress: row.progress,
    attempts: row.attempts,
  }
}

export const foundationsApi = {
  getProgress: async (): Promise<FoundationProgress[]> => {
    const { data, error } = await supabase.from("kori_foundation_progress").select("*")
    if (error) throw error
    return (data as ProgressRow[]).map(toProgress)
  },

  // Persist a locally-graded attempt: keeps the best accuracy, completion is
  // sticky, attempts increment. Returns the merged progress row.
  saveProgress: async (
    lessonId: string,
    body: { track: LearnTrack; accuracy: number; completed: boolean },
  ): Promise<FoundationProgress> => {
    const userId = requireUserId()
    const { data: existing, error } = await supabase
      .from("kori_foundation_progress")
      .select("*")
      .eq("lesson_id", lessonId)
      .maybeSingle()
    if (error) throw error
    const prev = existing as ProgressRow | null
    const merged = {
      user_id: userId,
      lesson_id: lessonId,
      track: body.track,
      completed: Boolean(prev?.completed) || body.completed,
      progress: Math.max(prev?.progress ?? 0, Math.round(body.accuracy)),
      attempts: (prev?.attempts ?? 0) + 1,
    }
    const { data: row, error: upsertError } = await supabase
      .from("kori_foundation_progress")
      .upsert(merged)
      .select()
      .single()
    if (upsertError) throw upsertError
    return toProgress(row as ProgressRow)
  },
}
