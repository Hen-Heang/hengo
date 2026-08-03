import { describe, expect, it } from "vitest"

import { INTERVIEW_MODES } from "./interview-modes"

// These invariants pin the "don't break practice mode" constraint: practice must
// stay the original friendly behavior, and exam must stay strict.
describe("INTERVIEW_MODES", () => {
  it("practice keeps the original friendly behavior", () => {
    const practice = INTERVIEW_MODES.practice
    expect(practice.showFeedback).toBe(true)
    expect(practice.showEnglish).toBe(true)
    expect(practice.allowSlowReplay).toBe(true)
    expect(practice.showStudyPackInSession).toBe(true)
    expect(practice.durationSeconds).toBeNull()
    expect(practice.minAnswersBeforeFinish).toBe(1)
  })

  it("exam is strict: Korean only, timed, no help", () => {
    const exam = INTERVIEW_MODES.exam
    expect(exam.showFeedback).toBe(false)
    expect(exam.showEnglish).toBe(false)
    expect(exam.allowSlowReplay).toBe(false)
    expect(exam.showStudyPackInSession).toBe(false)
    expect(exam.durationSeconds).toBe(600)
    expect(exam.minAnswersBeforeFinish).toBeGreaterThan(1)
  })

  it("both modes mix in unexpected questions, exam more heavily", () => {
    expect(INTERVIEW_MODES.practice.unexpectedQuestionCount).toBeGreaterThan(0)
    expect(INTERVIEW_MODES.exam.unexpectedQuestionCount).toBeGreaterThanOrEqual(
      INTERVIEW_MODES.practice.unexpectedQuestionCount
    )
  })

  it("each config's id matches its record key", () => {
    for (const [key, cfg] of Object.entries(INTERVIEW_MODES)) {
      expect(cfg.id).toBe(key)
    }
  })
})

