import { describe, expect, it } from "vitest"
import {
  deriveStatusFromSchedule,
  hasTimeSlot,
  isTaskDueToday,
  isTaskOverdue,
  isTaskUnscheduled,
  resolveTaskStatus,
  taskCompletionPatch,
  taskScheduleDisplay,
  taskStatusPatch,
  todayInAppTimezone,
} from "./task-status"
import type { Task } from "./tasks"

const TODAY = "2026-07-22"

let seq = 0
const task = (overrides: Partial<Task> = {}): Task => ({
  id: `t${++seq}`,
  description: "",
  completed: false,
  user_id: "u1",
  title: "Task",
  start_date: "2026-07-25",
  end_date: "2026-07-25",
  daily_start_time: "09:00",
  daily_end_time: "10:00",
  is_anytime: false,
  duration_minutes: 60,
  ...overrides,
})

describe("todayInAppTimezone", () => {
  it("uses the Asia/Seoul civil date, not the host's", () => {
    // 2026-07-22 22:00 UTC is already 2026-07-23 07:00 in Seoul (UTC+9).
    expect(todayInAppTimezone(new Date("2026-07-22T22:00:00Z"))).toBe("2026-07-23")
  })

  it("does not roll the day early for a Seoul morning", () => {
    // 2026-07-22 00:30 UTC is 09:30 the same day in Seoul.
    expect(todayInAppTimezone(new Date("2026-07-22T00:30:00Z"))).toBe("2026-07-22")
  })

  it("handles the Seoul midnight boundary", () => {
    // 15:00 UTC == 00:00 next day in Seoul.
    expect(todayInAppTimezone(new Date("2026-07-22T14:59:00Z"))).toBe("2026-07-22")
    expect(todayInAppTimezone(new Date("2026-07-22T15:00:00Z"))).toBe("2026-07-23")
  })

  it("is identical whichever zone is asked for the same instant in UTC", () => {
    expect(todayInAppTimezone(new Date("2026-07-22T12:00:00Z"), "UTC")).toBe("2026-07-22")
  })
})

describe("legacy completed → status migration", () => {
  it("maps a completed task to completed", () => {
    expect(resolveTaskStatus(task({ completed: true, status: undefined }), TODAY)).toBe("completed")
  })

  it("maps an incomplete task dated in the future to scheduled", () => {
    expect(
      resolveTaskStatus(task({ status: undefined, end_date: "2026-08-01" }), TODAY),
    ).toBe("scheduled")
  })

  it("maps an incomplete task dated today to scheduled", () => {
    expect(resolveTaskStatus(task({ status: undefined, end_date: TODAY }), TODAY)).toBe("scheduled")
  })

  it("maps an incomplete task with a past date to backlog", () => {
    expect(
      resolveTaskStatus(task({ status: undefined, end_date: "2026-07-01" }), TODAY),
    ).toBe("backlog")
  })

  it("maps an incomplete task with no usable date to backlog", () => {
    expect(
      resolveTaskStatus(task({ status: undefined, start_date: "", end_date: "" }), TODAY),
    ).toBe("backlog")
  })

  it("deriveStatusFromSchedule matches the SQL backfill's boundaries", () => {
    expect(deriveStatusFromSchedule({ start_date: "", end_date: TODAY }, TODAY)).toBe("scheduled")
    expect(deriveStatusFromSchedule({ start_date: "", end_date: "2026-07-21" }, TODAY)).toBe(
      "backlog",
    )
  })
})

