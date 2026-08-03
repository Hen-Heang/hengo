"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { planPhasesApi, scheduleRulesApi } from "@/lib/api"
import type { GoalPlanPhase } from "@/lib/goal-plan-phases"
import type { GoalScheduleRule } from "@/lib/goal-schedule-rules"

export const phasesQueryKey = (goalId: string) => ["goal", goalId, "phases"] as const
export const scheduleRulesQueryKey = (goalId: string) => ["goal", goalId, "schedule-rules"] as const

/** Plan phases + recurring schedule rules for one goal, plus a combined refetch. */
export function useGoalPlan(goalId: string) {
  const queryClient = useQueryClient()

  const phasesQuery = useQuery<GoalPlanPhase[]>({
    queryKey: phasesQueryKey(goalId),
    queryFn: () => planPhasesApi.listForGoal(goalId),
    enabled: !!goalId,
  })

  const rulesQuery = useQuery<GoalScheduleRule[]>({
    queryKey: scheduleRulesQueryKey(goalId),
    queryFn: () => scheduleRulesApi.listForGoal(goalId),
    enabled: !!goalId,
  })

  const refetchPhases = () =>
    void queryClient.invalidateQueries({ queryKey: phasesQueryKey(goalId) })
  const refetchRules = () =>
    void queryClient.invalidateQueries({ queryKey: scheduleRulesQueryKey(goalId) })

  return {
    phases: phasesQuery.data ?? [],
    phasesLoading: phasesQuery.isPending,
    rules: rulesQuery.data ?? [],
    rulesLoading: rulesQuery.isPending,
    refetchPhases,
    refetchRules,
  }
}
