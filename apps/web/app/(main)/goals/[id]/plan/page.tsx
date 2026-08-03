"use client"

import { useParams } from "next/navigation"

import { PlanTab } from "@/components/goals/detail/PlanTab"
import { useGoalDetailShell } from "@/components/goals/detail/GoalDetailShell"
import { useGoalDetail } from "@/hooks/useGoalDetail"

/** Plan — outcome, key results, and the ordered phases with their tasks. */
export default function GoalPlanPage() {
  const { id } = useParams<{ id: string }>()
  const detail = useGoalDetail(id)
  const shell = useGoalDetailShell()

  if (!detail.goal) return null

  return (
    <PlanTab
      goal={detail.goal}
      goalId={id}
      tasks={detail.tasks}
      keyResults={detail.keyResults}
      phases={detail.phases}
      phasesLoading={detail.phasesLoading}
      todayYmd={detail.todayYmd}
      onPhasesChanged={detail.refetchPhases}
      onKeyResultsChanged={detail.refreshGoal}
      onTasksChanged={detail.refreshTasks}
      onAddTask={shell.openAddTask}
    />
  )
}
