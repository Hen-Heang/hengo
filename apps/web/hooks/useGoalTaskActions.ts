"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { getApiErrorMessage, tasksApi, type UpdateTaskPayload } from "@/lib/api"
import type { Task, TaskStatus } from "@/lib/tasks"
import { resolveTaskStatus, taskCompletionPatch } from "@/lib/task-status"

/**
 * Every task mutation the Plan and All Tasks views need, in one place, so both
 * views share identical behaviour (and identical error copy).
 *
 * Completion and status always go through `tasksApi.setCompleted` /
 * `setStatus`, which write `completed` and `status` together — see
 * lib/task-status.ts for why that pairing is mandatory.
 */
export function useGoalTaskActions({
  todayYmd,
  onChanged,
}: {
  todayYmd: string
  onChanged: () => void
}) {
  const run = useCallback(
    async (fallback: string, fn: () => Promise<unknown>) => {
      try {
        await fn()
        onChanged()
        return true
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback))
        return false
      }
    },
    [onChanged],
  )

  const toggleCompleted = useCallback(
    (task: Task) => {
      const nowCompleted = resolveTaskStatus(task, todayYmd) !== "completed"
      return run("Couldn't update that task.", () =>
        tasksApi.update(task.id, taskCompletionPatch(nowCompleted, task, todayYmd)),
      )
    },
    [run, todayYmd],
  )

  const setStatus = useCallback(
    (task: Task, status: TaskStatus, blockedReason?: string | null) =>
      run("Couldn't change the status.", () => tasksApi.setStatus(task.id, status, blockedReason)),
    [run],
  )

  /** Title and/or description — the two fields the detail sheet previously
   * only ever displayed read-only. */
  const setDetails = useCallback(
    (task: Task, patch: { title?: string; description?: string }) =>
      run("Couldn't update that task.", () => tasksApi.update(task.id, patch)),
    [run],
  )

  const setPhase = useCallback(
    (task: Task, phaseId: string | null) =>
      run("Couldn't move that task.", () => tasksApi.update(task.id, { phase_id: phaseId })),
    [run],
  )

  const setKeyResult = useCallback(
    (task: Task, keyResultId: string | null) =>
      run("Couldn't connect that key result.", () =>
        tasksApi.update(task.id, { key_result_id: keyResultId }),
      ),
    [run],
  )

  const setImpact = useCallback(
    (task: Task, impact: "low" | "medium" | "high" | null) =>
      run("Couldn't update the impact.", () => tasksApi.update(task.id, { impact_level: impact })),
    [run],
  )

  const setEffort = useCallback(
    (task: Task, minutes: number | null) =>
      run("Couldn't update the effort.", () =>
        tasksApi.update(task.id, { effort_minutes: minutes }),
      ),
    [run],
  )

  /** Give a task a day and (optionally) a time slot. */
  const schedule = useCallback(
    (task: Task, patch: UpdateTaskPayload) =>
      run("Couldn't schedule that task.", () => tasksApi.update(task.id, patch)),
    [run],
  )

  /**
   * Move a task that was missed. Uses `tasksApi.reschedule`, so this — and
   * only this — bumps `reschedule_count`.
   */
  const reschedule = useCallback(
    (task: Task, patch: UpdateTaskPayload) =>
      run("Couldn't reschedule that task.", () => tasksApi.reschedule(task, patch)),
    [run],
  )

  const moveToBacklog = useCallback(
    (task: Task) =>
      run("Couldn't move that task to the backlog.", () => tasksApi.moveToBacklog(task)),
    [run],
  )

  const remove = useCallback(
    (task: Task) => run("Couldn't delete that task.", () => tasksApi.remove(task.id)),
    [run],
  )

  return {
    toggleCompleted,
    setStatus,
    setDetails,
    setPhase,
    setKeyResult,
    setImpact,
    setEffort,
    schedule,
    reschedule,
    moveToBacklog,
    remove,
  }
}

export type GoalTaskActions = ReturnType<typeof useGoalTaskActions>
