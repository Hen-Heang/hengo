"use client"

import { useParams, useSearchParams } from "next/navigation"

import { ScheduleTab } from "@/components/goals/detail/ScheduleTab"
import { useGoalDetail } from "@/hooks/useGoalDetail"

/** Schedule — the goal's calendar, capacity, backlog and recurring routines. */
export default function GoalSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const detail = useGoalDetail(id)

  // `?task=` / `?taskId=` deep links open that task in the calendar.
  const deepLinkTaskId = searchParams.get("task") ?? searchParams.get("taskId")

  if (!detail.goal) return null

  return (
    <ScheduleTab
      goal={detail.goal}
      goalId={id}
      tasks={detail.tasks}
      phases={detail.phases}
      keyResults={detail.keyResults}
      rules={detail.rules}
      rulesLoading={detail.rulesLoading}
      todayYmd={detail.todayYmd}
      deepLinkTaskId={deepLinkTaskId}
      onRulesChanged={detail.refetchRules}
      onTasksChanged={detail.refreshTasks}
      onGoalChanged={detail.refreshGoal}
    />
  )
}
