import { describe, expect, it } from "vitest"
import { selectNextBestAction } from "./next-best-action"
import type { Task } from "./tasks"
import type { GoalKeyResult } from "./goal-key-results"
import type { GoalPlanPhase } from "./goal-plan-phases"

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

const keyResult = (overrides: Partial<GoalKeyResult> = {}): GoalKeyResult => ({
  id: "kr1",
  goal_id: "g1",
  user_id: "u1",
  title: "KR",
  description: null,
  metric_type: "number",
  baseline_value: 0,
  current_value: 0,
  target_value: 100,
  unit: null,
  weight: 1,
  deadline: null,
  data_source: "manual",
  source_config: {},
  status: "active",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  ...overrides,
})

const phase = (overrides: Partial<GoalPlanPhase> = {}): GoalPlanPhase => ({
  id: "p1",
  goal_id: "g1",
  user_id: "u1",
  title: "Phase 1",
  objective: null,
  description: null,
  position: 0,
  start_date: null,
  end_date: null,
  status: "active",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  ...overrides,
})

describe("selectNextBestAction priority", () => {
  it("returns null when nothing is open", () => {
    expect(selectNextBestAction({ tasks: [task({ completed: true })], todayYmd: TODAY })).toBeNull()
    expect(selectNextBestAction({ tasks: [], todayYmd: TODAY })).toBeNull()
  })

  it("1 — picks an overdue high-impact task above everything else", () => {
    const overdue = task({ impact_level: "high", start_date: "2026-07-10", end_date: "2026-07-10" })
    const result = selectNextBestAction({
      tasks: [task({ key_result_id: "kr1" }), task({ phase_id: "p1" }), overdue],
      keyResults: [keyResult()],
      phases: [phase()],
      todayYmd: TODAY,
    })
    expect(result?.rule).toBe("overdue_high_impact")
    expect(result?.task.id).toBe(overdue.id)
    expect(result?.isOverdue).toBe(true)
  })

  it("2 — falls to a task feeding an at-risk key result", () => {
    const linked = task({ key_result_id: "kr1" })
    const result = selectNextBestAction({
      tasks: [task({ phase_id: "p1" }), linked],
      keyResults: [keyResult({ current_value: 10 })], // 10% — at risk
      phases: [phase()],
      todayYmd: TODAY,
    })
    expect(result?.rule).toBe("at_risk_key_result")
    expect(result?.task.id).toBe(linked.id)
    expect(result?.keyResult?.id).toBe("kr1")
  })

  it("skips a healthy key result and falls through to the active phase", () => {
    const inPhase = task({ phase_id: "p1" })
    const result = selectNextBestAction({
      tasks: [task({ key_result_id: "kr1" }), inPhase],
      keyResults: [keyResult({ current_value: 90 })], // 90% — not at risk
      phases: [phase()],
      todayYmd: TODAY,
    })
    expect(result?.rule).toBe("active_phase")
    expect(result?.phase?.id).toBe("p1")
  })

  it("ignores non-active phases", () => {
    const result = selectNextBestAction({
      tasks: [task({ phase_id: "p1" })],
      phases: [phase({ status: "planned" })],
      todayYmd: TODAY,
    })
    expect(result?.rule).toBe("nearest_deadline")
  })

  it("4 — picks the nearest deadline when nothing higher matches", () => {
    const soon = task({ start_date: "2026-07-23", end_date: "2026-07-23" })
    const later = task({ start_date: "2026-08-30", end_date: "2026-08-30" })
    const result = selectNextBestAction({ tasks: [later, soon], todayYmd: TODAY })
    expect(result?.rule).toBe("nearest_deadline")
    expect(result?.task.id).toBe(soon.id)
  })

  it("5 — surfaces an unscheduled high-impact task when nothing has a date", () => {
    const unscheduled = task({
      impact_level: "high",
      is_anytime: true,
      daily_start_time: null,
      start_date: "",
      end_date: "",
    })
    const result = selectNextBestAction({ tasks: [unscheduled], todayYmd: TODAY })
    expect(result?.rule).toBe("unscheduled_high_impact")
    expect(result?.isScheduled).toBe(false)
  })

  it("6 — falls back to the earliest scheduled incomplete task", () => {
    const result = selectNextBestAction({
      tasks: [task({ start_date: "", end_date: "" })],
      todayYmd: TODAY,
    })
    expect(result?.rule).toBe("earliest_scheduled")
  })

  it("always returns something when at least one task is open", () => {
    const result = selectNextBestAction({
      tasks: [task({ start_date: "", end_date: "", is_anytime: true, daily_start_time: null })],
      todayYmd: TODAY,
    })
    expect(result).not.toBeNull()
  })

  it("is deterministic — ties break by due date, then impact, then title", () => {
    const a = task({ id: "a", title: "Bravo", start_date: "2026-07-23", end_date: "2026-07-23" })
    const b = task({ id: "b", title: "Alpha", start_date: "2026-07-23", end_date: "2026-07-23" })
    expect(selectNextBestAction({ tasks: [a, b], todayYmd: TODAY })?.task.id).toBe("b")
    expect(selectNextBestAction({ tasks: [b, a], todayYmd: TODAY })?.task.id).toBe("b")
  })

  it("reports effort minutes for the chosen task", () => {
    const result = selectNextBestAction({
      tasks: [task({ effort_minutes: 25, duration_minutes: 60 })],
      todayYmd: TODAY,
    })
    expect(result?.effortMinutes).toBe(25)
  })
})

describe("overdue rescheduling signals", () => {
  it("marks a task due before today as overdue", () => {
    const result = selectNextBestAction({
      tasks: [task({ start_date: "2026-07-01", end_date: "2026-07-01" })],
      todayYmd: TODAY,
    })
    expect(result?.isOverdue).toBe(true)
  })

  it("does not mark a task due today as overdue", () => {
    const result = selectNextBestAction({
      tasks: [task({ start_date: TODAY, end_date: TODAY })],
      todayYmd: TODAY,
    })
    expect(result?.isOverdue).toBe(false)
  })
})
