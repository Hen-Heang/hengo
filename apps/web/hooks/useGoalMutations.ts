"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { goalsApi, getApiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { goalsQueryKey } from "@/hooks/useGoals"
import type { Goal, GoalMetadata } from "@/lib/goals"

// Combines Orbit's useCreateGoal + useUpdateGoal over the api layer.
//
// `generateTasksWithAI` used to fire a "coming soon" toast and do nothing,
// while the form's switch promised an AI action plan. It now routes to the
// new goal's AI plan builder (`?aiPlan=1`), which drafts tasks and requires an
// explicit confirmation before anything is written — see
// docs/goal-planning-scheduling-audit.md.

export interface CreateGoalPayload {
  title: string
  description?: string
  target_date?: Date | null
  no_duration?: boolean
  start_date?: Date
  metadata: GoalMetadata
}

export interface UpdateGoalPayload {
  title: string
  description: string
  target_date?: Date | null
  no_duration?: boolean
  start_date?: Date
  metadata: GoalMetadata
}

export interface GoalMutationOptions {
  generateTasksWithAI?: boolean
  aiPrompt?: string
  requestedTaskCount?: number
}

const toDateOnly = (d?: Date | null) =>
  d && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : null

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const userId = getUserId()

  const mutation = useMutation({
    mutationFn: async (payload: CreateGoalPayload): Promise<Goal> => {
      if (getUserId() == null) throw new Error("No authenticated user found")

      const metadata: GoalMetadata = {
        version: 1,
        ...payload.metadata,
        start_date: payload.start_date
          ? toDateOnly(payload.start_date) ?? undefined
          : payload.metadata.start_date,
      }

      return goalsApi.create({
        title: payload.title,
        description: payload.description || "",
        target_date: payload.no_duration ? null : toDateOnly(payload.target_date),
        no_duration: payload.no_duration ?? !payload.target_date,
        status: "active",
        metadata,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
    },
  })

  const createGoal = async (
    payload: CreateGoalPayload,
    options: GoalMutationOptions = {}
  ): Promise<{ success: boolean; goal?: Goal; error?: string }> => {
    try {
      const goal = await mutation.mutateAsync(payload)
      toast.success("Success!", { description: "Your goal has been created." })
      // The AI switch opens the plan builder on the new goal. It drafts and
      // shows tasks; it never writes them without a confirmation.
      if (options.generateTasksWithAI) router.push(`/goals/${goal.id}?aiPlan=1`)
      return { success: true, goal }
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not create goal")
      console.error("Error creating goal:", error)
      toast.error("Error creating goal", { description: message })
      return { success: false, error: message }
    }
  }

  return { createGoal, isLoading: mutation.isPending }
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const userId = getUserId()

  const mutation = useMutation({
    mutationFn: async (vars: {
      goalId: string
      payload: UpdateGoalPayload
    }): Promise<Goal> => {
      const { goalId, payload } = vars
      const metadata: GoalMetadata = {
        version: 1,
        ...payload.metadata,
        start_date: payload.start_date
          ? toDateOnly(payload.start_date) ?? undefined
          : payload.metadata.start_date,
      }

      return goalsApi.update(goalId, {
        title: payload.title,
        description: payload.description || "",
        target_date: payload.no_duration ? null : toDateOnly(payload.target_date),
        no_duration: !!payload.no_duration,
        metadata,
      })
    },
    onSuccess: (_goal, vars) => {
      void queryClient.invalidateQueries({ queryKey: goalsQueryKey(userId) })
      // Prefix-matches ["goal", id], ["goal", id, "tasks"], ["goal", id, "members"].
      void queryClient.invalidateQueries({ queryKey: ["goal", vars.goalId] })
    },
  })

  const updateGoal = async (
    goalId: string,
    payload: UpdateGoalPayload,
    options: GoalMutationOptions = {}
  ): Promise<{ success: boolean; goal?: Goal; message?: string }> => {
    try {
      const goal = await mutation.mutateAsync({ goalId, payload })
      toast.success("Success!", { description: "Your goal has been updated." })
      if (options.generateTasksWithAI) router.push(`/goals/${goalId}?aiPlan=1`)
      return { success: true, goal }
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update goal. Please try again.")
      console.error("Error updating goal:", error)
      toast.error("Error", { description: message })
      return { success: false, message }
    }
  }

  return { updateGoal, isLoading: mutation.isPending }
}
