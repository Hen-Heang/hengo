import type { RealtimeBootstrapMessage } from "@/lib/realtime/events"
import type { SpeakingPace } from "@/lib/realtime/session-context"
import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"
import { authHeaders } from "./ai-client"

export interface RealtimeBootstrap {
  // Recent conversation tail the browser replays into the new realtime context
  // via conversation.item.create before the first response.create.
  history: RealtimeBootstrapMessage[]
  // Whether the assistant should speak first (greet, or answer a pending user
  // message) versus waiting for the learner.
  createInitialResponse: boolean
}

export interface RealtimeSessionCredentials {
  clientSecret: string
  expiresAt: number | null
  model: string
  learnerLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  speechRate: number
  scenarioTitle: string | null
  bootstrap: RealtimeBootstrap
}

const EMPTY_BOOTSTRAP: RealtimeBootstrap = { history: [], createInitialResponse: true }

export const realtimeApi = {
  createSession: async (
    conversationId: string,
    technicalMode: boolean,
    pace?: SpeakingPace,
    signal?: AbortSignal,
  ): Promise<RealtimeSessionCredentials> => {
    const response = await fetch("/api/ai/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ conversationId, technicalMode, pace }),
      signal,
    })

    const data = (await response.json().catch(() => ({}))) as Partial<RealtimeSessionCredentials> & {
      error?: string
    }
    if (!response.ok || !data.clientSecret) {
      throw new Error(data.error || "Could not start realtime voice")
    }

    return {
      clientSecret: data.clientSecret,
      expiresAt: data.expiresAt ?? null,
      model: data.model ?? "gpt-realtime-2.1",
      learnerLevel: data.learnerLevel ?? "BEGINNER",
      speechRate: data.speechRate ?? 0.88,
      scenarioTitle: data.scenarioTitle ?? null,
      // Defensive default: an older/edge response without bootstrap degrades to
      // today's greet-only behavior instead of throwing.
      bootstrap: data.bootstrap ?? EMPTY_BOOTSTRAP,
    }
  },

  // Analyzes one completed learner voice turn. Returns null on any skip
  // (ineligible, rate-limited, or failure) so a caller can treat "no analysis"
  // uniformly — analysis must never disrupt the live session.
  analyzeTurn: async (
    conversationId: string,
    itemId: string,
    text: string,
    signal?: AbortSignal,
  ): Promise<TurnAnalysis | null> => {
    try {
      const response = await fetch("/api/ai/realtime/analyze-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ conversationId, itemId, text }),
        signal,
      })
      if (!response.ok) return null
      const data = (await response.json().catch(() => null)) as {
        skipped?: boolean
        analysis?: TurnAnalysis | null
      } | null
      if (!data || data.skipped || !data.analysis) return null
      return data.analysis
    } catch {
      return null
    }
  },
}
