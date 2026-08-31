"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { goalsApi, tasksApi, type CreateTaskPayload, type UpdateTaskPayload } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { Task } from "@/lib/tasks"

// Data layer for the calendar, replacing Orbit's Supabase `useCalendarTasks`.
// Backed by the Spring tasks endpoints + TanStack Query. Realtime patching is
// dropped (deferred) → mutations invalidate the query instead.
//
// Scope:
//   goalId set   → that one goal's tasks (GET /goals/{id}/tasks), embedded in
//                  the goal's own page.
//   goalId unset → every task the user owns — personal (goal_id = null) AND
//                  every goal's tasks together, same "across every goal"
//                  scope as the Today page's task list (useTodaysTasks) —
//                  derived from GET /tasks, unfiltered. This is the
//                  top-level Calendar's whole point: one place to see (and
//                  assign) tasks regardless of which goal, if any, owns them.

export const calendarTasksKey = (goalId?: string) =>
  ["calendar-tasks", goalId ?? "personal"] as const

export function useCalendarTasks(goalId?: string) {
  const queryClient = useQueryClient()
  const key = calendarTasksKey(goalId)

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Task[]> => (goalId ? goalsApi.getTasks(goalId) : tasksApi.range({})),
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
      // Embedded in one goal's own page: every task it creates belongs to
      // that goal, full stop. Unscoped (the top-level Calendar): honor
      // whatever goal — or none — the caller picked.
      const created = await tasksApi.create({
        ...payload,
        goal_id: goalId ?? payload.goal_id ?? null,
      })
      await invalidate()
      return created
    },
    [goalId, invalidate],
  )

  const update = useCallback(
    async (id: string, payload: UpdateTaskPayload) => {
      // Optimistic cache patch so toggles/edits feel instant.
      const prev = queryClient.getQueryData<Task[]>(key)
      queryClient.setQueryData<Task[]>(key, (list) =>
        (list || []).map((t) => (t.id === id ? ({ ...t, ...stripUndefined(payload) } as Task) : t)),
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
    [queryClient, key, invalidate],
  )

  const remove = useCallback(
    async (id: string) => {
      await tasksApi.remove(id)
      await invalidate()
    },
    [invalidate],
  )

  return { tasks, isLoading, error, create, update, remove, invalidate }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}
