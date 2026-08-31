import { describe, expect, it } from "vitest"
import { buildDailyMission, type MissionContext } from "./mission-engine"

function baseContext(overrides: Partial<MissionContext> = {}): MissionContext {
  return {
    dateKey: "2026-07-21",
    koreanLevel: "BEGINNER",
    learningGoal: null,
    availableMinutes: 30,
    dueVocabulary: [],
    dueVocabularyCount: 0,
    dueCorrections: [],
    dueCorrectionsCount: 0,
    duePhrases: [],
    duePhrasesCount: 0,
    weakSkills: [],
    recentFeatures: [],
    recentTopics: [],
    upcomingExam: null,
    availableScenarios: [
      { id: "daily-standup", title: "Daily Standup", category: "Meetings" },
      { id: "code-review", title: "Code Review", category: "Code Review" },
    ],
    availableListeningTopics: [{ topic: "Daily standup" }, { topic: "Sprint planning" }],
    dailyPhraseLearned: true,
    ...overrides,
  }
}

describe("buildDailyMission", () => {
  it("is deterministic for identical input", () => {
    const ctx = baseContext({
      dueVocabularyCount: 5,
      dueVocabulary: [{ id: "v1", term: "a", meaning: "a" }],
      weakSkills: [{ skillCode: "grammar.particles", masteryScore: 20 }],
    })
    const a = buildDailyMission(ctx)
    const b = buildDailyMission(ctx)
    expect(a).toEqual(b)
  })

  it("never uses Math.random (repeated calls across dates stay stable per date)", () => {
    const ctx1 = baseContext({ dateKey: "2026-07-21" })
    const ctx2 = baseContext({ dateKey: "2026-07-21" })
    expect(buildDailyMission(ctx1)).toEqual(buildDailyMission(ctx2))
  })

  it("prioritizes due vocabulary and corrections when present", () => {
    const ctx = baseContext({
      dueVocabularyCount: 10,
      dueVocabulary: Array.from({ length: 10 }, (_, i) => ({ id: `v${i}`, term: "x", meaning: "y" })),
      dueCorrectionsCount: 8,
      dueCorrections: Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, originalText: "a", correctedText: "b" })),
    })
    const plan = buildDailyMission(ctx)
    const types = plan.items.map((i) => i.type)
    expect(types).toContain("vocab_review")
    expect(types).toContain("correction_review")
  })

  it("targets the weakest measured skill when nothing else claims its activity type", () => {
    const ctx = baseContext({
      weakSkills: [
        { skillCode: "speaking.confidence", masteryScore: 10 },
        { skillCode: "listening.main_idea", masteryScore: 90 },
      ],
    })
    const plan = buildDailyMission(ctx)
    const scenarioItem = plan.items.find((i) => i.type === "scenario")
    expect(scenarioItem).toBeDefined()
    expect(scenarioItem?.skillCodes).toContain("speaking.confidence")
  })

  it("folds a weak skill onto an existing due-review item instead of duplicating it", () => {
    const ctx = baseContext({
      dueCorrectionsCount: 5,
      dueCorrections: Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, originalText: "a", correctedText: "b" })),
      weakSkills: [{ skillCode: "grammar.particles", masteryScore: 15 }],
    })
    const plan = buildDailyMission(ctx)
    const correctionItems = plan.items.filter((i) => i.type === "correction_review")
    expect(correctionItems).toHaveLength(1)
    expect(correctionItems[0].skillCodes).toContain("grammar.particles")
  })

  it("includes the daily phrase when it has not been learned yet", () => {
    const ctx = baseContext({ dailyPhraseLearned: false })
    const plan = buildDailyMission(ctx)
    expect(plan.items.some((i) => i.type === "daily_phrase")).toBe(true)
  })

  it("omits the daily phrase once it's already learned", () => {
    const ctx = baseContext({ dailyPhraseLearned: true, dueVocabularyCount: 3, dueVocabulary: [{ id: "v1", term: "a", meaning: "b" }] })
    const plan = buildDailyMission(ctx)
    expect(plan.items.some((i) => i.type === "daily_phrase")).toBe(false)
  })

  it("respects the available-minutes budget once at least one item is included", () => {
    const ctx = baseContext({
      availableMinutes: 8,
      dueVocabularyCount: 20,
      dueVocabulary: Array.from({ length: 20 }, (_, i) => ({ id: `v${i}`, term: "x", meaning: "y" })),
      dueCorrectionsCount: 20,
      dueCorrections: Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, originalText: "a", correctedText: "b" })),
      weakSkills: [{ skillCode: "speaking.confidence", masteryScore: 5 }],
      dailyPhraseLearned: true,
    })
    const plan = buildDailyMission(ctx)
    // At least the single highest-weight item is always included even if it
    // alone exceeds the budget, but nothing further should pile on.
    expect(plan.items.length).toBeLessThanOrEqual(2)
  })

  it("includes a phrase_review item when Phrasebook cards are due", () => {
    const ctx = baseContext({
      duePhrasesCount: 6,
      duePhrases: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, category: "workplace" })),
    })
    const plan = buildDailyMission(ctx)
    const phraseItem = plan.items.find((i) => i.type === "phrase_review")
    expect(phraseItem).toBeDefined()
    expect(phraseItem?.referenceIds).toHaveLength(6)
  })

  it("omits phrase_review when nothing is due", () => {
    const ctx = baseContext({ duePhrasesCount: 0 })
    const plan = buildDailyMission(ctx)
    expect(plan.items.some((i) => i.type === "phrase_review")).toBe(false)
  })

  it("caps the phrase_review target count at 10 even with a larger backlog", () => {
    const ctx = baseContext({
      duePhrasesCount: 25,
      duePhrases: Array.from({ length: 25 }, (_, i) => ({ id: `p${i}`, category: "daily" })),
    })
    const plan = buildDailyMission(ctx)
    const phraseItem = plan.items.find((i) => i.type === "phrase_review")
    expect(phraseItem?.targetCount).toBe(10)
  })

  it("never produces an empty mission", () => {
    const ctx = baseContext({ dailyPhraseLearned: true, availableScenarios: [], availableListeningTopics: [] })
    const plan = buildDailyMission(ctx)
    expect(plan.items.length).toBeGreaterThan(0)
  })

  it("does not surface an interview mission from a weak interview skill when no exam is active", () => {
    const ctx = baseContext({
      weakSkills: [{ skillCode: "interview.confidence", masteryScore: 10 }],
      upcomingExam: null,
    })
    const plan = buildDailyMission(ctx)
    const types = plan.items.map((i) => i.type)
    expect(types).not.toContain("interview")
    // Falls back to general speaking practice (scenario) instead of dropping
    // the weak-skill targeting entirely.
    const scenarioItem = plan.items.find((i) => i.type === "scenario")
    expect(scenarioItem?.skillCodes).toContain("interview.confidence")
  })

  it("surfaces an interview mission from a weak interview skill once an exam is active", () => {
    const ctx = baseContext({
      weakSkills: [{ skillCode: "interview.confidence", masteryScore: 10 }],
      upcomingExam: { date: "2026-09-01", type: "K-Specialist" },
    })
    const plan = buildDailyMission(ctx)
    const types = plan.items.map((i) => i.type)
    expect(types).toContain("interview")
  })

  it("excludes interview from the variety rotation when no exam is active, even if it's the most-neglected type", () => {
    const ctx = baseContext({
      recentFeatures: [
        "scenario", "scenario", "scenario",
        "listening", "listening", "listening",
        "vocab_review", "vocab_review", "vocab_review",
        "correction_review", "correction_review", "correction_review",
      ],
      upcomingExam: null,
    })
    const plan = buildDailyMission(ctx)
    expect(plan.items.map((i) => i.type)).not.toContain("interview")
  })

  it("allows interview back into the variety rotation once an exam is active", () => {
    const ctx = baseContext({
      recentFeatures: [
        "scenario", "scenario", "scenario",
        "listening", "listening", "listening",
        "vocab_review", "vocab_review", "vocab_review",
        "correction_review", "correction_review", "correction_review",
      ],
      upcomingExam: { date: "2026-09-01", type: "K-Specialist" },
    })
    const plan = buildDailyMission(ctx)
    expect(plan.items.map((i) => i.type)).toContain("interview")
  })

  it("prefers a neglected feature for the variety slot", () => {
    const ctx = baseContext({
      recentFeatures: ["scenario", "scenario", "scenario"],
      dailyPhraseLearned: true,
    })
    const plan = buildDailyMission(ctx)
    // With no due work and no weak skills, variety should pick something
    // other than the over-used "scenario" feature when possible.
    const types = plan.items.map((i) => i.type)
    expect(types.length).toBeGreaterThan(0)
    expect(types).not.toEqual(["scenario"])
  })
})
