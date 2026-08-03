import { describe, expect, it } from "vitest"
import { consistencyPercent, currentStreak, daysActive, longestStreak } from "./habits"
import type { HabitCheckIn } from "./types"

function checkin(date: string, completed = true): HabitCheckIn {
  return { id: date, habitId: "h1", date, completed, createdAt: `${date}T00:00:00.000Z` }
}

describe("currentStreak", () => {
  it("is 0 with no check-ins", () => {
    expect(currentStreak([], new Date("2026-07-15T12:00:00"))).toBe(0)
  })

  it("counts consecutive days ending today", () => {
    const checkins = [checkin("2026-07-13"), checkin("2026-07-14"), checkin("2026-07-15")]
    expect(currentStreak(checkins, new Date("2026-07-15T18:00:00"))).toBe(3)
  })

  it("doesn't break the streak just because today hasn't been logged yet", () => {
    const checkins = [checkin("2026-07-13"), checkin("2026-07-14")]
    expect(currentStreak(checkins, new Date("2026-07-15T08:00:00"))).toBe(2)
  })

  it("breaks the streak once yesterday is missing too", () => {
    const checkins = [checkin("2026-07-10"), checkin("2026-07-11")]
    expect(currentStreak(checkins, new Date("2026-07-15T08:00:00"))).toBe(0)
  })

  it("an explicit incomplete row for today doesn't break yesterday's streak", () => {
    const checkins = [checkin("2026-07-14"), checkin("2026-07-15", false)]
    expect(currentStreak(checkins, new Date("2026-07-15T18:00:00"))).toBe(1)
  })
})

describe("longestStreak", () => {
  it("is 0 with no completed check-ins", () => {
    expect(longestStreak([])).toBe(0)
  })

  it("finds the longest run even if it isn't the most recent one", () => {
    const checkins = [
      checkin("2026-07-01"),
      checkin("2026-07-02"),
      checkin("2026-07-03"),
      checkin("2026-07-10"),
    ]
    expect(longestStreak(checkins)).toBe(3)
  })

  it("never decreases when a later gap breaks the current streak", () => {
    const checkins = [checkin("2026-07-01"), checkin("2026-07-02"), checkin("2026-07-10")]
    expect(longestStreak(checkins)).toBe(2)
  })
})

describe("consistencyPercent", () => {
  it("is 100 when every day since start was completed", () => {
    const checkins = [checkin("2026-07-13"), checkin("2026-07-14"), checkin("2026-07-15")]
    expect(consistencyPercent(checkins, "2026-07-13", new Date("2026-07-15T12:00:00"))).toBe(100)
  })

  it("reflects missed days without resetting to 0", () => {
    const checkins = [checkin("2026-07-13"), checkin("2026-07-15")]
    // 3 elapsed days (13, 14, 15), 2 completed -> 67%
    expect(consistencyPercent(checkins, "2026-07-13", new Date("2026-07-15T12:00:00"))).toBe(67)
  })
})

describe("daysActive", () => {
  it("is 0 on the start day", () => {
    expect(daysActive("2026-07-15T09:00:00.000Z", new Date("2026-07-15T18:00:00"))).toBe(0)
  })

  it("counts elapsed calendar days", () => {
    expect(daysActive("2026-07-01T09:00:00.000Z", new Date("2026-07-15T18:00:00"))).toBe(14)
  })
})
