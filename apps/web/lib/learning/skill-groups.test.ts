import { describe, expect, it } from "vitest"

import { STUDY_GROUP_ORDER, summarizeStudyGroups } from "./skill-groups"

describe("summarizeStudyGroups", () => {
  it("returns all five groups with no evidence when nothing was practiced", () => {
    const summary = summarizeStudyGroups([])
    expect(summary.map((g) => g.id)).toEqual(STUDY_GROUP_ORDER)
    expect(summary.every((g) => !g.hasEvidence && g.masteryPercent === 0)).toBe(true)
  })

  it("ignores skills with zero attempts", () => {
    const summary = summarizeStudyGroups([
      { skillCode: "grammar.particles", masteryScore: 80, attemptCount: 0 },
    ])
    const grammar = summary.find((g) => g.id === "grammar")!
    expect(grammar.hasEvidence).toBe(false)
    expect(grammar.masteryPercent).toBe(0)
  })

  it("averages multiple skill codes within the same group", () => {
    const summary = summarizeStudyGroups([
      { skillCode: "grammar.particles", masteryScore: 60, attemptCount: 3 },
      { skillCode: "grammar.tense", masteryScore: 40, attemptCount: 2 },
    ])
    const grammar = summary.find((g) => g.id === "grammar")!
    expect(grammar.hasEvidence).toBe(true)
    expect(grammar.masteryPercent).toBe(50)
  })

  it("folds communication and speaking into one Speaking group", () => {
    const summary = summarizeStudyGroups([
      { skillCode: "communication.politeness", masteryScore: 70, attemptCount: 1 },
      { skillCode: "speaking.fluency", masteryScore: 30, attemptCount: 1 },
    ])
    const speaking = summary.find((g) => g.id === "speaking")!
    expect(speaking.masteryPercent).toBe(50)
  })

  it("excludes interview skills from every group", () => {
    const summary = summarizeStudyGroups([
      { skillCode: "interview.speaking", masteryScore: 90, attemptCount: 5 },
    ])
    expect(summary.every((g) => !g.hasEvidence)).toBe(true)
  })
})
