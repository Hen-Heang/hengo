"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { chatApi, getApiErrorMessage } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

export interface Conversation {
  id: string
  title: string
  conversationType?: string
  messageCount?: number
  createdAt?: string
  updatedAt?: string
}

export const conversationsQueryKey = (userId?: string | null) =>
  ["conversations", userId] as const

/**
 * Chat history list (backend already exposes GET /chat/conversations with paging)
 * plus rename/delete. Both writes patch the cache optimistically and roll back on
 * failure, mirroring useGoals.
 */
export function useConversations() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const key = conversationsQueryKey(userId)

  const { data: conversations = [], isPending } = useQuery({
    queryKey: key,
    queryFn: () => chatApi.listConversations(50, 0) as Promise<Conversation[]>,
    enabled: userId != null,
  })

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: key }),
    [queryClient, key]
  )

  const rename = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const before = queryClient.getQueryData<Conversation[]>(key)
      queryClient.setQueryData<Conversation[]>(key, (list) =>
        (list ?? []).map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      )
      try {
        await chatApi.renameConversation(id, trimmed)
      } catch (e) {
        if (before) queryClient.setQueryData(key, before)
        toast.error("Could not rename chat", {
          description: getApiErrorMessage(e, "Please try again."),
        })
      }
    },
    [queryClient, key]
  )

  const remove = useCallback(
    async (id: string) => {
      const before = queryClient.getQueryData<Conversation[]>(key)
      queryClient.setQueryData<Conversation[]>(key, (list) =>
        (list ?? []).filter((c) => c.id !== id)
      )
      try {
        await chatApi.deleteConversation(id)
        toast.success("Chat deleted")
      } catch (e) {
        if (before) queryClient.setQueryData(key, before)
        toast.error("Could not delete chat", {
          description: getApiErrorMessage(e, "Please try again."),
        })
      }
    },
    [queryClient, key]
  )

  return { conversations, isLoading: isPending, rename, remove, refresh }
}
