"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { remindersApi, type ReminderListParams } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { Reminder, ReminderInput } from "@/lib/reminders"

export const remindersQueryKey = (userId?: string | null, params?: ReminderListParams) =>
  ["reminders", userId, params ?? {}] as const

export function useReminders(params: ReminderListParams = {}) {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: remindersQueryKey(userId, params),
    queryFn: () => remindersApi.list(params),
    enabled: userId != null,
  })

  return {
    reminders: (data ?? []) as Reminder[],
    loading: isPending,
    error: isError ? "Failed to load reminders." : "",
  }
}

export function useReminderMutations() {
  const queryClient = useQueryClient()
  const userId = getUserId()
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ["reminders", userId] })

  const create = useMutation({
    mutationFn: (input: ReminderInput) => remindersApi.create(input),
    onSuccess: () => invalidateAll(),
  })

  const pause = useMutation({
    mutationFn: (id: string) => remindersApi.pause(id),
    onSuccess: () => invalidateAll(),
  })

  const resume = useMutation({
    mutationFn: (id: string) => remindersApi.resume(id),
    onSuccess: () => invalidateAll(),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => remindersApi.cancel(id),
    onSuccess: () => invalidateAll(),
  })

  const snooze = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      remindersApi.snooze(id, minutes),
    onSuccess: () => invalidateAll(),
  })

  const remove = useMutation({
    mutationFn: (id: string) => remindersApi.remove(id),
    onSuccess: () => invalidateAll(),
  })

  return { create, pause, resume, cancel, snooze, remove }
}
