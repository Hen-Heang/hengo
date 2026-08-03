import { describe, expect, it } from "vitest"

import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"
import {
  BALANCED_COOLDOWN_TURNS,
  decideCorrection,
  DEFAULT_CORRECTION_POLICY,
  hasImportantMistake,
  initialCorrectionState,
  normalizeCorrectionPolicy,
  pickPrimaryMistake,
  type CorrectionPolicyState,
} from "./correction-policy"

type Severity = "minor" | "important"

function analysisWith(severities: Severity[]): TurnAnalysis {
  return {
    hasErrors: severities.length > 0,
    correctedText: "학교에 갑니다",
    naturalVersion: "학교에 가요",
    overallExplanation: null,
    mistakes: severities.map((severity, i) => ({
      category: "verb_ending" as const,
      original: `original-${i}`,
      corrected: `corrected-${i}`,
      explanation: "explanation",
      grammarPoint: null,
      severity,
    })),
    usefulVocabulary: [],
  }
}

const CLEAN: TurnAnalysis = {
  hasErrors: false,
  correctedText: "잘 했어요",
  naturalVersion: "잘 했어요",
  overallExplanation: null,
  mistakes: [],
  usefulVocabulary: [],
}

describe("normalizeCorrectionPolicy", () => {
  it("passes through valid policies", () => {
    expect(normalizeCorrectionPolicy("accuracy")).toBe("accuracy")
    expect(normalizeCorrectionPolicy("fluency")).toBe("fluency")
  })
  it("falls back to the default for unknown values", () => {
    expect(normalizeCorrectionPolicy("aggressive")).toBe(DEFAULT_CORRECTION_POLICY)
    expect(normalizeCorrectionPolicy(undefined)).toBe("balanced")
  })
})

describe("hasImportantMistake / pickPrimaryMistake", () => {
  it("detects an important mistake among minors", () => {
    expect(hasImportantMistake(analysisWith(["minor", "important"]))).toBe(true)
    expect(hasImportantMistake(analysisWith(["minor"]))).toBe(false)
  })
  it("prefers the important mistake, else the first", () => {
    expect(pickPrimaryMistake(analysisWith(["minor", "important"]))?.severity).toBe("important")
    expect(pickPrimaryMistake(analysisWith(["minor"]))?.severity).toBe("minor")
    expect(pickPrimaryMistake(CLEAN)).toBeNull()
  })
})

describe("decideCorrection — accuracy", () => {
  it("shows important mistakes immediately, ignores clean turns", () => {
    const state = initialCorrectionState()
    expect(decideCorrection({ policy: "accuracy", analysis: analysisWith(["important"]), state }).show).toBe(true)
    expect(decideCorrection({ policy: "accuracy", analysis: analysisWith(["minor"]), state }).show).toBe(false)
    expect(decideCorrection({ policy: "accuracy", analysis: CLEAN, state }).show).toBe(false)
  })
})

describe("decideCorrection — fluency", () => {
  it("never shows live, but still collects real mistakes", () => {
    const state: CorrectionPolicyState = { userTurnIndex: 5, lastShownAtTurn: null }
    const decision = decideCorrection({ policy: "fluency", analysis: analysisWith(["important"]), state })
    expect(decision.show).toBe(false)
    expect(decision.collect).toBe(true)
  })
})

describe("decideCorrection — balanced cooldown", () => {
  it("shows the first important correction, then waits N turns", () => {
    const state = initialCorrectionState()

    // Turn 1: important → shown.
    state.userTurnIndex = 1
    const first = decideCorrection({ policy: "balanced", analysis: analysisWith(["important"]), state })
    expect(first.show).toBe(true)
    state.lastShownAtTurn = state.userTurnIndex

    // Turn 2: important but within cooldown → suppressed (still collected).
    state.userTurnIndex = 2
    const second = decideCorrection({ policy: "balanced", analysis: analysisWith(["important"]), state })
    expect(second.show).toBe(false)
    expect(second.collect).toBe(true)

    // Turn 1 + cooldown: important → shown again.
    state.userTurnIndex = 1 + BALANCED_COOLDOWN_TURNS
    const later = decideCorrection({ policy: "balanced", analysis: analysisWith(["important"]), state })
    expect(later.show).toBe(true)
  })

  it("collect is true for any real mistake regardless of severity", () => {
    const state = initialCorrectionState()
    state.userTurnIndex = 1
    expect(decideCorrection({ policy: "balanced", analysis: analysisWith(["minor"]), state }).collect).toBe(true)
    expect(decideCorrection({ policy: "balanced", analysis: CLEAN, state }).collect).toBe(false)
  })
})
