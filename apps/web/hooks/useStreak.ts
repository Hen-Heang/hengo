"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { progressApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

// Query key factory so any caller can invalidate/read the cached streak.
export const streakQueryKey = (userId?: string | null) => ["streak", userId] as const

/**
 * Study streak for the authenticated user. Auto-fetches + caches via TanStack
 * Query; callers invoke `refreshStreak()` after an activity to invalidate the
 * cache (so the streak refetches and any display updates).
 */
export function useStreak() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const key = streakQueryKey(userId)

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => progressApi.getStreak(),
    enabled: userId != null,
  })

  const refreshStreak = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: key })
  }, [queryClient, key])

  return {
    streakDays: data?.streakDays ?? null,
    activityToday: data?.activityToday ?? false,
    refreshStreak,
  }
}
