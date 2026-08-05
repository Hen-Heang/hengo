"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { ChatWindow } from "@/components/chat/ChatWindow"
import { Button } from "@/components/ui/button"
import { useConversations } from "@/hooks/useConversations"
import { chatApi, getApiErrorMessage } from "@/lib/api"

export function FloatingAiCoachPanel({ active }: { active: boolean }) {
  const { conversations, isLoading: conversationsLoading, refresh } = useConversations()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0)
  const [error, setError] = useState("")
  const [isStartingNewChat, setIsStartingNewChat] = useState(false)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (!active || conversationId || conversationsLoading || bootstrappedRef.current) return

    bootstrappedRef.current = true
    const recentFreeChat = conversations.find(
      (conversation) => !conversation.conversationType || conversation.conversationType === "FREE_CHAT"
    )

    if (recentFreeChat) {
      setConversationId(recentFreeChat.id)
      return
    }

    chatApi
      .createConversation("General Practice", "FREE_CHAT")
      .then((conversation) => {
        setConversationId(conversation.id)
        void refresh()
      })
      .catch((cause) => {
        setError(getApiErrorMessage(cause, "Could not start AI Coach. Please try again."))
      })
  }, [active, bootstrapAttempt, conversationId, conversations, conversationsLoading, refresh])

  const startNewChat = useCallback(async () => {
    setIsStartingNewChat(true)
    try {
      const conversation = await chatApi.createConversation("General Practice", "FREE_CHAT")
      setConversationId(conversation.id)
      await refresh()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause, "Could not start a new chat. Please try again."))
    } finally {
      setIsStartingNewChat(false)
    }
  }, [refresh])

  function retry() {
    bootstrappedRef.current = false
    setError("")
    setBootstrapAttempt((attempt) => attempt + 1)
  }

  if (error && !conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Coach is unavailable</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{error}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={retry}>
            Retry
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/chat">Open full coach</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center" role="status">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Preparing your conversation…
        </div>
      </div>
    )
  }

  return (
    <ChatWindow
      title="Hengo"
      subtitle="Ready when you are"
      conversationId={conversationId}
      embedded
      compact
      onNewChat={startNewChat}
      isStartingNewChat={isStartingNewChat}
      onConversationTitled={() => void refresh()}
    />
  )
}
