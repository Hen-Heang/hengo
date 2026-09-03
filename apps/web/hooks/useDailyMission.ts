"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { missionsApi, type DailyMission } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

// Query key factory so any caller can invalidate/read the cached mission.
export const dailyMissionQueryKey = (userId?: string | null) => ["daily-mission", userId] as const

async function fetchTodayMission(): Promise<DailyMission> {
  const created = await missionsApi.getOrCreateToday()
  const refreshed = await missionsApi.refreshProgress()
  return refreshed ?? created
}

/**
 * Today's mission (`kori_daily_missions`), generated once per Korea-calendar
 * day by `lib/learning/mission-engine.ts` and re-checked against real
 * evidence on every read (`missionsApi.refreshProgress`) — never marked
 * complete just because a page opened. Same shape as `useVocab`/`useStreak`
 * so `/home` and `/practice` can share this cache instead of each fetching
 * their own copy.
 */
export function useDailyMission() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const key = dailyMissionQueryKey(userId)

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: fetchTodayMission,
    enabled: userId != null,
  })

  const refreshMission = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: key })
  }, [queryClient, key])

  return {
    mission: data ?? null,
    loading: isPending,
    error: isError,
    refreshMission,
  }
}
