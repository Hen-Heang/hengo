import { describe, expect, it } from "vitest"

import {
  GOOGLE_CALENDAR_COLOR,
  toCalendarTask,
  type ExternalCalendarEvent,
} from "./external-calendar"

function event(overrides: Partial<ExternalCalendarEvent> = {}): ExternalCalendarEvent {
  return {
    id: "evt-1",
    source: "google",
    calendarId: "primary",
    title: "1:1 with manager",
    start: "2026-08-12T09:00:00+09:00",
    end: "2026-08-12T09:30:00+09:00",
    allDay: false,
    readOnly: true,
    ...overrides,
  }
}

// The adapter derives daily_start_time/end from local wall-clock time (same
// as WeekTimeGrid's own hour grid), so expectations are computed the same
// way rather than hardcoded — this test must pass regardless of the runner's
// timezone.
function localHHMMSS(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`
}

describe("toCalendarTask", () => {
  it("marks the result as an external, read-only Hengo-blue task", () => {
    const task = toCalendarTask(event())
    expect(task.externalSource).toBe("google")
    expect(task.id).toBe("google:evt-1")
    expect(task.color).toBe(GOOGLE_CALENDAR_COLOR)
    expect(task.completed).toBe(false)
  })

  it("derives daily_start_time/end from a timed event in local time", () => {
    const e = event()
    const task = toCalendarTask(e)
    expect(task.is_anytime).toBe(false)
    expect(task.start_date).toBe(e.start)
    expect(task.end_date).toBe(e.end)
    expect(task.daily_start_time).toBe(localHHMMSS(e.start))
    expect(task.daily_end_time).toBe(localHHMMSS(e.end))
  })

  it("treats an all-day event as anytime with no daily times", () => {
    const task = toCalendarTask(event({ allDay: true, start: "2026-08-15", end: "2026-08-16" }))
    expect(task.is_anytime).toBe(true)
    expect(task.daily_start_time).toBeNull()
    expect(task.daily_end_time).toBeNull()
  })

  it("converts Google's exclusive all-day end date to Hengo's inclusive convention", () => {
    // A single-day all-day event: Google reports end = the day after.
    const oneDay = toCalendarTask(event({ allDay: true, start: "2026-08-15", end: "2026-08-16" }))
    expect(oneDay.start_date).toBe("2026-08-15")
    expect(oneDay.end_date).toBe("2026-08-15")

    // A 3-day trip (Aug 15-17 inclusive): Google reports end = Aug 18.
    const threeDay = toCalendarTask(event({ allDay: true, start: "2026-08-15", end: "2026-08-18" }))
    expect(threeDay.end_date).toBe("2026-08-17")
  })
})
