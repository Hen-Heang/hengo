import { describe, expect, it } from "vitest"

import {
  MODE_TOTAL_MINUTES,
  calculateDailyProgress,
  dailyPlanIdentity,
  generateModeSchedule,
  getModeDuration,
  preferExistingDailyPlan,
  topicForWeekday,
  updateActivityTime,
} from "./daily-study-plan"

describe("daily Korean study plan", () => {
  it.each(["busy", "normal", "office"] as const)("generates the exact %s mode duration", (mode) => {
    expect(getModeDuration(mode)).toBe(MODE_TOTAL_MINUTES[mode])
  })

  it("uses the required Office Study Day schedule", () => {
    const schedule = generateModeSchedule("office")
    expect(schedule.map((activity) => [activity.plannedStart, activity.estimatedMinutes])).toEqual([
      ["09:00", 20],
      ["10:30", 25],
      ["13:00", 15],
      ["15:00", 30],
      ["17:20", 30],
    ])
  })

  it("allows valid custom times and rejects malformed values", () => {
    const schedule = generateModeSchedule("busy")
    expect(updateActivityTime(schedule, schedule[0].id, "07:45")[0].plannedStart).toBe("07:45")
    expect(() => updateActivityTime(schedule, schedule[0].id, "25:00")).toThrow()
  })

  it("rotates weekday topics Monday through Sunday", () => {
    expect(topicForWeekday(1).key).toBe("work-responsibilities")
    expect(topicForWeekday(3).key).toBe("progress-deadlines")
    expect(topicForWeekday(6).key).toBe("real-life-mission")
    expect(topicForWeekday(0).key).toBe("weekly-review")
  })

  it("calculates completion and focused time without treating skips as completion", () => {
    const activities = generateModeSchedule("busy").map((activity, index) => ({
      ...activity,
      status:
        index === 0 ? ("completed" as const) : index === 1 ? ("skipped" as const) : activity.status,
      completedSeconds: index === 0 ? 605 : 0,
    }))
    expect(calculateDailyProgress(activities)).toMatchObject({
      percentage: 33,
      completedCount: 1,
      skippedCount: 1,
      focusedMinutes: 10,
      plannedMinutes: 30,
    })
  })

  it("uses user and local study date as identity and keeps an existing plan", () => {
    expect(dailyPlanIdentity("user-1", "2026-07-28")).toBe("user-1:2026-07-28")
    const existing = { id: "existing" }
    expect(preferExistingDailyPlan(existing, { id: "candidate" })).toBe(existing)
    expect(preferExistingDailyPlan(null, { id: "candidate" })).toEqual({ id: "candidate" })
  })
})
