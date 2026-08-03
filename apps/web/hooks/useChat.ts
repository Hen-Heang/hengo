"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { chatApi, scenarioSessionsApi, type ScenarioEvaluateResult } from "@/lib/api"
import type { ChatMessage, MessageRole } from "@/lib/types"
import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

type UseChatOptions = {
  conversationId?: string
  initialMessages?: ChatMessage[]
  // Fired after the conversation is auto-titled from its first message, so the
  // caller can refresh whatever list is showing the (previously generic) title.
  onConversationTitled?: () => void
  // Present only for a scenario-practice conversation (see kori_conversations
  // .scenario_id) — enables turn counting + evidence-based evaluation instead
  // of marking the scenario "done" the moment the page opens.
  scenario?: { scenarioId: string; goal: string }
}

// ChatGPT-style auto title: a short snippet of the first user message.
function titleFromMessage(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim()
  const MAX_LENGTH = 48
  return normalized.length > MAX_LENGTH ? `${normalized.slice(0, MAX_LENGTH).trimEnd()}…` : normalized
}

type ResponseLanguage = "auto" | "english" | "korean"

function detectLanguagePreference(input: string): ResponseLanguage | null {
  const normalized = input.toLowerCase()

  const wantsEnglish =
    /\benglish\b/.test(normalized) ||
    /\bin english\b/.test(normalized) ||
    /\bspeak english\b/.test(normalized) ||
    /\buse english\b/.test(normalized) ||
    /영어/.test(input)

  if (wantsEnglish) {
    return "english"
  }

  const wantsKorean =
    /\bkorean\b/.test(normalized) ||
    /\bin korean\b/.test(normalized) ||
    /\buse korean\b/.test(normalized) ||
    /한국어|한글/.test(input)

  if (wantsKorean) {
    return "korean"
  }

  return null
}

function buildMessageForApi(
  content: string,
  language: ResponseLanguage,
  isTechnical: boolean,
): string {
  const instructions = []

  if (language === "english") {
    instructions.push("Reply in English unless I ask for another language.")
  } else if (language === "korean") {
    instructions.push("Reply in Korean unless I ask for another language.")
  }

  if (isTechnical) {
    instructions.push("I am a software developer. Use technical and workplace Korean terms (IT terminology, office honorifics) where appropriate. Explain advanced terms in a developer-friendly way.")
  }

  if (instructions.length === 0) return content

  return `${content}\n\n[Response preference: ${instructions.join(" ")}]`
}

