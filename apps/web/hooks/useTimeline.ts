"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  habitsApi,
  journalApi,
  manualActivitiesApi,
  progressApi,
  recoveryApi,
  tasksApi,
} from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { buildTimeline, type TimelineEntry } from "@/lib/timeline"

export interface TimelineRange {
  from: string
  to: string
}

/**
 * Composes six independent, date-bounded queries and runs them through
 * lib/timeline.ts's pure `buildTimeline` — one hook, one place that knows how
 * to fetch each source, so the aggregation logic itself stays framework-free
 * and testable. `habitsQuery` exists only to resolve habit_id -> label for
 * check-in entries (Timeline entries need a display label, the check-in rows
 * themselves only carry the id).
 */
export function useTimeline(range: TimelineRange) {
  const userId = getUserId()
  const enabled = userId != null

  const tasksQuery = useQuery({
    queryKey: ["timeline", "tasks", userId, range],
    queryFn: () => tasksApi.range({ from: range.from, to: range.to }),
    enabled,
  })
  const habitsQuery = useQuery({
    queryKey: ["timeline", "habits", userId],
    queryFn: () => habitsApi.getHabits(),
    enabled,
  })
  const habitCheckinsQuery = useQuery({
    queryKey: ["timeline", "habit-checkins", userId, range],
    queryFn: () => habitsApi.getCheckinsInRange({ from: range.from, to: range.to }),
    enabled,
  })
  const activityLogQuery = useQuery({
    queryKey: ["timeline", "activity-log", userId, range],
    queryFn: () => progressApi.getActivityLog({ from: range.from, to: range.to }),
    enabled,
  })
  const manualActivitiesQuery = useQuery({
    queryKey: ["timeline", "manual-activities", userId, range],
    queryFn: () => manualActivitiesApi.list({ from: range.from, to: range.to }),
    enabled,
  })
  const journalQuery = useQuery({
    queryKey: ["timeline", "journal", userId, range],
    queryFn: () => journalApi.list({ from: range.from, to: range.to }),
    enabled,
  })
  const recoveryCheckinsQuery = useQuery({
    queryKey: ["timeline", "recovery-checkins", userId, range],
    queryFn: () => recoveryApi.getDailyCheckInsInRange({ from: range.from, to: range.to }),
    enabled,
  })

  const queries = [
    tasksQuery,
    habitsQuery,
    habitCheckinsQuery,
    activityLogQuery,
    manualActivitiesQuery,
    journalQuery,
    recoveryCheckinsQuery,
  ]
  const loading = queries.some((q) => q.isPending)
  const hasError = queries.some((q) => q.isError)

  const entries = useMemo<TimelineEntry[]>(() => {
    if (loading) return []
    const habitLabelById = new Map((habitsQuery.data ?? []).map((h) => [h.id, h.label]))
    return buildTimeline({
      tasks: tasksQuery.data ?? [],
      habitCheckins: (habitCheckinsQuery.data ?? []).map((c) => ({
        id: c.id,
        habitId: c.habitId,
        habitLabel: habitLabelById.get(c.habitId) ?? "Habit",
        date: c.date,
        completed: c.completed,
      })),
      activityLog: activityLogQuery.data ?? [],
      manualActivities: manualActivitiesQuery.data ?? [],
      journalEntries: journalQuery.data ?? [],
      recoveryCheckins: (recoveryCheckinsQuery.data ?? []).map((c) => ({
        id: c.id,
        date: c.date,
        mood: c.mood,
        win: c.win,
        intention: c.intention,
      })),
    })
  }, [
    loading,
    tasksQuery.data,
    habitsQuery.data,
    habitCheckinsQuery.data,
    activityLogQuery.data,
    manualActivitiesQuery.data,
    journalQuery.data,
    recoveryCheckinsQuery.data,
  ])

  return {
    entries,
    loading,
    error: hasError ? "Some of your timeline data failed to load." : "",
  }
}
