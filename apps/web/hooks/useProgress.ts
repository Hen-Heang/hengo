"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { progressApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { DashboardStats, ProgressPoint } from "@/lib/types"

const emptyStats: DashboardStats = {
  streakDays: 0,
  weeklyMinutes: 0,
  wordsSaved: 0,
  correctionsThisWeek: 0,
  dailyGoalProgress: 0,
  reviewsToday: 0,
  correctionsToday: 0,
  dueReviews: 0,
}

export const dashboardQueryKey = (userId?: string | null) => ["dashboard", userId] as const

export function useProgress() {
  const userId = getUserId()

  const { data, isPending, isError } = useQuery({
    queryKey: dashboardQueryKey(userId),
    queryFn: () => progressApi.getDashboard(),
    enabled: userId != null,
  })

  const chartData = useMemo<ProgressPoint[]>(
    () => (Array.isArray(data?.chartData) ? data.chartData : []),
    [data]
  )

  const stats = useMemo<DashboardStats>(
    () => ({ ...emptyStats, ...data?.stats }),
    [data]
  )

  const dailyAverage = useMemo(
    () =>
      chartData.length
        ? Math.round(
            chartData.reduce((total, item) => total + item.minutes, 0) /
              chartData.length
          )
        : 0,
    [chartData]
  )

  return {
    chartData,
    dailyAverage,
    error: isError ? "Failed to load progress data." : "",
    loading: isPending,
    stats,
  }
}
