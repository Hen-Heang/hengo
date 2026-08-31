import { describe, expect, it } from "vitest"

import { createMockTutorFeedback } from "./mock"
import { KOREAN_COACH_SCENARIOS } from "./scenarios"
import {
  feedbackRequestSchema,
  koreanCoachPreferencesSchema,
  koreanTutorFeedbackSchema,
  speechRequestSchema,
} from "./schemas"

describe("Korean Coach contracts", () => {
  it("validates structured tutor feedback", () => {
    const feedback = createMockTutorFeedback("마감일 언제 있어요?", KOREAN_COACH_SCENARIOS[0])
    expect(koreanTutorFeedbackSchema.safeParse(feedback).success).toBe(true)
  })

  it("rejects invalid structured scores and unrecognized mistake types", () => {
    const feedback = createMockTutorFeedback("test", KOREAN_COACH_SCENARIOS[0])
    expect(
      koreanTutorFeedbackSchema.safeParse({
        ...feedback,
        feedback: {
          ...feedback.feedback,
          communication: { score: 101, explanation: "invalid" },
        },
      }).success,
    ).toBe(false)
    expect(
      koreanTutorFeedbackSchema.safeParse({
        ...feedback,
        mistakes: [{ ...feedback.mistakes[0], type: "pronunciation" }],
      }).success,
    ).toBe(false)
  })

  it("validates API request inputs and applies safe preference defaults", () => {
    expect(
      feedbackRequestSchema.safeParse({
        scenarioId: "daily-standup",
        transcript: "오늘 버그를 수정하고 있어요.",
        tutorMessage: KOREAN_COACH_SCENARIOS[0].openingMessage,
        turn: 1,
      }).success,
    ).toBe(true)
    expect(feedbackRequestSchema.safeParse({ transcript: "" }).success).toBe(false)
    expect(speechRequestSchema.safeParse({ text: "", speed: 3 }).success).toBe(false)
    expect(koreanCoachPreferencesSchema.parse({}).defaultSpeechSpeed).toBe(0.75)
  })
})
