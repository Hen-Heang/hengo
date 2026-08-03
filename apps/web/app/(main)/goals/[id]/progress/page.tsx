"use client"

import { useParams } from "next/navigation"

import { ProgressTab } from "@/components/goals/detail/ProgressTab"
import { useGoalDetail } from "@/hooks/useGoalDetail"

/** Progress — outcome history, evidence, reviews, activity and analytics. */
export default function GoalProgressPage() {
  const { id } = useParams<{ id: string }>()
  const detail = useGoalDetail(id)

  if (!detail.goal) return null

  return (
    <ProgressTab
      goal={detail.goal}
      goalId={id}
      tasks={detail.tasks}
      keyResults={detail.keyResults}
      outcomeProgress={detail.progress.outcomeProgress}
      activityProgress={detail.progress.activityProgress}
      onGoalUpdated={detail.patchGoalCache}
    />
  )
}
