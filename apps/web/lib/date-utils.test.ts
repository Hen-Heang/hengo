import { describe, expect, it } from "vitest"

import {
  endOfLocalDay,
  endOfLocalMonth,
  endOfLocalWeek,
  formatRangeLabel,
  localRangeFor,
  shiftAnchorDate,
  startOfLocalDay,
  startOfLocalMonth,
  startOfLocalWeek,
  toLocalDateString,
} from "./date-utils"

describe("toLocalDateString", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(toLocalDateString(new Date(2026, 6, 5))).toBe("2026-07-05")
  })

  it("pads single-digit month/day", () => {
    expect(toLocalDateString(new Date(2026, 0, 9))).toBe("2026-01-09")
  })
})

describe("startOfLocalDay / endOfLocalDay", () => {
  it("returns local midnight and the last millisecond of the day", () => {
    const d = new Date(2026, 6, 15, 14, 30, 0)
    expect(startOfLocalDay(d).getHours()).toBe(0)
    expect(startOfLocalDay(d).getDate()).toBe(15)
    expect(endOfLocalDay(d).getDate()).toBe(15)
    expect(endOfLocalDay(d).getHours()).toBe(23)
  })
})

describe("startOfLocalWeek / endOfLocalWeek", () => {
  it("starts on Sunday and ends on Saturday", () => {
    // 2026-07-15 is a Wednesday
    const d = new Date(2026, 6, 15)
    const start = startOfLocalWeek(d)
    const end = endOfLocalWeek(d)
    expect(start.getDay()).toBe(0)
    expect(end.getDay()).toBe(6)
    expect(start.getDate()).toBe(12)
    expect(end.getDate()).toBe(18)
  })
})

describe("startOfLocalMonth / endOfLocalMonth", () => {
  it("spans the full calendar month", () => {
    const d = new Date(2026, 1, 10) // February 2026 (28 days, not a leap year)
    expect(startOfLocalMonth(d).getDate()).toBe(1)
    expect(endOfLocalMonth(d).getDate()).toBe(28)
  })
})

describe("localRangeFor", () => {
  it("returns the day range for granularity=day", () => {
    const d = new Date(2026, 6, 15)
    const { start, end } = localRangeFor(d, "day")
    expect(start.getDate()).toBe(15)
    expect(end.getDate()).toBe(15)
  })

  it("returns the week range for granularity=week", () => {
    const d = new Date(2026, 6, 15)
    const { start, end } = localRangeFor(d, "week")
    expect(start.getDay()).toBe(0)
    expect(end.getDay()).toBe(6)
  })

  it("returns the month range for granularity=month", () => {
    const d = new Date(2026, 6, 15)
    const { start, end } = localRangeFor(d, "month")
    expect(start.getDate()).toBe(1)
    expect(end.getMonth()).toBe(6)
  })
})

describe("shiftAnchorDate", () => {
  it("shifts by one day", () => {
    expect(shiftAnchorDate(new Date(2026, 6, 15), "day", 1).getDate()).toBe(16)
    expect(shiftAnchorDate(new Date(2026, 6, 15), "day", -1).getDate()).toBe(14)
  })

  it("shifts by one week", () => {
    expect(shiftAnchorDate(new Date(2026, 6, 15), "week", 1).getDate()).toBe(22)
  })

  it("shifts by one month", () => {
    expect(shiftAnchorDate(new Date(2026, 6, 15), "month", 1).getMonth()).toBe(7)
  })
})

describe("formatRangeLabel", () => {
  const now = new Date(2026, 6, 15)

  it("labels today and yesterday specially for day granularity", () => {
    expect(formatRangeLabel(now, "day", now)).toBe("Today")
    expect(formatRangeLabel(new Date(2026, 6, 14), "day", now)).toBe("Yesterday")
  })

  it("falls back to a short date for other days", () => {
    expect(formatRangeLabel(new Date(2026, 6, 1), "day", now)).toContain("Jul")
  })

  it("labels a week as a start–end range", () => {
    expect(formatRangeLabel(now, "week", now)).toMatch(/–/)
  })

  it("labels a month as 'Month Year'", () => {
    expect(formatRangeLabel(now, "month", now)).toBe("July 2026")
  })
})