describe("canonical completed ↔ status synchronization", () => {
  it("honours a stored status when the boolean agrees", () => {
    expect(resolveTaskStatus(task({ status: "in_progress" }), TODAY)).toBe("in_progress")
    expect(resolveTaskStatus(task({ status: "blocked" }), TODAY)).toBe("blocked")
  })

  it("lets the legacy boolean win when it says completed", () => {
    // An external (Orbit) writer can only flip `completed`.
    expect(resolveTaskStatus(task({ status: "in_progress", completed: true }), TODAY)).toBe(
      "completed",
    )
  })

  it("lets the legacy boolean win when it says re-opened", () => {
    expect(
      resolveTaskStatus(task({ status: "completed", completed: false, end_date: "2026-08-01" }), TODAY),
    ).toBe("scheduled")
  })

  it("taskStatusPatch always writes both fields", () => {
    expect(taskStatusPatch("completed")).toEqual({
      status: "completed",
      completed: true,
      blocked_reason: null,
    })
    expect(taskStatusPatch("in_progress")).toEqual({
      status: "in_progress",
      completed: false,
      blocked_reason: null,
    })
  })

  it("keeps a blocked reason only while blocked", () => {
    expect(taskStatusPatch("blocked", " waiting on review ").blocked_reason).toBe(
      "waiting on review",
    )
    expect(taskStatusPatch("blocked", "   ").blocked_reason).toBeNull()
    expect(taskStatusPatch("scheduled", "stale note").blocked_reason).toBeNull()
  })

  it("taskCompletionPatch mirrors both directions", () => {
    const t = task({ end_date: "2026-08-01" })
    expect(taskCompletionPatch(true, t, TODAY)).toEqual({ status: "completed", completed: true })
    expect(taskCompletionPatch(false, t, TODAY)).toEqual({ status: "scheduled", completed: false })
    expect(taskCompletionPatch(false, task({ end_date: "2026-01-01" }), TODAY)).toEqual({
      status: "backlog",
      completed: false,
    })
  })

  it("round-trips: patch then resolve returns the same status", () => {
    for (const status of ["backlog", "scheduled", "in_progress", "blocked", "completed"] as const) {
      const patch = taskStatusPatch(status)
      const stored = task({ ...patch, end_date: "2026-08-01" })
      expect(resolveTaskStatus(stored, TODAY)).toBe(status)
    }
  })
})

describe("overdue derivation", () => {
  it("is true for an incomplete task dated before today", () => {
    expect(isTaskOverdue(task({ end_date: "2026-07-21" }), TODAY)).toBe(true)
  })

  it("is false on the due date itself", () => {
    expect(isTaskOverdue(task({ end_date: TODAY }), TODAY)).toBe(false)
  })

  it("is never true for a completed task", () => {
    expect(isTaskOverdue(task({ end_date: "2026-01-01", completed: true }), TODAY)).toBe(false)
  })

  it("is false without a date", () => {
    expect(isTaskOverdue(task({ start_date: "", end_date: "" }), TODAY)).toBe(false)
  })

  it("is not stored as a status", () => {
    // Sanity: "overdue" must never be a legal status value.
    const statuses: string[] = ["backlog", "scheduled", "in_progress", "blocked", "completed"]
    expect(statuses).not.toContain("overdue")
  })
})

describe("due today / unscheduled", () => {
  it("detects a task due today", () => {
    expect(isTaskDueToday(task({ end_date: TODAY }), TODAY)).toBe(true)
    expect(isTaskDueToday(task({ end_date: "2026-07-23" }), TODAY)).toBe(false)
    expect(isTaskDueToday(task({ end_date: TODAY, completed: true }), TODAY)).toBe(false)
  })

  it("treats anytime and slot-less tasks as unscheduled", () => {
    expect(hasTimeSlot(task())).toBe(true)
    expect(isTaskUnscheduled(task(), TODAY)).toBe(false)
    expect(isTaskUnscheduled(task({ is_anytime: true }), TODAY)).toBe(true)
    expect(isTaskUnscheduled(task({ daily_start_time: null }), TODAY)).toBe(true)
  })

  it("never calls a completed task unscheduled", () => {
    expect(isTaskUnscheduled(task({ is_anytime: true, completed: true }), TODAY)).toBe(false)
  })
})

