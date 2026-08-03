import { describe, expect, it } from "vitest"
import {
  findScheduleConflicts,
  isScheduled,
  summarizeWeek,
  taskEffortMinutes,
  weekStartOf,
} from "./weekly-capacity"
import type { Task } from "./tasks"

let seq = 0
const task = (overrides: Partial<Task> = {}): Task => ({
  id: `t${++seq}`,
  description: "",
  completed: false,
  user_id: "u1",
  title: "Task",
  start_date: "2026-07-22",
  end_date: "2026-07-22",
  daily_start_time: "09:00",
  daily_end_time: "10:00",
  is_anytime: false,
  duration_minutes: 60,
  ...overrides,
})

describe("taskEffortMinutes", () => {
  it("prefers explicit effort over calendar duration", () => {
    expect(taskEffortMinutes({ effort_minutes: 90, duration_minutes: 60 })).toBe(90)
    expect(taskEffortMinutes({ effort_minutes: null, duration_minutes: 60 })).toBe(60)
    expect(taskEffortMinutes({ effort_minutes: null, duration_minutes: null })).toBe(0)
  })
})

describe("isScheduled", () => {
  it("treats anytime and slot-less tasks as unscheduled", () => {
    expect(isScheduled(task())).toBe(true)
    expect(isScheduled(task({ is_anytime: true }))).toBe(false)
    expect(isScheduled(task({ daily_start_time: null }))).toBe(false)
  })
})

describe("weekStartOf", () => {
  it("anchors on the Sunday of the containing week", () => {
    // 2026-07-22 is a Wednesday; its week starts Sunday 2026-07-19.
    expect(weekStartOf("2026-07-22")).toBe("2026-07-19")
    expect(weekStartOf("2026-07-19")).toBe("2026-07-19")
  })
})

describe("summarizeWeek", () => {
  const today = "2026-07-22"

  it("counts only this week's tasks", () => {
    const summary = summarizeWeek(
      [
        task({ start_date: "2026-07-20", duration_minutes: 60 }),
        task({ start_date: "2026-07-25", duration_minutes: 30 }),
        task({ start_date: "2026-08-05", duration_minutes: 999 }), // next month
      ],
      { todayYmd: today, capacityMinutes: 300 },
    )
    expect(summary.weekStart).toBe("2026-07-19")
    expect(summary.weekEnd).toBe("2026-07-25")
    expect(summary.plannedSessions).toBe(2)
    expect(summary.plannedMinutes).toBe(90)
  })

  it("separates completed sessions and minutes", () => {
    const summary = summarizeWeek(
      [task({ completed: true, duration_minutes: 45 }), task({ duration_minutes: 45 })],
      { todayYmd: today, capacityMinutes: 300 },
    )
    expect(summary.completedSessions).toBe(1)
    expect(summary.completedMinutes).toBe(45)
    expect(summary.plannedMinutes).toBe(90)
  })

  it("reports remaining capacity when healthy", () => {
    const summary = summarizeWeek([task({ duration_minutes: 60 })], {
      todayYmd: today,
      capacityMinutes: 300,
    })
    expect(summary.status).toBe("healthy")
    expect(summary.remainingMinutes).toBe(240)
    expect(summary.overMinutes).toBe(0)
  })

  it("flags nearly full at 85% of capacity", () => {
    const summary = summarizeWeek([task({ duration_minutes: 255 })], {
      todayYmd: today,
      capacityMinutes: 300,
    })
    expect(summary.status).toBe("nearly_full")
  })

  it("flags over capacity and reports the overage", () => {
    const summary = summarizeWeek([task({ duration_minutes: 400 })], {
      todayYmd: today,
      capacityMinutes: 300,
    })
    expect(summary.status).toBe("over_capacity")
    expect(summary.overMinutes).toBe(100)
    expect(summary.remainingMinutes).toBe(0)
  })

  it("reports 'unset' when the goal has no weekly capacity", () => {
    const summary = summarizeWeek([task()], { todayYmd: today, capacityMinutes: null })
    expect(summary.status).toBe("unset")
    expect(summary.capacityMinutes).toBeNull()
  })

  it("counts unscheduled incomplete tasks across the whole goal", () => {
    const summary = summarizeWeek(
      [
        task({ is_anytime: true }),
        task({ daily_start_time: null, start_date: "2026-09-01" }),
        task({ is_anytime: true, completed: true }),
        task(),
      ],
      { todayYmd: today, capacityMinutes: 300 },
    )
    expect(summary.unscheduledCount).toBe(2)
  })
})