export function useChat({ conversationId, initialMessages = [], onConversationTitled, scenario }: UseChatOptions) {
  const [messages, setMessages] = useState(conversationId ? [] : initialMessages)
  const [draft, setDraft] = useState("")
  const [responseLanguage, setResponseLanguage] = useState<ResponseLanguage>("auto")
  const [isTechnicalMode, setIsTechnicalMode] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(Boolean(conversationId))
  const [isSending, setIsSending] = useState(false)
  // Compact correction card shown after a Korean turn with real mistakes —
  // only ever set for turns the server judged worth flagging (hasErrors).
  const [turnAnalysis, setTurnAnalysis] = useState<TurnAnalysis | null>(null)
  const [turnAnalysisOriginalText, setTurnAnalysisOriginalText] = useState("")
  const [scenarioTurnCount, setScenarioTurnCount] = useState(0)
  const [scenarioResult, setScenarioResult] = useState<ScenarioEvaluateResult | null>(null)
  const [isEvaluatingScenario, setIsEvaluatingScenario] = useState(false)

  useEffect(() => {
    if (!scenario || !conversationId) return
    let active = true
    scenarioSessionsApi
      .getByConversation(conversationId)
      .then((session) => {
        if (active && session) setScenarioTurnCount(session.userTurnCount)
      })
      .catch(() => {
        /* turn count just starts at 0 if this fails */
      })
    return () => {
      active = false
    }
  }, [scenario, conversationId])

  // Tracks the in-flight stream so we can cancel it when the user navigates
  // away or switches conversations, instead of leaking the fetch and writing
  // to an unmounted component.
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  // Reset during render when switching conversations, so stale messages
  // never flash while the new history loads.
  const [activeConversationId, setActiveConversationId] = useState(conversationId)
  if (activeConversationId !== conversationId) {
    setActiveConversationId(conversationId)
    setMessages([])
    setDraft("")
    setError("")
    setIsLoadingMessages(Boolean(conversationId))
  }

  useEffect(() => {
    if (!conversationId) {
      return
    }

    let active = true

    chatApi
      .getMessages(conversationId, 50)
      .then((data) => {
        if (!active) {
          return
        }
        setError("")
        const history = Array.isArray(data) ? data : []
        const normalized = history.map((item, index) => {
          const message = item as unknown as Record<string, unknown>
          const role: MessageRole =
            message.role === "assistant" || message.senderType === "ASSISTANT"
              ? "assistant"
              : "user"
          return {
            id: String(message.id ?? message.messageId ?? `${conversationId}-${index}`),
            role,
            content: String(message.content ?? message.message ?? message.text ?? ""),
            correction: message.correction ? String(message.correction) : undefined,
            translation: message.translation ? String(message.translation) : undefined,
            createdAt: String(message.createdAt ?? new Date().toISOString()),
          }
        })
        setMessages(normalized)
      })
      .catch(() => {
        if (active) {
          setError("Failed to load messages.")
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingMessages(false)
        }
      })

    return () => {
      active = false
    }
  }, [conversationId])

  const sendMessage = async (content?: string) => {
    const nextContent = (content ?? draft).trim()

    if (!nextContent || isSending) {
      return
    }

    const isFirstMessage = messages.length === 0

    const detectedLanguage = detectLanguagePreference(nextContent)
    const nextLanguage = detectedLanguage ?? responseLanguage
    if (detectedLanguage) {
      setResponseLanguage(detectedLanguage)
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: nextContent,
      createdAt: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    setDraft("")
    setTurnAnalysis(null)

    if (!conversationId) {
      setError("Conversation is not available.")
      return
    }

    // Give the conversation a real name the first time it's used, like ChatGPT
    // does — otherwise every session sits in the sidebar as "General Practice".
    if (isFirstMessage) {
      chatApi
        .renameConversation(conversationId, titleFromMessage(nextContent))
        .then(() => onConversationTitled?.())
        .catch(() => {
          /* best-effort — the conversation still works under its old title */
        })
    }

    const streamingId = crypto.randomUUID()
    setMessages((current) => [
      ...current,
      { id: streamingId, role: "assistant", content: "", createdAt: new Date().toISOString() },
    ])

    setIsSending(true)

    // Cancel any prior in-flight stream, then track this one for cleanup.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Tokens arrive far faster than the screen refreshes. Buffer them and flush
    // once per animation frame (~60fps) so a long reply triggers ~60 re-renders
    // a second instead of one per token (which made replies stutter as they grew).
    let pending = ""
    let frame: number | null = null
    // Cancels any scheduled frame and applies buffered tokens immediately, so
    // every caller can just `flush()` without repeating the cancel dance.
    const flush = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }
      if (!pending) return
      const chunk = pending
      pending = ""
      setMessages((current) =>
        current.map((m) => (m.id === streamingId ? { ...m, content: m.content + chunk } : m))
      )
    }

    try {
      await chatApi.streamMessage(
        conversationId,
        buildMessageForApi(nextContent, nextLanguage, isTechnicalMode),
        (token) => {
          pending += token
          if (frame === null) frame = requestAnimationFrame(flush)
        },
        () => {
          // user message already shown
        },
        (assistantMessageId) => {
          flush()
          setMessages((current) =>
            current.map((m) => (m.id === streamingId ? { ...m, id: assistantMessageId } : m))
          )
        },
        controller.signal,
        {
          displayMessage: nextContent,
          onTurnAnalysis: (analysis) => {
            // Only correct Korean truly worth flagging — a clean turn should
            // never surface a card.
            if (analysis.hasErrors && analysis.mistakes.length > 0) {
              setTurnAnalysisOriginalText(nextContent)
              setTurnAnalysis(analysis)
            }
          },
        },
      )
      // Flush any tail tokens if the stream ended without a `done` event.
      flush()
      setError("")
      if (scenario) {
        scenarioSessionsApi
          .incrementTurn(conversationId)
          .then(setScenarioTurnCount)
          .catch(() => {
            /* evaluation still works off the session's persisted count */
          })
      }
    } catch (err) {
      flush()
      // Aborted (navigation/new send) — drop the placeholder silently.
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((current) => current.filter((m) => m.id !== streamingId))
        return
      }
      setError("Failed to send message.")
      setMessages((current) => current.filter((m) => m.id !== streamingId))
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            nextLanguage === "korean"
              ? "문제가 발생했어요. 다시 시도해 주세요."
              : "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const appendVoiceTurn = useCallback(
    async (role: "user" | "assistant", content: string) => {
      const normalized = content.replace(/\s+/g, " ").trim()
      if (!conversationId || !normalized) return

      const optimisticId = crypto.randomUUID()
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        role,
        content: normalized,
        createdAt: new Date().toISOString(),
      }
      setMessages((current) => [...current, optimisticMessage])

      try {
        const saved = await chatApi.saveVoiceTurn(conversationId, role, normalized)
        setMessages((current) =>
          current.map((message) =>
            message.id === optimisticId
              ? { ...message, id: saved.id, createdAt: saved.createdAt }
              : message,
          ),
        )
      } catch {
        // Keep the local transcript visible even if persistence briefly fails.
        setError("This voice turn is visible here, but it could not be saved to history.")
      }
    },
    [conversationId],
  )

  // Lets the UI's stop button abort the in-flight stream; useChat's abort
  // handler already drops the placeholder message silently.
  const cancel = () => {
    abortRef.current?.abort()
  }

  // Judges the transcript so far against the scenario's goal. Only ever
  // completes the linked mission item (inside scenarioSessionsApi.evaluate)
  // when the goal was actually accomplished — never just for opening the chat.
  const evaluateScenario = useCallback(async () => {
    if (!scenario || !conversationId || isEvaluatingScenario) return
    setIsEvaluatingScenario(true)
    try {
      const session = await scenarioSessionsApi.getByConversation(conversationId)
      if (!session) return
      const transcript = messages
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
        .slice(-24)
        .map((m) => ({ role: m.role as "user" | "assistant", text: m.content }))
      const result = await scenarioSessionsApi.evaluate(session, scenario.goal, transcript)
      setScenarioResult(result)
    } catch {
      setError("Could not evaluate the scenario right now. Please try again.")
    } finally {
      setIsEvaluatingScenario(false)
    }
  }, [scenario, conversationId, messages, isEvaluatingScenario])

  return {
    draft,
    error,
    isLoadingMessages,
    isStreaming: isSending,
    messages,
    sendMessage,
    appendVoiceTurn,
    cancel,
    setDraft,
    isTechnicalMode,
    setIsTechnicalMode,
    turnAnalysis,
    turnAnalysisOriginalText,
    dismissTurnAnalysis: useCallback(() => setTurnAnalysis(null), []),
    scenarioTurnCount,
    scenarioResult,
    isEvaluatingScenario,
    evaluateScenario,
  }
}
