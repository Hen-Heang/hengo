import { describe, expect, it } from "vitest"

import { applyRating, formatInterval, isDue, previewIntervalDays } from "./srs"

const newCard = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 }

describe("previewIntervalDays", () => {
  it("schedules a new card 1d on Good, 4d on Easy, today on Again", () => {
    expect(previewIntervalDays(newCard, "AGAIN")).toBe(0)
    expect(previewIntervalDays(newCard, "HARD")).toBe(1)
    expect(previewIntervalDays(newCard, "GOOD")).toBe(1)
    expect(previewIntervalDays(newCard, "EASY")).toBe(4)
  })

  it("uses the 3-day graduating step on the second Good", () => {
    const card = { easeFactor: 2.5, intervalDays: 1, repetitions: 1 }
    expect(previewIntervalDays(card, "GOOD")).toBe(3)
    expect(previewIntervalDays(card, "EASY")).toBe(7)
  })

  it("multiplies by ease for mature cards", () => {
    const card = { easeFactor: 2.5, intervalDays: 10, repetitions: 4 }
    expect(previewIntervalDays(card, "GOOD")).toBe(25) // 10 × 2.5
    expect(previewIntervalDays(card, "HARD")).toBe(12) // 10 × 1.2
    expect(previewIntervalDays(card, "EASY")).toBe(34) // 10 × 2.65 × 1.3, rounded
  })

  it("always grows the interval by at least one day on a pass", () => {
    const card = { easeFactor: 1.3, intervalDays: 1, repetitions: 5 }
    expect(previewIntervalDays(card, "GOOD")).toBeGreaterThan(1)
    expect(previewIntervalDays(card, "HARD")).toBeGreaterThan(1)
  })

  it("caps the interval at one year", () => {
    const card = { easeFactor: 2.5, intervalDays: 300, repetitions: 9 }
    expect(previewIntervalDays(card, "GOOD")).toBe(365)
  })

  it("treats corrupt ease values as the starting ease", () => {
    const card = { easeFactor: 0, intervalDays: 10, repetitions: 3 }
    expect(previewIntervalDays(card, "GOOD")).toBe(25)
  })
})

describe("applyRating", () => {
  const matureCard = { easeFactor: 2.5, intervalDays: 10, repetitions: 4, lapses: 0, mastery: 50 }

  it("resets repetitions, drops ease by 0.2, adds a lapse, and lowers mastery on Again", () => {
    const result = applyRating(matureCard, "AGAIN")
    expect(result.repetitions).toBe(0)
    expect(result.intervalDays).toBe(0)
    expect(result.easeFactor).toBe(2.3)
    expect(result.lapses).toBe(1)
    expect(result.mastery).toBe(35)
  })

  it("drops ease by 0.15, grows repetitions, and doesn't add a lapse on Hard", () => {
    const result = applyRating(matureCard, "HARD")
    expect(result.easeFactor).toBe(2.35)
    expect(result.repetitions).toBe(5)
    expect(result.lapses).toBe(0)
    expect(result.mastery).toBe(55)
  })

  it("leaves ease unchanged and grows repetitions on Good", () => {
    const result = applyRating(matureCard, "GOOD")
    expect(result.easeFactor).toBe(2.5)
    expect(result.repetitions).toBe(5)
    expect(result.mastery).toBe(60)
  })

  it("raises ease by 0.15 on Easy", () => {
    const result = applyRating(matureCard, "EASY")
    expect(result.easeFactor).toBe(2.65)
    expect(result.repetitions).toBe(5)
    expect(result.mastery).toBe(65)
  })

  it("floors ease at 1.3 and treats corrupt ease as the starting ease before applying the delta", () => {
    const flooredCard = { easeFactor: 1.35, intervalDays: 5, repetitions: 2, lapses: 0, mastery: 50 }
    expect(applyRating(flooredCard, "AGAIN").easeFactor).toBe(1.3)

    const corruptCard = { easeFactor: 0, intervalDays: 10, repetitions: 3, lapses: 0, mastery: 50 }
    expect(applyRating(corruptCard, "GOOD").easeFactor).toBe(2.5)
  })

  it("clamps mastery to the 0–100 range", () => {
    const lowMastery = { ...matureCard, mastery: 5 }
    expect(applyRating(lowMastery, "AGAIN").mastery).toBe(0)

    const highMastery = { ...matureCard, mastery: 95 }
    expect(applyRating(highMastery, "EASY").mastery).toBe(100)
  })

  it("never lets lapses or mastery go negative from a corrupt starting state", () => {
    const corrupt = { easeFactor: 2.5, intervalDays: 10, repetitions: 4, lapses: -3, mastery: -10 }
    const result = applyRating(corrupt, "HARD")
    expect(result.lapses).toBe(0)
    expect(result.mastery).toBe(0)
  })

  it("sets nextReview to today plus the computed interval", () => {
    const result = applyRating(matureCard, "GOOD")
    const expected = new Date()
    expected.setDate(expected.getDate() + result.intervalDays)
    expect(result.nextReview.slice(0, 10)).toBe(expected.toISOString().slice(0, 10))
  })
})

describe("isDue", () => {
  const now = new Date("2026-07-14T12:00:00.000Z")

  it("is due when next_review is in the past", () => {
    expect(isDue("2026-07-14T11:59:59.000Z", now)).toBe(true)
  })

  it("is due exactly at the boundary", () => {
    expect(isDue(now.toISOString(), now)).toBe(true)
  })

  it("is not due when next_review is in the future", () => {
    expect(isDue("2026-07-15T00:00:00.000Z", now)).toBe(false)
  })
})

describe("formatInterval", () => {
  it("formats days, months, and years compactly", () => {
    expect(formatInterval(0)).toBe("Today")
    expect(formatInterval(1)).toBe("1d")
    expect(formatInterval(29)).toBe("29d")
    expect(formatInterval(30)).toBe("1mo")
    expect(formatInterval(75)).toBe("2.5mo")
    expect(formatInterval(365)).toBe("1y")
  })
})