describe("findScheduleConflicts", () => {
  it("detects overlapping timed tasks on the same day", () => {
    const a = task({ daily_start_time: "09:00", daily_end_time: "10:00" })
    const b = task({ daily_start_time: "09:30", daily_end_time: "10:30" })
    const conflicts = findScheduleConflicts([a, b])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].date).toBe("2026-07-22")
  })

  it("treats back-to-back tasks as non-conflicting", () => {
    expect(
      findScheduleConflicts([
        task({ daily_start_time: "09:00", daily_end_time: "10:00" }),
        task({ daily_start_time: "10:00", daily_end_time: "11:00" }),
      ]),
    ).toEqual([])
  })

  it("ignores different days, anytime tasks and completed tasks", () => {
    expect(
      findScheduleConflicts([
        task({ daily_start_time: "09:00", daily_end_time: "10:00" }),
        task({ start_date: "2026-07-23", daily_start_time: "09:00", daily_end_time: "10:00" }),
        task({ is_anytime: true }),
        task({ completed: true, daily_start_time: "09:15" }),
      ]),
    ).toEqual([])
  })

  it("falls back to duration when the end time is missing", () => {
    const conflicts = findScheduleConflicts([
      task({ daily_start_time: "09:00", daily_end_time: null, duration_minutes: 90 }),
      task({ daily_start_time: "10:00", daily_end_time: "11:00" }),
    ])
    expect(conflicts).toHaveLength(1)
  })
})

// ── Characterisation tests ──────────────────────────────────────────────────
// These pin down behaviour that is currently *internally inconsistent*. They
// are not an endorsement of it — see docs/business-logic-test-audit.md
// (finding C1). They exist so that whichever way the product decides, the
// change is deliberate and visible in a diff rather than silent.

describe("capacity: what counts as 'planned' (characterisation)", () => {
  const today = "2026-07-22"

  it("counts a slot-less task's minutes as planned AND as unscheduled backlog", () => {
    // The same task simultaneously consumes weekly capacity and is reported as
    // unscheduled. A goal can therefore read "Over capacity" on the strength of
    // work the very same card lists as not yet scheduled.
    const summary = summarizeWeek(
      [task({ is_anytime: true, daily_start_time: null, duration_minutes: 120 })],
      { todayYmd: today, capacityMinutes: 60 },
    )
    expect(summary.plannedMinutes).toBe(120)
    expect(summary.unscheduledCount).toBe(1)
    expect(summary.status).toBe("over_capacity")
  })

  it("keeps completed work inside plannedMinutes", () => {
    // "Planned" is cumulative for the week, not remaining work.
    const summary = summarizeWeek([task({ completed: true, duration_minutes: 60 })], {
      todayYmd: today,
      capacityMinutes: 300,
    })
    expect(summary.plannedMinutes).toBe(60)
    expect(summary.completedMinutes).toBe(60)
  })

  it("buckets a task into a week by start_date, while due-date logic uses end_date", () => {
    // taskDueDate() is end_date-first; summarizeWeek is start_date-only. For a
    // multi-day task the two disagree about which week/day it belongs to.
    const summary = summarizeWeek(
      [task({ start_date: "2026-07-25", end_date: "2026-07-27", duration_minutes: 60 })],
      { todayYmd: today, capacityMinutes: 300 },
    )
    // 2026-07-25 is the Saturday ending this week; 07-27 is the next week.
    expect(summary.weekEnd).toBe("2026-07-25")
    expect(summary.plannedMinutes).toBe(60)
  })
})

describe("capacity: zero and unset are different states", () => {
  it("treats a zero capacity as unset rather than 'always over'", () => {
    const zero = summarizeWeek([task({ duration_minutes: 60 })], {
      todayYmd: "2026-07-22",
      capacityMinutes: 0,
    })
    expect(zero.capacityMinutes).toBeNull()
    expect(zero.status).toBe("unset")
    expect(zero.overMinutes).toBe(0)
  })

  it("reports unset with no capacity configured", () => {
    const none = summarizeWeek([task()], { todayYmd: "2026-07-22" })
    expect(none.status).toBe("unset")
    expect(none.capacityMinutes).toBeNull()
  })
})

describe("weekStartOf across boundaries", () => {
  it("handles month, year and leap-day boundaries as civil dates", () => {
    expect(weekStartOf("2026-08-01")).toBe("2026-07-26") // Sat → previous Sunday
    expect(weekStartOf("2027-01-01")).toBe("2026-12-27") // year boundary
    expect(weekStartOf("2028-02-29")).toBe("2028-02-27") // leap day
  })

  it("is independent of the host timezone", () => {
    // Pure civil-date math: no Date-from-local-string anywhere in the path.
    const original = process.env.TZ
    try {
      process.env.TZ = "Pacific/Kiritimati" // UTC+14
      expect(weekStartOf("2026-07-22")).toBe("2026-07-19")
      process.env.TZ = "Pacific/Midway" // UTC-11
      expect(weekStartOf("2026-07-22")).toBe("2026-07-19")
    } finally {
      process.env.TZ = original
    }
  })
})
