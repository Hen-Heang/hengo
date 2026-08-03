"use client"

import { useRouter } from "next/navigation"

import { GoalFormContainer } from "@/components/goals/form/GoalFormContainer"
import type { Goal } from "@/lib/goals"

export default function CreateCustomGoalPage() {
  const router = useRouter()

  return (
    <GoalFormContainer
      onSuccess={(goal) => {
        const id = (goal as Goal)?.id
        router.push(id ? `/goals/${id}` : "/goals")
      }}
    />
  )
}
