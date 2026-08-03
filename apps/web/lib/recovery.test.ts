import { describe, expect, it } from "vitest"
import {
  daysSinceLastEvent,
  lastEventTimestamp,
  elapsedBreakdown,
  rodeOutCount,
  daysSince,
  pauseCurve,
  topPatterns,
  ratePlan,
} from "./recovery"
import type { RecoveryEvent } from "./types"

function event(partial: Partial<RecoveryEvent> & Pick<RecoveryEvent, "occurredAt">): RecoveryEvent {
  return {
    id: "e1",
    habitId: "h1",
    kind: "moment",
    createdAt: partial.occurredAt,
    ...partial,
  }
}

describe("daysSinceLastEvent", () => {
  it("returns null when there are no events", () => {
    expect(daysSinceLastEvent([], new Date("2026-07-15T12:00:00.000Z"))).toBeNull()
  })

  it("returns 0 for an event logged today (KST)", () => {
    const events = [event({ occurredAt: "2026-07-15T01:00:00.000Z" })] // 10:00 KST
    expect(daysSinceLastEvent(events, new Date("2026-07-15T12:00:00.000Z"))).toBe(0)
  })

  it("counts a slip logged at 00:30 KST as the next KST day, not the prior UTC day", () => {
    // 2026-07-14T15:30:00Z + 9h = 2026-07-15T00:30 KST
    const events = [event({ occurredAt: "2026-07-14T15:30:00.000Z" })]
    const now = new Date("2026-07-16T03:00:00.000Z") // 2026-07-16 12:00 KST
    expect(daysSinceLastEvent(events, now)).toBe(1) // KST day 07-15 -> 07-16 is 1 day
  })

  it("uses the most recent event when several exist", () => {
    const events = [
      event({ occurredAt: "2026-07-01T00:00:00.000Z" }),
      event({ occurredAt: "2026-07-14T00:00:00.000Z" }),
      event({ occurredAt: "2026-07-05T00:00:00.000Z" }),
    ]
    expect(daysSinceLastEvent(events, new Date("2026-07-15T00:00:00.000Z"))).toBe(1)
  })

  it("models an 81-day gap correctly", () => {
    const events = [event({ occurredAt: "2026-03-01T00:00:00.000Z" })]
    const now = new Date("2026-05-21T00:00:00.000Z") // 81 days later
    expect(daysSinceLastEvent(events, now)).toBe(81)
  })
})

describe("rodeOutCount", () => {
  const events = [
    event({ occurredAt: "2026-07-01T00:00:00.000Z", rodeOut: true }),
    event({ occurredAt: "2026-07-02T00:00:00.000Z", rodeOut: false }),
    event({ occurredAt: "2026-07-03T00:00:00.000Z", rodeOut: true }),
    event({ occurredAt: "2026-07-04T00:00:00.000Z", kind: "slip", rodeOut: undefined }),
  ]

  it("counts only events where rodeOut is true", () => {
    expect(rodeOutCount(events)).toBe(2)
  })

  it("grows even on a day with a slip logged (slip itself doesn't subtract)", () => {
    const withSlip = [...events, event({ occurredAt: "2026-07-05T00:00:00.000Z", kind: "slip" })]
    expect(rodeOutCount(withSlip)).toBe(2)
  })

  it("respects a since cutoff", () => {
    expect(rodeOutCount(events, new Date("2026-07-03T00:00:00.000Z"))).toBe(1)
  })
})

describe("daysSince (tertiary streak)", () => {
  it("counts from startedAt when there is no slip yet", () => {
    expect(daysSince("2026-07-01T00:00:00.000Z", null, new Date("2026-07-05T00:00:00.000Z"))).toBe(4)
  })

  it("counts from the last slip once one has happened", () => {
    expect(
      daysSince("2026-07-01T00:00:00.000Z", "2026-07-10T00:00:00.000Z", new Date("2026-07-12T00:00:00.000Z")),
    ).toBe(2)
  })

  it("is timezone-correct for a slip logged at 00:30 KST", () => {
    const lastSlip = "2026-07-14T15:30:00.000Z" // 2026-07-15 00:30 KST
    const now = new Date("2026-07-16T03:00:00.000Z") // 2026-07-16 12:00 KST
    expect(daysSince("2026-01-01T00:00:00.000Z", lastSlip, now)).toBe(1)
  })
})

