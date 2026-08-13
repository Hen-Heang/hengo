import { describe, expect, it } from "vitest"

import {
  computeFreeWindows,
  formatFreeWindow,
  getAvailableFocusWindows,
  isoRangeToDayMinutes,
  mergeBusyRanges,
  taskBusyRanges,
  type TimeRange,
} from "./free-time"
import type { Task } from "./tasks"

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    description: "",
    completed: false,
    user_id: "u1",
    start_date: "2026-08-12",
    end_date: "2026-08-12",
    ...overrides,
  }
}

describe("mergeBusyRanges", () => {
  it("merges overlapping and adjacent ranges, sorts unsorted input", () => {
    const merged = mergeBusyRanges([
      { start: 600, end: 660 },
      { start: 500, end: 610 }, // overlaps the first
      { start: 660, end: 700 }, // adjacent to the merged block
      { start: 900, end: 950 }, // disjoint
    ])
    expect(merged).toEqual([
      { start: 500, end: 700 },
      { start: 900, end: 950 },
    ])
  })

  it("drops zero-length or inverted ranges and clips to the day", () => {
    const merged = mergeBusyRanges([
      { start: 100, end: 100 },
      { start: -30, end: 30 },
      { start: 1430, end: 1500 },
    ])
    expect(merged).toEqual([
      { start: 0, end: 30 },
      { start: 1430, end: 1440 },
    ])
  })
})

describe("computeFreeWindows", () => {
  const dayBounds: TimeRange = { start: 7 * 60, end: 23 * 60 }

  it("returns the whole bounded day when there is no busy time", () => {
    expect(computeFreeWindows([], dayBounds)).toEqual([{ start: 420, end: 1380 }])
  })

  it("returns nothing when busy time covers the entire bounded day", () => {
    expect(computeFreeWindows([{ start: 0, end: 1440 }], dayBounds)).toEqual([])
  })

  it("produces the gaps between busy blocks — matches the spec's example shape", () => {
    // Busy 07:00-18:30 and 19:30-20:30, within 07:00-22:30 waking hours.
    const windows = computeFreeWindows(
      [
        { start: 7 * 60, end: 18 * 60 + 30 },
        { start: 19 * 60 + 30, end: 20 * 60 + 30 },
      ],
      { start: 7 * 60, end: 22 * 60 + 30 }
    )
    expect(windows.map(formatFreeWindow)).toEqual(["18:30–19:30", "20:30–22:30"])
  })

  it("drops windows shorter than minWindowMinutes", () => {
    const windows = computeFreeWindows(
      [{ start: 7 * 60, end: 22 * 60 + 55 }], // leaves only a 5-minute gap before 23:00
      dayBounds,
      { minWindowMinutes: 15 }
    )
    expect(windows).toEqual([])
  })

  it("caps the total suggested minutes across windows (e.g. remaining weekly capacity)", () => {
    const windows = computeFreeWindows(
      [{ start: 12 * 60, end: 13 * 60 }], // free 07:00-12:00 (300m) and 13:00-23:00 (600m)
      dayBounds,
      { maxTotalMinutes: 360 }
    )
    expect(windows).toEqual([
      { start: 420, end: 720 }, // full first window (300m)
      { start: 780, end: 840 }, // only 60m of the second window to hit the 360m cap
    ])
  })
})

describe("isoRangeToDayMinutes", () => {
  const date = new Date(2026, 7, 12) // Aug 12, 2026, local time

  it("converts a range fully inside the day", () => {
    const start = new Date(date)
    start.setHours(9, 0, 0, 0)
    const end = new Date(date)
    end.setHours(10, 30, 0, 0)
    expect(isoRangeToDayMinutes(start.toISOString(), end.toISOString(), date)).toEqual({
      start: 9 * 60,
      end: 10 * 60 + 30,
    })
  })

  it("clips a range that spans past midnight into the next day", () => {
    const start = new Date(date)
    start.setHours(22, 0, 0, 0)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    end.setHours(2, 0, 0, 0)
    expect(isoRangeToDayMinutes(start.toISOString(), end.toISOString(), date)).toEqual({
      start: 22 * 60,
      end: 24 * 60,
    })
  })

  it("returns null when the range doesn't overlap the day at all", () => {
    const start = new Date(date)
    start.setDate(start.getDate() + 2)
    const end = new Date(start)
    end.setHours(23, 59, 0, 0)
    expect(isoRangeToDayMinutes(start.toISOString(), end.toISOString(), date)).toBeNull()
  })
})

describe("taskBusyRanges", () => {
  it("includes timed, incomplete tasks and excludes completed and all-day tasks", () => {
    const ranges = taskBusyRanges([
      task({ id: "timed", daily_start_time: "09:00:00", daily_end_time: "10:00:00" }),
      task({ id: "completed", completed: true, daily_start_time: "11:00:00", daily_end_time: "12:00:00" }),
      task({ id: "anytime", is_anytime: true }),
    ])
    expect(ranges).toEqual([{ start: 9 * 60, end: 10 * 60 }])
  })
})

describe("getAvailableFocusWindows", () => {
  it("combines Hengo tasks and Google busy blocks for the day", () => {
    const date = new Date(2026, 7, 12)
    const isoAt = (h: number, m = 0) => {
      const d = new Date(date)
      d.setHours(h, m, 0, 0)
      return d.toISOString()
    }

    const windows = getAvailableFocusWindows({
      date,
      tasks: [task({ daily_start_time: "09:00:00", daily_end_time: "18:30:00" })],
      googleBusy: [{ start: isoAt(19, 30), end: isoAt(20, 30) }],
      dayBounds: { start: 7 * 60, end: 22 * 60 + 30 },
    })

    expect(windows.map(formatFreeWindow)).toEqual(["07:00–09:00", "18:30–19:30", "20:30–22:30"])
  })
})
