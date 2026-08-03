"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { habitsApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { consistencyPercent, currentStreak, daysActive, longestStreak } from "@/lib/habits"
import { milestonePhase, nextMilestone } from "@/lib/milestones"
import { useLogActivity } from "@/hooks/useLogActivity"
import type { HabitCategory } from "@/lib/types"

export const habitsQueryKey = (userId?: string | null) => ["habits", "list", userId] as const
export const habitCheckinsQueryKey = (habitId?: string | null) => ["habits", "checkins", habitId] as const

// Unlike Recovery (one active habit at a time), Habits supports several
// running side by side — exercise, reading, meditation, etc. — so this
// returns the full active list rather than a single activeHabit.
export function useHabits() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const key = habitsQueryKey(userId)

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: habitsApi.getHabits,
    enabled: userId != null,
  })

  const habits = data ?? []
  const activeHabits = habits.filter((h) => h.active)

  const addHabit = async (input: { label: string; category: HabitCategory; identityStatement?: string }) => {
    const habit = await habitsApi.addHabit(input)
    await queryClient.invalidateQueries({ queryKey: key })
    return habit
  }

  const updateHabit = async (
    id: string,
    data: { label?: string; category?: HabitCategory; identityStatement?: string | null; active?: boolean },
  ) => {
    const habit = await habitsApi.updateHabit(id, data)
    await queryClient.invalidateQueries({ queryKey: key })
    return habit
  }

  const deleteHabit = async (id: string) => {
    await habitsApi.removeHabit(id)
    await queryClient.invalidateQueries({ queryKey: key })
  }

  return {
    habits,
    activeHabits,
    loading: isPending,
    error: isError ? "Failed to load habits." : "",
    addHabit,
    updateHabit,
    deleteHabit,
  }
}

/** Local YYYY-MM-DD for `date` (defaults to today) — matches HabitCheckIn.date. */
export function toCheckinDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function useHabitCheckins(habitId: string | null, startedAt?: string) {
  const queryClient = useQueryClient()
  const key = habitCheckinsQueryKey(habitId)
  const { logActivity } = useLogActivity("habits")

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: () => habitsApi.getCheckins(habitId as string),
    enabled: habitId != null,
  })

  const checkins = data ?? []
  const days = startedAt ? daysActive(startedAt) : 0

  const toggleCheckin = async (date: string) => {
    if (!habitId) throw new Error("No habit selected")
    const existing = checkins.find((c) => c.date === date && c.completed)
    if (existing) {
      await habitsApi.removeCheckin(habitId, date)
    } else {
      await habitsApi.setCheckin(habitId, date)
    }
    await queryClient.invalidateQueries({ queryKey: key })
    void logActivity()
  }

  return {
    checkins,
    loading: isPending,
    error: isError ? "Failed to load check-ins." : "",
    currentStreak: currentStreak(checkins),
    longestStreak: longestStreak(checkins),
    consistencyPercent: startedAt ? consistencyPercent(checkins, startedAt.slice(0, 10)) : 0,
    milestone: milestonePhase(days),
    nextMilestone: nextMilestone(days),
    toggleCheckin,
  }
}
