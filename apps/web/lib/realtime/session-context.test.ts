import { describe, expect, it } from "vitest"

import type { RealtimeBootstrapMessage } from "./events"
import {
  buildRealtimeBootstrap,
  buildRealtimeInstructions,
  DEFAULT_REALTIME_MODEL,
  normalizeKoreanLevel,
  PACE_SPEED,
  resolveRealtimeModel,
  resolveSpeechSpeed,
  VOICE_LEVELS,
  type RealtimeContextInput,
} from "./session-context"

function baseInput(overrides: Partial<RealtimeContextInput> = {}): RealtimeContextInput {
  return {
    learnerName: "Sam",
    level: "BEGINNER",
    conversationType: "FREE_CHAT",
    technicalMode: false,
    occupation: null,
    learningGoal: null,
    nativeLanguage: null,
    country: null,
    scenario: null,
    recentMistakes: [],
    history: [],
    ...overrides,
  }
}

describe("resolveRealtimeModel", () => {
  it("uses the default when nothing is configured", () => {
    expect(resolveRealtimeModel()).toEqual({ model: DEFAULT_REALTIME_MODEL, invalidRequest: null })
    expect(resolveRealtimeModel(null).model).toBe(DEFAULT_REALTIME_MODEL)
  })

  it("accepts an allowlisted model", () => {
    expect(resolveRealtimeModel("gpt-realtime-2.1-mini")).toEqual({
      model: "gpt-realtime-2.1-mini",
      invalidRequest: null,
    })
  })

  it("rejects an unknown model, falling back to the default and reporting it", () => {
    const result = resolveRealtimeModel("gpt-5-imaginary")
    expect(result.model).toBe(DEFAULT_REALTIME_MODEL)
    expect(result.invalidRequest).toBe("gpt-5-imaginary")
  })
})

describe("resolveSpeechSpeed", () => {
  it("uses the level-derived speed when no pace is set", () => {
    expect(resolveSpeechSpeed("BEGINNER")).toBe(VOICE_LEVELS.BEGINNER.speed)
    expect(resolveSpeechSpeed("ADVANCED", null)).toBe(VOICE_LEVELS.ADVANCED.speed)
  })
  it("overrides with the pace speed when set", () => {
    expect(resolveSpeechSpeed("ADVANCED", "slow")).toBe(PACE_SPEED.slow)
    expect(resolveSpeechSpeed("BEGINNER", "natural")).toBe(PACE_SPEED.natural)
  })
})

describe("normalizeKoreanLevel", () => {
  it("maps known levels case-insensitively", () => {
    expect(normalizeKoreanLevel("advanced")).toBe("ADVANCED")
    expect(normalizeKoreanLevel("Intermediate")).toBe("INTERMEDIATE")
  })

  it("falls back to BEGINNER for unknown or empty values", () => {
    expect(normalizeKoreanLevel(null)).toBe("BEGINNER")
    expect(normalizeKoreanLevel("fluent-ish")).toBe("BEGINNER")
  })
})

describe("buildRealtimeInstructions", () => {
  const history: RealtimeBootstrapMessage[] = [
    { id: "1", role: "user", text: "회사에서 자기소개를 연습하고 싶어요" },
    { id: "2", role: "assistant", text: "좋아요! 이름부터 말해 볼까요?" },
  ]

  it("greets when there is no history", () => {
    const text = buildRealtimeInstructions(baseInput())
    expect(text).toContain("greet them warmly in Korean")
    expect(text).not.toContain("continuing an ongoing conversation")
  })

  it("continues (no re-greeting) when history exists", () => {
    const text = buildRealtimeInstructions(baseInput({ history }))
    expect(text).toContain("continuing an ongoing conversation")
    expect(text).not.toContain("greet them warmly in Korean")
  })

  it("falls back to a neutral learner name and includes the level rules", () => {
    const text = buildRealtimeInstructions(baseInput({ learnerName: "the learner", level: "ADVANCED" }))
    expect(text).toContain("for the learner")
    expect(text).toContain(VOICE_LEVELS.ADVANCED.instructions.slice(0, 24))
  })

  it("embeds scenario roleplay context when a scenario is provided", () => {
    const text = buildRealtimeInstructions(
      baseInput({
        scenario: {
          title: "Daily Standup",
          summary: "Report yesterday, today, blockers.",
          goal: "Give a clear 3-sentence standup update.",
          introMessage: "You are my team lead running standup.",
        },
      }),
    )
    expect(text).toContain("Daily Standup")
    expect(text).toContain("Give a clear 3-sentence standup update.")
    expect(text).toContain("You are my team lead running standup.")
  })

  it("surfaces recent mistakes as gentle awareness", () => {
    const text = buildRealtimeInstructions(
      baseInput({ recentMistakes: [{ original: "학교에 가요", corrected: "학교에 갑니다" }] }),
    )
    expect(text).toContain("학교에 가요 → 학교에 갑니다")
    expect(text).toContain("do not lecture")
  })

  it("applies the technical practice framing in developer mode", () => {
    const text = buildRealtimeInstructions(baseInput({ technicalMode: true }))
    expect(text).toContain("software work")
  })
})

describe("buildRealtimeBootstrap", () => {
  it("limits history and flags an initial response after a user turn", () => {
    const bootstrap = buildRealtimeBootstrap([
      { id: "1", role: "assistant", text: "안녕하세요" },
      { id: "2", role: "user", text: "질문이 있어요" },
    ])
    expect(bootstrap.history).toHaveLength(2)
    expect(bootstrap.createInitialResponse).toBe(true)
  })

  it("waits for the learner when the last message was the assistant's", () => {
    const bootstrap = buildRealtimeBootstrap([
      { id: "1", role: "user", text: "질문이 있어요" },
      { id: "2", role: "assistant", text: "네, 말씀하세요" },
    ])
    expect(bootstrap.createInitialResponse).toBe(false)
  })

  it("drops empty messages from the bootstrap tail", () => {
    const bootstrap = buildRealtimeBootstrap([
      { id: "1", role: "user", text: "   " },
      { id: "2", role: "assistant", text: "네" },
    ])
    expect(bootstrap.history).toHaveLength(1)
    expect(bootstrap.history[0].id).toBe("2")
  })
})
