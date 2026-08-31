"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  manualActivitiesApi,
  type ManualActivity,
  type ManualActivityInput,
  type ManualActivityRangeParams,
} from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

export const manualActivitiesQueryKey = (
  userId?: string | null,
  params?: ManualActivityRangeParams,
) => ["manual-activities", userId, params ?? {}] as const

export function useManualActivities(params: ManualActivityRangeParams = {}) {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: manualActivitiesQueryKey(userId, params),
    queryFn: () => manualActivitiesApi.list(params),
    enabled: userId != null,
  })

  return {
    activities: (data ?? []) as ManualActivity[],
    loading: isPending,
    error: isError ? "Failed to load your activities." : "",
  }
}

export function useManualActivityMutations() {
  const queryClient = useQueryClient()
  const userId = getUserId()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["manual-activities", userId] })

  const create = useMutation({
    mutationFn: (input: ManualActivityInput) => manualActivitiesApi.create(input),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ManualActivityInput> }) =>
      manualActivitiesApi.update(id, input),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => manualActivitiesApi.remove(id),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  return { create, update, remove }
}
