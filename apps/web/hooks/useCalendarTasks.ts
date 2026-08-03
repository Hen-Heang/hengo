"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  goalsApi,
  tasksApi,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { Task } from "@/lib/tasks"

// Data layer for the calendar, replacing Orbit's Supabase `useCalendarTasks`.
// Backed by the Spring tasks endpoints + TanStack Query. Realtime patching is
// dropped (deferred) → mutations invalidate the query instead.
//
// Scope:
//   goalId set   → that goal's tasks (GET /goals/{id}/tasks)
//   goalId unset → the user's standalone personal tasks (goal_id = null),
//                  derived from GET /tasks and filtered client-side.

export const calendarTasksKey = (goalId?: string) =>
  ["calendar-tasks", goalId ?? "personal"] as const

export function useCalendarTasks(goalId?: string) {
  const queryClient = useQueryClient()
  const key = calendarTasksKey(goalId)

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Task[]> => {
      if (goalId) return goalsApi.getTasks(goalId)
      const all = await tasksApi.range({})
      return all.filter((t) => !t.goal_id)
    },
    enabled: getUserId() != null,
  })

  const tasks = data ?? []

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: key })
    // Keep the goal-detail page's own goal/tasks queries (header stats,
    // progress) in sync after calendar edits. The ["goal", goalId] prefix also
    // matches ["goal", goalId, "tasks"].
    if (goalId) await queryClient.invalidateQueries({ queryKey: ["goal", goalId] })
  }, [queryClient, key, goalId])

  const create = useCallback(
    async (payload: CreateTaskPayload) => {
      const created = await tasksApi.create({ ...payload, goal_id: goalId ?? null })
      await invalidate()
      return created
    },
    [goalId, invalidate]
  )

  const update = useCallback(
    async (id: string, payload: UpdateTaskPayload) => {
      // Optimistic cache patch so toggles/edits feel instant.
      const prev = queryClient.getQueryData<Task[]>(key)
      queryClient.setQueryData<Task[]>(key, (list) =>
        (list || []).map((t) =>
          t.id === id ? ({ ...t, ...stripUndefined(payload) } as Task) : t
        )
      )
      try {
        const updated = await tasksApi.update(id, payload)
        await invalidate()
        return updated
      } catch (err) {
        if (prev) queryClient.setQueryData(key, prev)
        throw err
      }
    },
    [queryClient, key, invalidate]
  )

  const remove = useCallback(
    async (id: string) => {
      await tasksApi.remove(id)
      await invalidate()
    },
    [invalidate]
  )

  return { tasks, isLoading, error, create, update, remove, invalidate }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>
}
