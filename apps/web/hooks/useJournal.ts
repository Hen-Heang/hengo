"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { journalApi, type JournalRangeParams } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { JournalEntry, JournalEntryInput } from "@/lib/journal"

export const journalQueryKey = (userId?: string | null, params?: JournalRangeParams) =>
  ["journal", userId, params ?? {}] as const
export const journalEntryQueryKey = (id: string) => ["journal-entry", id] as const

export function useJournal(params: JournalRangeParams = {}) {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: journalQueryKey(userId, params),
    queryFn: () => journalApi.list(params),
    enabled: userId != null,
  })

  return {
    entries: (data ?? []) as JournalEntry[],
    loading: isPending,
    error: isError ? "Failed to load your journal." : "",
  }
}

export function useJournalMutations() {
  const queryClient = useQueryClient()
  const userId = getUserId()
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["journal", userId] })

  const create = useMutation({
    mutationFn: (input: JournalEntryInput) => journalApi.create(input),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<JournalEntryInput> }) =>
      journalApi.update(id, input),
    onSuccess: (_res, { id }) => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: journalEntryQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => journalApi.remove(id),
    onSuccess: () => {
      invalidateList()
      queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
  })

  return { create, update, remove }
}
