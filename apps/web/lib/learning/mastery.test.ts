import { describe, expect, it } from "vitest"
import { calculateUpdatedMastery } from "./mastery"

describe("calculateUpdatedMastery", () => {
  it("moves a fresh skill a large step toward the first attempt's score", () => {
    const next = calculateUpdatedMastery({ currentMastery: 0, attemptScore: 80, attemptCount: 0 })
    expect(next).toBeGreaterThan(30)
    expect(next).toBeLessThan(80)
  })

  it("trends upward over repeated strong attempts", () => {
    let mastery = 20
    for (let i = 0; i < 8; i++) {
      mastery = calculateUpdatedMastery({ currentMastery: mastery, attemptScore: 95, attemptCount: i })
    }
    expect(mastery).toBeGreaterThan(70)
  })

  it("trends downward over repeated weak attempts", () => {
    let mastery = 80
    for (let i = 0; i < 8; i++) {
      mastery = calculateUpdatedMastery({ currentMastery: mastery, attemptScore: 10, attemptCount: i })
    }
    expect(mastery).toBeLessThan(40)
  })

  it("never exceeds 100 or drops below 0", () => {
    let mastery = 0
    for (let i = 0; i < 20; i++) {
      mastery = calculateUpdatedMastery({ currentMastery: mastery, attemptScore: 100, attemptCount: i })
    }
    expect(mastery).toBeLessThanOrEqual(100)

    let low = 100
    for (let i = 0; i < 20; i++) {
      low = calculateUpdatedMastery({ currentMastery: low, attemptScore: 0, attemptCount: i })
    }
    expect(low).toBeGreaterThanOrEqual(0)
  })

  it("clamps out-of-range inputs instead of producing invalid output", () => {
    const next = calculateUpdatedMastery({ currentMastery: 150, attemptScore: -20, attemptCount: 5 })
    expect(next).toBeGreaterThanOrEqual(0)
    expect(next).toBeLessThanOrEqual(100)
  })

  it("weighs a hard-difficulty attempt more than an easy one", () => {
    const hard = calculateUpdatedMastery({ currentMastery: 50, attemptScore: 90, attemptCount: 5, difficulty: "hard" })
    const easy = calculateUpdatedMastery({ currentMastery: 50, attemptScore: 90, attemptCount: 5, difficulty: "easy" })
    expect(hard).toBeGreaterThan(easy)
  })

  it("gives low-confidence evidence less influence than full-confidence evidence", () => {
    const lowConfidence = calculateUpdatedMastery({
      currentMastery: 50,
      attemptScore: 90,
      attemptCount: 5,
      confidence: 0.2,
    })
    const fullConfidence = calculateUpdatedMastery({
      currentMastery: 50,
      attemptScore: 90,
      attemptCount: 5,
      confidence: 1,
    })
    expect(Math.abs(lowConfidence - 50)).toBeLessThan(Math.abs(fullConfidence - 50))
  })

  it("a single attempt does not prove mastery — one 100 from 0 stays under 100", () => {
    const next = calculateUpdatedMastery({ currentMastery: 0, attemptScore: 100, attemptCount: 0 })
    expect(next).toBeLessThan(100)
  })
})
