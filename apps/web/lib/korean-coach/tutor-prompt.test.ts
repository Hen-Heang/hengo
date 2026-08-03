import { describe, expect, it } from "vitest"

import { KOREAN_COACH_SCENARIOS } from "./scenarios"
import { buildKoreanTutorPrompt, KOREAN_TUTOR_SYSTEM_PROMPT } from "./tutor-prompt"

describe("Korean tutor prompt", () => {
  it("enforces the one-question, polite, transcript-only coaching boundary", () => {
    expect(KOREAN_TUTOR_SYSTEM_PROMPT).toContain("exactly one short question")
    expect(KOREAN_TUTOR_SYSTEM_PROMPT).toContain("해요체")
    expect(KOREAN_TUTOR_SYSTEM_PROMPT).toContain("not an acoustic pronunciation analysis")
    expect(KOREAN_TUTOR_SYSTEM_PROMPT).toContain("not scientific measurements")
  })

  it("includes the selected scenario, current question, transcript, and correction policy", () => {
    const scenario = KOREAN_COACH_SCENARIOS[0]
    const prompt = buildKoreanTutorPrompt({
      scenario,
      transcript: "안녕하세요. 오늘 버그를 고쳐요.",
      tutorMessage: scenario.openingMessage,
      turn: 2,
      correctionStrictness: "balanced",
    })
    expect(prompt).toContain(scenario.englishTitle)
    expect(prompt).toContain(scenario.openingMessage.korean)
    expect(prompt).toContain("안녕하세요. 오늘 버그를 고쳐요.")
    expect(prompt).toContain("Balance communication success")
  })
})

