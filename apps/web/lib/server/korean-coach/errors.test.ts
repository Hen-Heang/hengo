import { afterEach, describe, expect, it, vi } from "vitest"

import { createMockTutorFeedback, isKoreanCoachMockMode } from "@/lib/korean-coach/mock"
import { KOREAN_COACH_SCENARIOS } from "@/lib/korean-coach/scenarios"
import { sanitizeProviderError } from "./errors"
import { generateKoreanTutorFeedback } from "./feedback"

afterEach(() => vi.unstubAllEnvs())

describe("Korean Coach provider safety and mock mode", () => {
  it("sanitizes provider errors without exposing messages or secrets", () => {
    const secret = "provider-secret-test-value"
    const safe = sanitizeProviderError(
      new Error(`Provider rejected ${secret}: upstream trace 123`),
      "FEEDBACK_FAILED",
    )
    expect(JSON.stringify(safe)).not.toContain(secret)
    expect(JSON.stringify(safe)).not.toContain("upstream trace")
    expect(safe).toMatchObject({ code: "FEEDBACK_FAILED", status: 502, retryable: true })
  })

  it("maps timeouts to a safe recovery response", () => {
    const safe = sanitizeProviderError(new DOMException("internal", "TimeoutError"), "SPEECH_FAILED")
    expect(safe).toMatchObject({ code: "AI_TIMEOUT", status: 504, retryable: true })
  })

  it("enables mock mode only with an explicit true value and returns valid labeled feedback", () => {
    vi.stubEnv("KOREAN_COACH_MOCK_MODE", "true")
    expect(isKoreanCoachMockMode()).toBe(true)
    const feedback = createMockTutorFeedback("테스트예요.", KOREAN_COACH_SCENARIOS[0])
    expect(feedback.feedback.summary).toContain("mock feedback")
    vi.stubEnv("KOREAN_COACH_MOCK_MODE", "false")
    expect(isKoreanCoachMockMode()).toBe(false)
  })

  it("runs the complete feedback service in mock mode without an API key", async () => {
    vi.stubEnv("KOREAN_COACH_MOCK_MODE", "true")
    vi.stubEnv("OPENAI_API_KEY", "")
    const scenario = KOREAN_COACH_SCENARIOS[0]
    const result = await generateKoreanTutorFeedback({
      scenarioId: scenario.id,
      transcript: "마감일 언제 있어요?",
      tutorMessage: scenario.openingMessage,
      turn: 1,
      correctionStrictness: "balanced",
    })
    expect(result.mode).toBe("mock")
    expect(result.model).toBe("mock-feedback")
    expect(result.feedback.transcript).toBe("마감일 언제 있어요?")
  })
})
