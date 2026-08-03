import { describe, expect, it } from "vitest"

import {
  averageTimeToReturnHours,
  bestRecoveryStreak,
  checkInCompletionPercent,
  copingEffectiveness,
  currentRecoveryStreak,
  frequencyReductionPercent,
  highestRiskTimeRange,
  recoveryMomentum,
} from "./recovery"
import type { DailyCheckIn, RecoveryEvent } from "./types"

function event(id: string, habitId: string, occurredAt: string, data: Partial<RecoveryEvent> = {}): RecoveryEvent {
  return { id, habitId, occurredAt, createdAt: occurredAt, kind: "moment", ...data }
}

function checkIn(id: string, habitId: string, date: string): DailyCheckIn {
  return { id, habitId, date, period: "minimal", healthyHabitsCompleted: [], createdAt: `${date}T00:00:00Z`, updatedAt: `${date}T00:00:00Z` }
}

describe("recovery analytics", () => {
  const now = new Date("2026-07-19T03:00:00Z") // noon KST

  it("calculates current and best streaks without deleting historical progress", () => {
    const events = [
      event("s1", "h1", "2026-07-05T03:00:00Z", { kind: "slip" }),
      event("w1", "h1", "2026-07-06T03:00:00Z", { kind: "win", rodeOut: true }),
      event("s2", "h1", "2026-07-15T03:00:00Z", { kind: "slip" }),
    ]
    expect(currentRecoveryStreak(events, "2026-07-01T03:00:00Z", now)).toBe(4)
    expect(bestRecoveryStreak(events, "2026-07-01T03:00:00Z", now)).toBe(10)
    expect(events).toHaveLength(3)
  })

  it("supports frequency reduction without assuming missing days were safe", () => {
    const events = [event("s1", "h1", "2026-07-10T03:00:00Z", { kind: "slip" }), event("s2", "h1", "2026-07-17T03:00:00Z", { kind: "slip" })]
    expect(frequencyReductionPercent(2, events, 28, now, "h1")).toBe(75)
  })

  it("never penalizes honest lapse reporting in the momentum formula", () => {
    const checkIns = [checkIn("c1", "h1", "2026-07-19")]
    const plain = recoveryMomentum([], checkIns, now)
    const honest = recoveryMomentum([event("s1", "h1", "2026-07-19T01:00:00Z", { kind: "slip", note: "One useful lesson" })], checkIns, now)
    expect(honest.score).toBeGreaterThanOrEqual(plain.score)
    expect(honest.factors.find((factor) => factor.key === "honest_reflections")?.points).toBe(5)
  })

  it("calculates time to return after a lapse", () => {
    const events = [event("s1", "h1", "2026-07-17T00:00:00Z", { kind: "slip" }), event("c1", "h1", "2026-07-17T06:00:00Z", { kind: "moment" })]
    expect(averageTimeToReturnHours(events)).toBe(6)
  })

  it("detects the highest-risk two-hour window in the user's timezone", () => {
    const events = [event("e1", "h1", "2026-07-18T14:10:00Z"), event("e2", "h1", "2026-07-17T14:40:00Z"), event("e3", "h1", "2026-07-18T01:00:00Z")]
    expect(highestRiskTimeRange(events, "Asia/Seoul")).toEqual({ startHour: 22, endHour: 0, count: 2 })
  })

  it("ranks coping actions by recorded effectiveness", () => {
    const events = [event("e1", "h1", "2026-07-18T01:00:00Z", { actionTaken: "Walk", rodeOut: true }), event("e2", "h1", "2026-07-18T02:00:00Z", { actionTaken: "Walk", rodeOut: false }), event("e3", "h1", "2026-07-18T03:00:00Z", { actionTaken: "Korean review", healthyActionCompleted: true })]
    expect(copingEffectiveness(events)).toEqual([
      { action: "Korean review", attempts: 1, successful: 1, successRate: 100 },
      { action: "Walk", attempts: 2, successful: 1, successRate: 50 },
    ])
  })

  it("keeps multiple targets isolated", () => {
    const events = [event("a", "h1", "2026-07-18T01:00:00Z", { kind: "slip" }), event("b", "h2", "2026-07-10T01:00:00Z", { kind: "slip" })]
    expect(currentRecoveryStreak(events, "2026-07-01T00:00:00Z", now, "Asia/Seoul", "h1")).toBe(1)
    expect(currentRecoveryStreak(events, "2026-07-01T00:00:00Z", now, "Asia/Seoul", "h2")).toBe(9)
  })

  it("uses unique local dates for check-in completion", () => {
    const checkIns = [checkIn("a", "h1", "2026-07-19"), { ...checkIn("b", "h1", "2026-07-19"), period: "evening" as const }, checkIn("c", "h1", "2026-07-18")]
    expect(checkInCompletionPercent(checkIns, 7, now, "Asia/Seoul", "h1")).toBe(29)
  })
})