describe("taskScheduleDisplay", () => {
  // Regression: `moveToBacklog` keeps the task's day and only drops the time
  // slot, so a backlogged task still has a due date. Rows previously rendered
  // `dueDate ?? "Unscheduled"` and therefore showed a plain date for a task the
  // Unscheduled chip, the Schedule tab backlog and the capacity card all
  // counted as unscheduled.
  it("says Unscheduled for a backlogged task that kept its day", () => {
    const backlogged = task({
      start_date: "2026-07-25",
      end_date: "2026-07-25",
      is_anytime: true,
      daily_start_time: null,
      daily_end_time: null,
    })
    const display = taskScheduleDisplay(backlogged, TODAY)

    expect(display.unscheduled).toBe(true)
    expect(display.dueDate).toBe("2026-07-25")
    expect(display.label).toContain("Unscheduled")
    // The day is still surfaced — the fix must not lose information.
    expect(display.label).toContain("2026-07-25")
  })

  it("agrees with isTaskUnscheduled for every schedule shape", () => {
    const shapes: Task[] = [
      task(),
      task({ is_anytime: true }),
      task({ daily_start_time: null }),
      task({ is_anytime: true, completed: true }),
      task({ completed: true }),
    ]
    for (const t of shapes) {
      expect(taskScheduleDisplay(t, TODAY).unscheduled).toBe(isTaskUnscheduled(t, TODAY))
    }
  })

  it("shows the bare day for a task with a real time slot", () => {
    const display = taskScheduleDisplay(task({ end_date: "2026-07-25" }), TODAY)
    expect(display.unscheduled).toBe(false)
    expect(display.label).toBe("2026-07-25")
  })

  it("does not call a completed slot-less task unscheduled", () => {
    const display = taskScheduleDisplay(task({ is_anytime: true, completed: true }), TODAY)
    expect(display.unscheduled).toBe(false)
    expect(display.label).toBe("2026-07-25")
  })
})

describe("todayInAppTimezone — boundary matrix", () => {
  // Semantic assertions on the civil date only; no localized display strings.
  const cases: [string, string, string][] = [
    ["Seoul midnight exactly", "2026-07-23T15:00:00Z", "2026-07-24"],
    ["one minute before Seoul midnight", "2026-07-23T14:59:00Z", "2026-07-23"],
    ["UTC date differs from Seoul date", "2026-07-23T23:30:00Z", "2026-07-24"],
    ["month boundary rolls in Seoul first", "2026-07-31T15:00:00Z", "2026-08-01"],
    ["year boundary rolls in Seoul first", "2026-12-31T15:00:00Z", "2027-01-01"],
    ["leap day", "2028-02-29T03:00:00Z", "2028-02-29"],
    ["Sunday stays Sunday", "2026-07-26T04:00:00Z", "2026-07-26"],
  ]

  it.each(cases)("%s", (_name, iso, expected) => {
    expect(todayInAppTimezone(new Date(iso))).toBe(expected)
  })

  it("ignores the host clock's timezone entirely", () => {
    // The same instant must yield the same Seoul civil date from any runtime.
    const instant = new Date("2026-07-23T23:30:00Z")
    const original = process.env.TZ
    try {
      for (const tz of ["UTC", "America/New_York", "Pacific/Kiritimati", "Europe/Berlin"]) {
        process.env.TZ = tz
        expect(todayInAppTimezone(instant)).toBe("2026-07-24")
      }
    } finally {
      process.env.TZ = original
    }
  })

  it("is unaffected by a DST transition in another zone", () => {
    // 2026-11-01 is the US DST fall-back; Seoul has no DST, so nothing shifts.
    expect(todayInAppTimezone(new Date("2026-11-01T05:30:00Z"))).toBe("2026-11-01")
    expect(todayInAppTimezone(new Date("2026-11-01T15:00:00Z"))).toBe("2026-11-02")
  })
})

describe("overdue across the Seoul day boundary", () => {
  it("does not mark a task overdue a day early for a Seoul-morning user", () => {
    // 2026-07-23T22:00Z is already 2026-07-24 07:00 in Seoul. A task due
    // 2026-07-24 must be "due today", not overdue — deriving today from a UTC
    // date would have said 2026-07-23 and called it upcoming instead.
    const today = todayInAppTimezone(new Date("2026-07-23T22:00:00Z"))
    expect(today).toBe("2026-07-24")

    const dueToday = task({ start_date: "2026-07-24", end_date: "2026-07-24" })
    expect(isTaskOverdue(dueToday, today)).toBe(false)
    expect(isTaskDueToday(dueToday, today)).toBe(true)
  })

  it("marks yesterday's incomplete task overdue and today's not", () => {
    const today = "2026-07-24"
    expect(isTaskOverdue(task({ start_date: "2026-07-23", end_date: "2026-07-23" }), today)).toBe(true)
    expect(isTaskOverdue(task({ start_date: today, end_date: today }), today)).toBe(false)
  })

  it("never marks a completed past-due task overdue", () => {
    expect(
      isTaskOverdue(task({ start_date: "2026-07-01", end_date: "2026-07-01", completed: true }), "2026-07-24"),
    ).toBe(false)
  })
})
