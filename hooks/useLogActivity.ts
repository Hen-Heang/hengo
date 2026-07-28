"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { progressApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { streakQueryKey } from "@/hooks/useStreak"
import { dashboardQueryKey } from "@/hooks/useProgress"

// Canonical feature labels for kori_activity_log rows — shared with
// useSessionTimer so per-action and time-on-page rows agree.
export type ActivityFeature =
  | "vocab"
  | "reading"
  | "listening"
  | "foundations"
  | "interview"
  | "chat"
  | "recovery"
  | "habits"
  | "phrasebook"

/**
 * `const { logActivity } = useLogActivity("vocab")` — call `logActivity()`
 * after ANY learning action completes (analyze a message, review/generate
 * vocab, finish an interview turn, submit a listening quiz, complete a reading
 * unit, …). The feature label is bound once per hook, mirroring
 * useSessionTimer, so call sites can't drift.
 *
 * The Supabase port computes streak / reviews-today / daily-goal entirely from
 * kori_activity_log (the old Spring backend derived them from the feature
 * tables server-side, which is why this used to be invalidate-only). So each
 * action inserts a zero-duration activity row — time-on-page rows still come
 * from useSessionTimer — and then invalidates the streak + dashboard caches so
 * both re-read the fresh counts.
 */
export function useLogActivity(feature: ActivityFeature) {
  const queryClient = useQueryClient()
  const userId = getUserId()

  const logActivity = useCallback(async () => {
    try {
      await progressApi.logDuration(feature, 0)
    } catch {
      // Best-effort — still refresh the caches below so stale values re-read.
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: streakQueryKey(userId) }),
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey(userId) }),
    ])
  }, [feature, queryClient, userId])

  return { logActivity }
}
