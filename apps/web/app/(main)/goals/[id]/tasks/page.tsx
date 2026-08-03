"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"

import { AllTasksView } from "@/components/goals/detail/tasks/AllTasksView"
import { GoalTaskDetailsSheet } from "@/components/goals/detail/tasks/GoalTaskDetailsSheet"
import { useGoalDetailShell } from "@/components/goals/detail/GoalDetailShell"
import { useGoalDetail } from "@/hooks/useGoalDetail"
import { useGoalTaskActions } from "@/hooks/useGoalTaskActions"
import { sortPhases } from "@/lib/goal-plan-phases"
import { decodeTaskViewParams, mergeTaskViewParams } from "@/lib/task-view-params"
import type { TaskFilters, TaskSort, TaskViewContext } from "@/lib/task-views"

/**
 * All Tasks — every task on the goal, with chips, search, filters and sorting.
 *
 * Filter and sort state lives in the URL, so a filtered view is bookmarkable
 * and shareable ("here's everything overdue on this goal"). `?task=<id>` opens
 * one straight into the details panel, which is also what Overview's "Schedule"
 * action and the Schedule tab link to.
 */
export default function GoalAllTasksPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const detail = useGoalDetail(id)
  const shell = useGoalDetailShell()

  const { filters, sort } = useMemo(() => decodeTaskViewParams(searchParams), [searchParams])

  const openTaskId = searchParams.get("task")
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const selectedTaskId = pendingTaskId ?? openTaskId

  const actions = useGoalTaskActions({
    todayYmd: detail.todayYmd,
    onChanged: detail.refreshTasks,
  })

  // Filter changes replace rather than push: adjusting a filter shouldn't fill
  // the back stack with intermediate states.
  const writeParams = useCallback(
    (nextFilters: TaskFilters, nextSort: TaskSort) => {
      const query = mergeTaskViewParams(searchParams, nextFilters, nextSort)
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const context: TaskViewContext = useMemo(
    () => ({
      todayYmd: detail.todayYmd,
      phases: sortPhases(detail.phases),
      keyResults: detail.keyResults,
    }),
    [detail.todayYmd, detail.phases, detail.keyResults],
  )

  const visiblePhases = useMemo(
    () => context.phases.filter((p) => p.status !== "archived"),
    [context.phases],
  )

  const selectedTask = useMemo(
    () => detail.tasks.find((t) => t.id === selectedTaskId) ?? null,
    [detail.tasks, selectedTaskId],
  )

  if (!detail.goal) return null

  return (
    <>
      <AllTasksView
        tasks={detail.tasks}
        context={context}
        phases={visiblePhases}
        keyResults={detail.keyResults}
        actions={actions}
        filters={filters}
        onFiltersChange={(next) => writeParams(next, sort)}
        sort={sort}
        onSortChange={(next) => writeParams(filters, next)}
        selectedTaskId={selectedTaskId}
        onOpenTask={(task) => setPendingTaskId(task.id)}
        onAddTask={() => shell.openAddTask(null)}
      />

      <GoalTaskDetailsSheet
        task={selectedTask}
        todayYmd={detail.todayYmd}
        phases={visiblePhases}
        keyResults={detail.keyResults}
        actions={actions}
        goalStartDate={detail.goalStartYmd}
        goalTargetDate={detail.goalTargetYmd}
        onClose={() => {
          setPendingTaskId(null)
          // Drop a `?task=` deep link on close so reloading doesn't reopen it.
          if (openTaskId) {
            const next = new URLSearchParams(searchParams)
            next.delete("task")
            const query = next.toString()
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
          }
        }}
      />
    </>
  )
}
