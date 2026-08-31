import { describe, expect, it } from "vitest"
import {
  buildEveningReviewSummary,
  buildHabitWeeklyCompletion,
  buildMorningBrief,
  buildWeeklyReviewSummary,
  formatEveningReviewContext,
  formatMorningBriefContext,
  formatWeeklyReviewContext,
  goalsNeedingAttention,
  isReminderDueToday,
  localWeekDates,
  remindersDueToday,
  type MorningBriefTaskCounts,
} from "./review"
import type { DailySummary } from "./timeline"
import type { Goal } from "./goals"
import type { Reminder } from "./reminders"
import type { Habit, HabitCheckIn } from "./types"

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    title: "Ship the feature",
    status: "active",
    health_status: "on_track",
    outcome_progress: 0,
    ...overrides,
  } as Goal
}

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: "r1",
    title: "Take a break",
    body: null,
    entityType: "manual_activity",
    entityId: null,
    scheduledFor: null,
    recurrence: null,
    timezone: "Asia/Seoul",
    channels: ["web"],
    status: "active",
    nextRunAt: "2026-07-26T09:00:00.000Z",
    lastSentAt: null,
    ...overrides,
  } as Reminder
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    label: "Read",
    category: "learning",
    active: true,
    startedAt: "2026-07-01",
    createdAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  } as Habit
}

function checkin(overrides: Partial<HabitCheckIn> = {}): HabitCheckIn {
  return {
    id: "c1",
    habitId: "h1",
    date: "2026-07-26",
    completed: true,
    createdAt: "2026-07-26T00:00:00.000Z",
    ...overrides,
  }
}

describe("goalsNeedingAttention", () => {
  it("keeps only active goals with a concerning health status", () => {
    const goals = [
      goal({ id: "1", health_status: "on_track" }),
      goal({ id: "2", health_status: "attention" }),
      goal({ id: "3", health_status: "at_risk" }),
      goal({ id: "4", health_status: "blocked" }),
      goal({ id: "5", health_status: "at_risk", status: "completed" }),
      goal({ id: "6", health_status: "at_risk", status: "archived" }),
    ]
    expect(goalsNeedingAttention(goals).map((g) => g.id)).toEqual(["2", "3", "4"])
  })
})

describe("isReminderDueToday / remindersDueToday", () => {
  const now = new Date("2026-07-26T12:00:00")

  it("is true for an active reminder due earlier today", () => {
    expect(isReminderDueToday(reminder({ nextRunAt: "2026-07-26T09:00:00" }), now)).toBe(true)
  })

  it("is true for an overdue reminder (past days)", () => {
    expect(isReminderDueToday(reminder({ nextRunAt: "2026-07-20T09:00:00" }), now)).toBe(true)
  })

  it("is false for a reminder scheduled tomorrow", () => {
    expect(isReminderDueToday(reminder({ nextRunAt: "2026-07-27T09:00:00" }), now)).toBe(false)
  })

  it("is false for a paused reminder", () => {
    expect(
      isReminderDueToday(reminder({ status: "paused", nextRunAt: "2026-07-26T09:00:00" }), now),
    ).toBe(false)
  })

  it("is false when nextRunAt is null", () => {
    expect(isReminderDueToday(reminder({ nextRunAt: null }), now)).toBe(false)
  })

  it("filters a list down to only the due ones", () => {
    const reminders = [
      reminder({ id: "a", nextRunAt: "2026-07-26T09:00:00" }),
      reminder({ id: "b", nextRunAt: "2026-07-28T09:00:00" }),
    ]
    expect(remindersDueToday(reminders, now).map((r) => r.id)).toEqual(["a"])
  })
})

describe("buildMorningBrief", () => {
  const taskCounts: MorningBriefTaskCounts = {
    overdueCount: 1,
    scheduledCount: 2,
    anytimeCount: 0,
    completedCount: 3,
    totalCount: 6,
  }

  it("splits active habits into done vs pending based on today's checkins", () => {
    const brief = buildMorningBrief({
      now: new Date("2026-07-26T08:00:00"),
      streakDays: 5,
      taskCounts,
      activeHabits: [habit({ id: "h1", label: "Read" }), habit({ id: "h2", label: "Exercise" })],
      todaysCheckins: [checkin({ habitId: "h1", completed: true })],
      reminders: [],
      goals: [],
    })
    expect(brief.habitsDoneCount).toBe(1)
    expect(brief.habitsTotalCount).toBe(2)
    expect(brief.habitsPending.map((h) => h.id)).toEqual(["h2"])
    expect(brief.streakDays).toBe(5)
    expect(brief.taskCounts).toEqual(taskCounts)
  })

  it("surfaces due reminders and at-risk goals", () => {
    const brief = buildMorningBrief({
      now: new Date("2026-07-26T08:00:00"),
      streakDays: 0,
      taskCounts,
      activeHabits: [],
      todaysCheckins: [],
      reminders: [reminder({ id: "r1", nextRunAt: "2026-07-26T07:00:00" })],
      goals: [goal({ id: "g1", health_status: "at_risk" })],
    })
    expect(brief.remindersToday).toHaveLength(1)
    expect(brief.goalsAtRisk).toHaveLength(1)
  })
})