describe("pauseCurve", () => {
  it("starts at 0", () => {
    expect(pauseCurve(0, 300)).toBe(0)
  })

  it("ends at 0", () => {
    expect(pauseCurve(300, 300)).toBeCloseTo(0, 5)
  })

  it("peaks at 1 around 40% elapsed", () => {
    expect(pauseCurve(120, 300)).toBeCloseTo(1, 5) // 120/300 = 0.4
  })

  it("is lower at 20% and 70% than at the 40% peak", () => {
    const at20 = pauseCurve(60, 300)
    const at40 = pauseCurve(120, 300)
    const at70 = pauseCurve(210, 300)
    expect(at20).toBeLessThan(at40)
    expect(at70).toBeLessThan(at40)
  })

  it("clamps outside [0, total]", () => {
    expect(pauseCurve(-10, 300)).toBe(0)
    expect(pauseCurve(400, 300)).toBeCloseTo(0, 5)
  })
})

describe("topPatterns", () => {
  it("returns nulls for no events", () => {
    expect(topPatterns([])).toEqual({ topHour: null, topTriggerId: null, topEmotion: null })
  })

  it("finds the most common KST hour bucket, trigger, and emotion", () => {
    const events = [
      event({ occurredAt: "2026-07-01T13:00:00.000Z", triggerId: "t1", emotion: "stressed" }), // 22:00 KST
      event({ occurredAt: "2026-07-02T13:05:00.000Z", triggerId: "t1", emotion: "bored" }), // 22:05 KST
      event({ occurredAt: "2026-07-03T02:00:00.000Z", triggerId: "t2", emotion: "stressed" }), // 11:00 KST
    ]
    expect(topPatterns(events)).toEqual({ topHour: 22, topTriggerId: "t1", topEmotion: "stressed" })
  })
})

describe("ratePlan (rating adapter over lib/srs.ts)", () => {
  const fresh = { easeFactor: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, mastery: 0 }

  it("maps 'skipped' to a full reset like AGAIN", () => {
    const result = ratePlan(fresh, "skipped")
    expect(result.repetitions).toBe(0)
    expect(result.intervalDays).toBe(0)
    expect(result.lapses).toBe(1)
  })

  it("maps 'followed' to progress like GOOD", () => {
    const result = ratePlan(fresh, "followed")
    expect(result.repetitions).toBe(1)
    expect(result.intervalDays).toBeGreaterThan(0)
  })

  it("maps 'followed_easily' to a longer interval than 'followed'", () => {
    const good = ratePlan(fresh, "followed")
    const easy = ratePlan(fresh, "followed_easily")
    expect(easy.intervalDays).toBeGreaterThanOrEqual(good.intervalDays)
  })
})

describe("lastEventTimestamp", () => {
  it("returns null for no events", () => {
    expect(lastEventTimestamp([])).toBeNull()
  })

  it("returns the most recent occurredAt across kinds", () => {
    const events = [
      event({ occurredAt: "2026-07-01T00:00:00.000Z" }),
      event({ occurredAt: "2026-07-14T00:00:00.000Z", kind: "slip" }),
      event({ occurredAt: "2026-07-05T00:00:00.000Z" }),
    ]
    expect(lastEventTimestamp(events)).toBe("2026-07-14T00:00:00.000Z")
  })
})

describe("elapsedBreakdown", () => {
  it("returns all zeros for no elapsed time", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    expect(elapsedBreakdown(now.toISOString(), now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it("breaks a mixed duration into days/hours/minutes/seconds", () => {
    const since = "2026-07-10T10:00:00.000Z"
    // 2 days, 3 hours, 4 minutes, 5 seconds later
    const now = new Date("2026-07-12T13:04:05.000Z")
    expect(elapsedBreakdown(since, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
  })

  it("clamps to zero if now is before since (clock skew)", () => {
    const since = "2026-07-15T12:00:00.000Z"
    const now = new Date("2026-07-15T11:00:00.000Z")
    expect(elapsedBreakdown(since, now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})
