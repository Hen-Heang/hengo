import { describe, expect, it } from "vitest"
import { planCorrectionUpsert, type ExistingCorrectionState } from "./corrections"

const NOW = new Date("2026-07-21T00:00:00.000Z")

describe("planCorrectionUpsert", () => {
  it("creates a fresh due-now card for a brand new mistake", () => {
    const plan = planCorrectionUpsert(null, { severity: "important" }, NOW)
    expect(plan.action).toBe("insert")
    expect(plan.occurrenceCount).toBe(1)
    expect(plan.state.mastery).toBe(0)
    expect(plan.state.repetitions).toBe(0)
    expect(plan.state.nextReviewDate).toBe(NOW.toISOString())
  })

  it("treats a repeated important mistake like an SRS AGAIN", () => {
    const existing: ExistingCorrectionState = {
      mastery: 70,
      easeFactor: 2.5,
      intervalDays: 30,
      repetitions: 4,
      lapses: 0,
      occurrenceCount: 1,
      nextReviewDate: "2026-08-15T00:00:00.000Z",
    }
    const plan = planCorrectionUpsert(existing, { severity: "important" }, NOW)
    expect(plan.action).toBe("update")
    expect(plan.occurrenceCount).toBe(2)
    expect(plan.state.mastery).toBeLessThan(existing.mastery)
    expect(plan.state.repetitions).toBe(0)
    expect(plan.state.lapses).toBe(1)
    // Should come back soon, not wait for the old far-future interval.
    expect(new Date(plan.state.nextReviewDate).getTime()).toBeLessThan(
      new Date(existing.nextReviewDate).getTime(),
    )
  })

  it("preserves mastery/ease/lapses for a repeated minor mistake", () => {
    const existing: ExistingCorrectionState = {
      mastery: 70,
      easeFactor: 2.6,
      intervalDays: 30,
      repetitions: 4,
      lapses: 1,
      occurrenceCount: 2,
      nextReviewDate: "2026-08-15T00:00:00.000Z",
    }
    const plan = planCorrectionUpsert(existing, { severity: "minor" }, NOW)
    expect(plan.action).toBe("update")
    expect(plan.occurrenceCount).toBe(3)
    expect(plan.state.mastery).toBe(existing.mastery)
    expect(plan.state.easeFactor).toBe(existing.easeFactor)
    expect(plan.state.repetitions).toBe(existing.repetitions)
    expect(plan.state.lapses).toBe(existing.lapses)
  })

  it("pulls a far-future minor-mistake review date closer", () => {
    const existing: ExistingCorrectionState = {
      mastery: 90,
      easeFactor: 2.8,
      intervalDays: 120,
      repetitions: 6,
      lapses: 0,
      occurrenceCount: 3,
      nextReviewDate: "2027-01-01T00:00:00.000Z",
    }
    const plan = planCorrectionUpsert(existing, { severity: "minor" }, NOW)
    const daysUntilNext =
      (new Date(plan.state.nextReviewDate).getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24)
    expect(daysUntilNext).toBeLessThanOrEqual(3)
  })

  it("does not push a near-term minor-mistake review date further out", () => {
    const nearNext = "2026-07-22T00:00:00.000Z"
    const existing: ExistingCorrectionState = {
      mastery: 40,
      easeFactor: 2.3,
      intervalDays: 1,
      repetitions: 1,
      lapses: 0,
      occurrenceCount: 1,
      nextReviewDate: nearNext,
    }
    const plan = planCorrectionUpsert(existing, { severity: "minor" }, NOW)
    expect(plan.state.nextReviewDate).toBe(nearNext)
  })

  it("never mastered a card down for a minor repeat, only an important one", () => {
    const existing: ExistingCorrectionState = {
      mastery: 95,
      easeFactor: 2.9,
      intervalDays: 200,
      repetitions: 8,
      lapses: 0,
      occurrenceCount: 5,
      nextReviewDate: "2027-06-01T00:00:00.000Z",
    }
    const minorPlan = planCorrectionUpsert(existing, { severity: "minor" }, NOW)
    expect(minorPlan.state.mastery).toBe(95)

    const importantPlan = planCorrectionUpsert(existing, { severity: "important" }, NOW)
    expect(importantPlan.state.mastery).toBeLessThan(95)
  })
})
