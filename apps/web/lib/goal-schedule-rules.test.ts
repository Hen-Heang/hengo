import { describe, expect, it } from "vitest"
import {
  describeRecurrence,
  endTimeFor,
  generateOccurrences,
  rollingWindow,
  scheduleRuleInputSchema,
  weekdayOf,
  type OccurrenceRule,
} from "./goal-schedule-rules"

const rule = (overrides: Partial<OccurrenceRule>): OccurrenceRule => ({
  recurrence_type: "daily",
  recurrence_interval: 1,
  start_date: "2026-07-01",
  end_date: null,
  ...overrides,
})

// 2026-07-01 is a Wednesday.
describe("weekdayOf", () => {
  it("reads the civil weekday, not the local one", () => {
    expect(weekdayOf("2026-07-01")).toBe(3)
    expect(weekdayOf("2026-07-05")).toBe(0)
  })
})

describe("daily recurrence", () => {
  it("fires every day inside the window", () => {
    expect(
      generateOccurrences(rule({}), { from: "2026-07-01", to: "2026-07-05" }),
    ).toEqual(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05"])
  })

  it("honours the interval and stays on the rule's own cycle", () => {
    // Window starts mid-cycle (Jul 2 is an off day for an every-3-days rule
    // anchored on Jul 1) — the first hit must snap forward to Jul 4, not Jul 2.
    expect(
      generateOccurrences(rule({ recurrence_interval: 3 }), { from: "2026-07-02", to: "2026-07-10" }),
    ).toEqual(["2026-07-04", "2026-07-07", "2026-07-10"])
  })

  it("never fires before the rule start date", () => {
    expect(
      generateOccurrences(rule({ start_date: "2026-07-10" }), { from: "2026-07-01", to: "2026-07-11" }),
    ).toEqual(["2026-07-10", "2026-07-11"])
  })

  it("never fires after the rule end date", () => {
    expect(
      generateOccurrences(rule({ end_date: "2026-07-03" }), { from: "2026-07-01", to: "2026-07-31" }),
    ).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"])
  })

  it("crosses a month boundary correctly", () => {
    expect(
      generateOccurrences(rule({ start_date: "2026-07-30" }), { from: "2026-07-30", to: "2026-08-02" }),
    ).toEqual(["2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"])
  })
})

describe("weekly recurrence", () => {
  it("fires on the selected weekdays only", () => {
    expect(
      generateOccurrences(
        rule({ recurrence_type: "weekly", days_of_week: [1, 3, 5] }),
        { from: "2026-07-01", to: "2026-07-12" },
      ),
    ).toEqual([
      "2026-07-01", // Wed
      "2026-07-03", // Fri
      "2026-07-06", // Mon
      "2026-07-08",
      "2026-07-10",
    ])
  })

  it("skips off-cycle weeks when the interval is > 1", () => {
    const dates = generateOccurrences(
      rule({ recurrence_type: "weekly", recurrence_interval: 2, days_of_week: [1] }),
      { from: "2026-07-01", to: "2026-08-01" },
    )
    // Anchor week is the week of Jul 1 (Sun Jun 28). Mondays: Jun 29 (before
    // rule start), Jul 13, Jul 27.
    expect(dates).toEqual(["2026-07-13", "2026-07-27"])
  })

  it("returns nothing when no weekday is selected", () => {
    expect(
      generateOccurrences(rule({ recurrence_type: "weekly", days_of_week: [] }), {
        from: "2026-07-01",
        to: "2026-07-31",
      }),
    ).toEqual([])
  })

  it("deduplicates repeated weekday values", () => {
    expect(
      generateOccurrences(rule({ recurrence_type: "weekly", days_of_week: [3, 3, 3] }), {
        from: "2026-07-01",
        to: "2026-07-08",
      }),
    ).toEqual(["2026-07-01", "2026-07-08"])
  })
})

describe("monthly recurrence", () => {
  it("fires on the requested day each month", () => {
    expect(
      generateOccurrences(
        rule({ recurrence_type: "monthly", day_of_month: 15, start_date: "2026-07-01" }),
        { from: "2026-07-01", to: "2026-09-30" },
      ),
    ).toEqual(["2026-07-15", "2026-08-15", "2026-09-15"])
  })

  it("skips months that are too short rather than clamping", () => {
    // Feb 2027 has 28 days — the 31st is skipped, not moved to the 28th.
    expect(
      generateOccurrences(
        rule({ recurrence_type: "monthly", day_of_month: 31, start_date: "2027-01-01" }),
        { from: "2027-01-01", to: "2027-04-30" },
      ),
    ).toEqual(["2027-01-31", "2027-03-31"])
  })

  it("handles a leap-year February", () => {
    expect(
      generateOccurrences(
        rule({ recurrence_type: "monthly", day_of_month: 29, start_date: "2028-01-01" }),
        { from: "2028-02-01", to: "2028-02-29" },
      ),
    ).toEqual(["2028-02-29"])
  })

  it("honours a multi-month interval", () => {
    expect(
      generateOccurrences(
        rule({ recurrence_type: "monthly", day_of_month: 1, recurrence_interval: 3, start_date: "2026-07-01" }),
        { from: "2026-07-01", to: "2027-02-28" },
      ),
    ).toEqual(["2026-07-01", "2026-10-01", "2027-01-01"])
  })
})

describe("boundaries", () => {
  it("clamps to the goal window", () => {
    expect(
      generateOccurrences(
        rule({}),
        { from: "2026-07-01", to: "2026-07-10" },
        { goalStartDate: "2026-07-03", goalTargetDate: "2026-07-05" },
      ),
    ).toEqual(["2026-07-03", "2026-07-04", "2026-07-05"])
  })

  it("returns nothing when the goal window and the rule window don't overlap", () => {
    expect(
      generateOccurrences(
        rule({ start_date: "2026-09-01" }),
        { from: "2026-09-01", to: "2026-09-30" },
        { goalTargetDate: "2026-08-01" },
      ),
    ).toEqual([])
  })

  it("returns nothing for an inverted window", () => {
    expect(generateOccurrences(rule({}), { from: "2026-07-10", to: "2026-07-01" })).toEqual([])
  })

  it("never exceeds the requested limit", () => {
    const dates = generateOccurrences(rule({}), { from: "2026-01-01", to: "2026-12-31" }, { limit: 5 })
    expect(dates).toHaveLength(5)
  })

  it("caps unbounded generation even without an explicit limit", () => {
    const dates = generateOccurrences(rule({}), { from: "2020-01-01", to: "2030-12-31" })
    expect(dates.length).toBeLessThanOrEqual(200)
  })

  it("produces no duplicate dates", () => {
    const dates = generateOccurrences(
      rule({ recurrence_type: "weekly", days_of_week: [0, 1, 2, 3, 4, 5, 6] }),
      { from: "2026-07-01", to: "2026-07-31" },
    )
    expect(new Set(dates).size).toBe(dates.length)
  })

  it("is timezone-independent (KST- and DST-safe)", () => {
    // The engine only ever does UTC-anchored civil-date math, so a runtime in
    // a UTC+9 zone, a UTC-8 zone, or a DST-observing zone all agree. Simulated
    // by asserting the boundary dates land exactly on the requested civil days
    // regardless of the host clock offset, which no local-time code path could
    // guarantee.
    const spring = generateOccurrences(
      rule({ recurrence_type: "weekly", days_of_week: [0], start_date: "2026-03-01" }),
      { from: "2026-03-01", to: "2026-03-31" },
    )
    expect(spring).toEqual(["2026-03-01", "2026-03-08", "2026-03-15", "2026-03-22", "2026-03-29"])
    expect(new Date(`${spring[2]}T00:00:00Z`).getUTCDay()).toBe(0)
  })
})

describe("rollingWindow", () => {
  it("covers exactly 14 days including today", () => {
    expect(rollingWindow("2026-07-24")).toEqual({ from: "2026-07-24", to: "2026-08-06" })
  })
})

describe("scheduleRuleInputSchema", () => {
  const base = {
    title: "Morning speaking drill",
    recurrence_type: "weekly" as const,
    recurrence_interval: 1,
    start_date: "2026-07-01",
  }

  it("requires at least one weekday for weekly rules", () => {
    expect(scheduleRuleInputSchema.safeParse(base).success).toBe(false)
    expect(scheduleRuleInputSchema.safeParse({ ...base, days_of_week: [1] }).success).toBe(true)
  })

  it("requires a day of month for monthly rules", () => {
    expect(
      scheduleRuleInputSchema.safeParse({ ...base, recurrence_type: "monthly" }).success,
    ).toBe(false)
    expect(
      scheduleRuleInputSchema.safeParse({ ...base, recurrence_type: "monthly", day_of_month: 5 }).success,
    ).toBe(true)
  })

  it("rejects an end date before the start date", () => {
    expect(
      scheduleRuleInputSchema.safeParse({
        ...base,
        days_of_week: [1],
        end_date: "2026-06-01",
      }).success,
    ).toBe(false)
  })

  it("rejects out-of-range weekdays, non-positive durations and interval 0", () => {
    expect(scheduleRuleInputSchema.safeParse({ ...base, days_of_week: [7] }).success).toBe(false)
    expect(
      scheduleRuleInputSchema.safeParse({ ...base, days_of_week: [1], duration_minutes: 0 }).success,
    ).toBe(false)
    expect(
      scheduleRuleInputSchema.safeParse({ ...base, days_of_week: [1], recurrence_interval: 0 }).success,
    ).toBe(false)
  })
})

describe("describeRecurrence / endTimeFor", () => {
  it("summarises cadence in plain language", () => {
    expect(describeRecurrence(rule({}))).toBe("Every day")
    expect(describeRecurrence(rule({ recurrence_interval: 3 }))).toBe("Every 3 days")
    expect(
      describeRecurrence(rule({ recurrence_type: "weekly", days_of_week: [1, 3] })),
    ).toBe("Every week · Mon, Wed")
    expect(
      describeRecurrence(rule({ recurrence_type: "monthly", day_of_month: 12 })),
    ).toBe("Every month · day 12")
  })

  it("derives an end time and clamps at end of day", () => {
    expect(endTimeFor("07:00", 45)).toBe("07:45")
    expect(endTimeFor("23:30", 120)).toBe("23:59")
  })
})