describe("formatMorningBriefContext", () => {
  it("includes pending habits and omits empty sections", () => {
    const brief = buildMorningBrief({
      now: new Date("2026-07-26T08:00:00"),
      streakDays: 3,
      taskCounts: {
        overdueCount: 0,
        scheduledCount: 1,
        anytimeCount: 0,
        completedCount: 0,
        totalCount: 1,
      },
      activeHabits: [habit({ id: "h1", label: "Read" })],
      todaysCheckins: [],
      reminders: [],
      goals: [],
    })
    const context = formatMorningBriefContext(brief)
    expect(context).toContain("pending: Read")
    expect(context).not.toContain("Reminders due")
    expect(context).not.toContain("Goals needing attention")
  })
})

describe("buildEveningReviewSummary / formatEveningReviewContext", () => {
  const summary: DailySummary = {
    date: "2026-07-26",
    entries: [{ id: "1", kind: "task", occurredAt: "2026-07-26T10:00:00", title: "x" }],
    hengoMinutes: 42,
    completedCount: 4,
    manualActivityCount: 1,
    journalCount: 0,
  }

  it("reports the day's numbers and journal status", () => {
    const result = buildEveningReviewSummary(summary, true, new Date("2026-07-26T20:00:00"))
    expect(result.completedCount).toBe(4)
    expect(result.hengoMinutes).toBe(42)
    expect(result.journalDone).toBe(true)
  })

  it("defaults to zeros when there's no summary for the day yet", () => {
    const result = buildEveningReviewSummary(undefined, false, new Date("2026-07-26T20:00:00"))
    expect(result.completedCount).toBe(0)
    expect(result.journalDone).toBe(false)
    expect(formatEveningReviewContext(result)).toContain("Journal entry written today: no")
  })
})

describe("buildHabitWeeklyCompletion", () => {
  const weekDates = [
    "2026-07-20",
    "2026-07-21",
    "2026-07-22",
    "2026-07-23",
    "2026-07-24",
    "2026-07-25",
    "2026-07-26",
  ]

  it("counts completed days within the week", () => {
    const result = buildHabitWeeklyCompletion(
      [habit({ id: "h1", startedAt: "2026-01-01" })],
      [
        checkin({ habitId: "h1", date: "2026-07-20" }),
        checkin({ habitId: "h1", date: "2026-07-22" }),
      ],
      weekDates,
    )
    expect(result).toEqual([{ habitId: "h1", label: "Read", completedDays: 2, totalDays: 7 }])
  })

  it("only counts days on/after the habit's start date", () => {
    const result = buildHabitWeeklyCompletion(
      [habit({ id: "h1", startedAt: "2026-07-23" })],
      [],
      weekDates,
    )
    expect(result[0].totalDays).toBe(4)
  })

  it("ignores incomplete check-ins", () => {
    const result = buildHabitWeeklyCompletion(
      [habit({ id: "h1", startedAt: "2026-01-01" })],
      [checkin({ habitId: "h1", date: "2026-07-20", completed: false })],
      weekDates,
    )
    expect(result[0].completedDays).toBe(0)
  })
})

describe("localWeekDates", () => {
  it("returns 7 consecutive local dates starting from the given date", () => {
    expect(localWeekDates(new Date(2026, 6, 20))).toEqual([
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ])
  })
})

describe("buildWeeklyReviewSummary / formatWeeklyReviewContext", () => {
  const daySummaries: DailySummary[] = [
    {
      date: "2026-07-20",
      entries: [],
      hengoMinutes: 10,
      completedCount: 2,
      manualActivityCount: 0,
      journalCount: 1,
    },
    {
      date: "2026-07-21",
      entries: [],
      hengoMinutes: 5,
      completedCount: 1,
      manualActivityCount: 1,
      journalCount: 0,
    },
  ]

  it("sums across the provided day summaries", () => {
    const result = buildWeeklyReviewSummary(daySummaries, [], [], "Jul 20 - Jul 26")
    expect(result.totalCompletedCount).toBe(3)
    expect(result.totalHengoMinutes).toBe(15)
    expect(result.totalManualActivityCount).toBe(1)
    expect(result.journalDaysCount).toBe(1)
  })

  it("includes at-risk goals from the full goal list", () => {
    const result = buildWeeklyReviewSummary(
      [],
      [goal({ id: "g1", health_status: "blocked" })],
      [],
      "range",
    )
    expect(result.goalsAtRisk).toHaveLength(1)
  })

  it("formats habit completion and omits goals section when empty", () => {
    const summary = buildWeeklyReviewSummary(
      daySummaries,
      [],
      [{ habitId: "h1", label: "Read", completedDays: 5, totalDays: 7 }],
      "Jul 20 - Jul 26",
    )
    const context = formatWeeklyReviewContext(summary)
    expect(context).toContain("Read 5/7")
    expect(context).not.toContain("Goals needing attention")
  })
})
