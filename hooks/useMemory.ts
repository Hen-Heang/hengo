"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { getApiErrorMessage, memoryApi, type AskHengoAnswer } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { MemoryCandidate, MemoryStatus } from "@/lib/memory"

export const memoryCandidatesQueryKey = (userId?: string | null, status?: MemoryStatus | "all") =>
  ["memory-candidates", userId, status ?? "all"] as const

export function useMemoryCandidates(status: MemoryStatus | "all" = "all") {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: memoryCandidatesQueryKey(userId, status),
    queryFn: () => memoryApi.listCandidates(status),
    enabled: userId != null,
  })

  return {
    candidates: (data ?? []) as MemoryCandidate[],
    loading: isPending,
    error: isError ? "Failed to load memories." : "",
  }
}

export function useMemoryMutations() {
  const queryClient = useQueryClient()
  const userId = getUserId()
  const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ["memory-candidates", userId] })

  const create = useMutation({
    mutationFn: (input: { fact: string; category: string }) => memoryApi.create(input),
    onSuccess: () => invalidateAll(),
  })

  const approve = useMutation({
    mutationFn: ({ id, editedFact }: { id: string; editedFact?: string }) => memoryApi.approve(id, editedFact),
    onSuccess: () => invalidateAll(),
  })

  const update = useMutation({
    mutationFn: ({ id, fact }: { id: string; fact: string }) => memoryApi.update(id, fact),
    onSuccess: () => invalidateAll(),
  })

  const reject = useMutation({
    mutationFn: (id: string) => memoryApi.reject(id),
    onSuccess: () => invalidateAll(),
  })

  const archive = useMutation({
    mutationFn: (id: string) => memoryApi.archive(id),
    onSuccess: () => invalidateAll(),
  })

  const remove = useMutation({
    mutationFn: (id: string) => memoryApi.remove(id),
    onSuccess: () => invalidateAll(),
  })

  return { create, approve, update, reject, archive, remove }
}

/** Not a TanStack Query hook — each question is a one-off mutation-like call,
 * and keeping the running conversation (question/answer pairs) in local
 * state is simpler than modeling Ask Hengo as cached, invalidatable data. */
export function useAskHengo() {
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState("")
  const queryClient = useQueryClient()
  const userId = getUserId()

  async function ask(question: string): Promise<AskHengoAnswer | null> {
    setAsking(true)
    setError("")
    try {
      const result = await memoryApi.ask(question)
      if (result.proposedMemories.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["memory-candidates", userId] })
      }
      return result
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't get an answer just now."))
      return null
    } finally {
      setAsking(false)
    }
  }

  return { ask, asking, error }
}
