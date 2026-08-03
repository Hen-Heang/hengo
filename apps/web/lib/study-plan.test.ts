import { describe, expect, it } from "vitest"

import {
  countdownTo,
  daysUntil,
  getCurrentWeek,
  EXAM_DATE,
  EXAM_DATETIME,
  STUDY_WEEKS,
} from "./study-plan"

describe("daysUntil", () => {
  it("counts whole calendar days to a future date", () => {
    expect(daysUntil("2026-08-30", new Date(2026, 7, 28))).toBe(2)
  })

  it("returns 0 on the same day regardless of time", () => {
    expect(daysUntil("2026-06-17", new Date(2026, 5, 17, 23, 59))).toBe(0)
  })

  it("is negative once the date has passed", () => {
    expect(daysUntil("2026-06-17", new Date(2026, 5, 20))).toBe(-3)
  })
})

describe("getCurrentWeek", () => {
  it("finds the week containing today", () => {
    expect(getCurrentWeek(new Date(2026, 5, 25)).id).toBe("w1") // Jun 23–29
  })

  it("clamps to the first week before the plan starts", () => {
    expect(getCurrentWeek(new Date(2026, 5, 1)).id).toBe(STUDY_WEEKS[0].id)
  })

  it("clamps to the last week after the plan ends", () => {
    expect(getCurrentWeek(new Date(2026, 8, 15)).id).toBe(STUDY_WEEKS[STUDY_WEEKS.length - 1].id)
  })

  it("keeps the exam date in sync with the plan window", () => {
    expect(EXAM_DATE).toBe("2026-08-29")
  })
})

describe("countdownTo", () => {
  it("breaks the remaining time into days/hours/minutes/seconds", () => {
    // 2 days, 3 hours, 4 minutes, 5 seconds before the exam instant.
    const target = new Date(EXAM_DATETIME).getTime()
    const now = new Date(target - ((2 * 86_400 + 3 * 3_600 + 4 * 60 + 5) * 1000))
    const cd = countdownTo(EXAM_DATETIME, now)
    expect(cd).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5, past: false })
    expect(cd.total).toBeGreaterThan(0)
  })

  it("clamps to zero and flags past once the target has passed", () => {
    const after = new Date(new Date(EXAM_DATETIME).getTime() + 1000)
    const cd = countdownTo(EXAM_DATETIME, after)
    expect(cd).toEqual({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, past: true })
  })
})
