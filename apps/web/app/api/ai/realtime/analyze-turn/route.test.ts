import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

// Mock the server plumbing; keep lib/learning/korean-text (eligibility) real so
// the ineligible-turn skip is genuinely exercised.
vi.mock("@/lib/server/ai", () => ({ requireUser: vi.fn(), DEFAULT_MODEL: "gpt-5-mini" }))
vi.mock("@/lib/server/ai-limits", () => ({ checkRateLimit: vi.fn(), recordUsage: vi.fn() }))
vi.mock("@/lib/server/turn-analysis", () => ({ runTurnAnalysis: vi.fn() }))
vi.mock("@/lib/server/corrections-store", () => ({ persistTurnMistakes: vi.fn() }))

import { requireUser } from "@/lib/server/ai"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import { runTurnAnalysis } from "@/lib/server/turn-analysis"
import { persistTurnMistakes } from "@/lib/server/corrections-store"
import { POST } from "./route"

const mockRequireUser = vi.mocked(requireUser)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockRecordUsage = vi.mocked(recordUsage)
const mockRunTurnAnalysis = vi.mocked(runTurnAnalysis)
const mockPersist = vi.mocked(persistTurnMistakes)

const CONVERSATION_ID = "550e8400-e29b-41d4-a716-446655440000"

function makeDb() {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: table === "kori_conversations" ? { id: CONVERSATION_ID } : null }),
        }),
        maybeSingle: async () => ({ data: table === "kori_profiles" ? { korean_level: "BEGINNER" } : null }),
      }),
    }),
  }
}

function analysisWithMistake(): TurnAnalysis {
  return {
    hasErrors: true,
    correctedText: "학교에 갑니다",
    naturalVersion: "학교에 가요",
    overallExplanation: null,
    mistakes: [
      {
        category: "verb_ending",
        original: "가요",
        corrected: "갑니다",
        explanation: "Use the formal ending.",
        grammarPoint: null,
        severity: "important",
      },
    ],
    usefulVocabulary: [],
  }
}

function post(body: unknown): Request {
  return new Request("http://localhost/api/ai/realtime/analyze-turn", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // Happy-path defaults; individual tests override.
  mockRequireUser.mockResolvedValue({ user: { id: "user-1" }, db: makeDb() } as never)
  mockCheckRateLimit.mockResolvedValue({ allowed: true, bucket: "structured", limit: 50, used: 0 })
  mockRecordUsage.mockResolvedValue(undefined)
  mockRunTurnAnalysis.mockResolvedValue(analysisWithMistake())
  mockPersist.mockResolvedValue(undefined)
})

describe("POST /api/ai/realtime/analyze-turn", () => {
  it("requires authentication", async () => {
    mockRequireUser.mockResolvedValue(Response.json({ error: "Not signed in" }, { status: 401 }))
    const res = await POST(post({ conversationId: CONVERSATION_ID, itemId: "i1", text: "학교에 가요" }))
    expect(res.status).toBe(401)
    expect(mockRunTurnAnalysis).not.toHaveBeenCalled()
  })

  it("rejects invalid input", async () => {
    const res = await POST(post({ itemId: "i1", text: "학교에 가요" }))
    expect(res.status).toBe(400)
    expect(mockRunTurnAnalysis).not.toHaveBeenCalled()
  })

  it("skips ineligible (non-Korean) turns before calling the model or spending quota", async () => {
    const res = await POST(post({ conversationId: CONVERSATION_ID, itemId: "i1", text: "hello there" }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toMatchObject({ skipped: true, reason: "ineligible", analysis: null })
    expect(mockCheckRateLimit).not.toHaveBeenCalled()
    expect(mockRunTurnAnalysis).not.toHaveBeenCalled()
  })

  it("returns 429 without analyzing when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, bucket: "structured", limit: 50, used: 50 })
    const res = await POST(post({ conversationId: CONVERSATION_ID, itemId: "i1", text: "학교에 가요" }))
    expect(res.status).toBe(429)
    expect(mockRunTurnAnalysis).not.toHaveBeenCalled()
  })

  it("analyzes a Korean turn, persists mistakes, and records success", async () => {
    const res = await POST(post({ conversationId: CONVERSATION_ID, itemId: "i1", text: "저는 학교에 가요" }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.skipped).toBe(false)
    expect(json.analysis.hasErrors).toBe(true)
    expect(mockPersist).toHaveBeenCalledOnce()
    expect(mockPersist).toHaveBeenCalledWith(
      expect.objectContaining({ sourceFeature: "realtime_voice", sourceId: CONVERSATION_ID }),
    )
    expect(mockRecordUsage).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ success: true }))
  })

  it("degrades gracefully when analysis yields nothing (no persistence)", async () => {
    mockRunTurnAnalysis.mockResolvedValue(null)
    const res = await POST(post({ conversationId: CONVERSATION_ID, itemId: "i1", text: "저는 학교에 가요" }))
    const json = await res.json()
    expect(json).toMatchObject({ skipped: true, reason: "no_analysis" })
    expect(mockPersist).not.toHaveBeenCalled()
  })

  it("does not persist when the turn is clean", async () => {
    mockRunTurnAnalysis.mockResolvedValue({ ...analysisWithMistake(), hasErrors: false, mistakes: [] })
    const res = await POST(post({ conversationId: CONVERSATION_ID, itemId: "i1", text: "저는 학교에 가요" }))
    const json = await res.json()
    expect(json.skipped).toBe(false)
    expect(mockPersist).not.toHaveBeenCalled()
  })
})
