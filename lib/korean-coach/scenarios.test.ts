import { describe, expect, it } from "vitest"

import {
  KOREAN_COACH_SCENARIOS,
  validateKoreanCoachScenarios,
} from "./scenarios"

describe("Korean Coach scenarios", () => {
  it("contains the complete workplace and daily-life MVP catalog", () => {
    const scenarios = validateKoreanCoachScenarios()
    expect(scenarios).toHaveLength(20)
    expect(scenarios.filter((scenario) => scenario.category === "workplace")).toHaveLength(10)
    expect(scenarios.filter((scenario) => scenario.category === "daily")).toHaveLength(10)
  })

  it("keeps IDs unique and every scenario fully typed", () => {
    const scenarios = validateKoreanCoachScenarios()
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(scenarios.length)
    for (const scenario of scenarios) {
      expect(scenario.openingMessage.korean.length).toBeGreaterThan(0)
      expect(scenario.learningObjectives.length).toBeGreaterThan(0)
      expect(scenario.usefulVocabulary.length).toBeGreaterThanOrEqual(2)
      expect(scenario.estimatedMinutes).toBeGreaterThanOrEqual(3)
    }
  })

  it("rejects duplicate scenario IDs", () => {
    expect(() =>
      validateKoreanCoachScenarios([
        KOREAN_COACH_SCENARIOS[0],
        KOREAN_COACH_SCENARIOS[0],
      ]),
    ).toThrow(/unique/i)
  })
})

