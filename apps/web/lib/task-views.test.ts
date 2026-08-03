import { describe, expect, it } from "vitest"
import {
  EMPTY_TASK_FILTERS,
  NONE_FILTER_VALUE,
  buildTaskView,
  chipCounts,
  filterTasks,
  groupTasksForPlan,
  hasActiveFilters,
  matchesSearch,
  smartPriorityBucket,
  sortTasks,
  type TaskFilters,
  type TaskViewContext,
} from "./task-views"
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

const phase = (overrides: Partial<GoalPlanPhase> = {}): GoalPlanPhase => ({
  id: "p1",
  goal_id: "g1",
  user_id: "u1",
  title: "Interview prep",
  objective: null,
  description: null,
  position: 0,
  start_date: null,
  end_date: null,
  status: "planned",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
  ...overrides,
})

const keyResult = (overrides: Partial<GoalKeyResult> = {}): GoalKeyResult => ({
  id: "kr1",
  goal_id: "g1",
  user_id: "u1",
  title: "Mock interview score",
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

const context = (overrides: Partial<TaskViewContext> = {}): TaskViewContext => ({
  todayYmd: TODAY,
  phases: [],
  keyResults: [],
  ...overrides,
})

const filters = (overrides: Partial<TaskFilters> = {}): TaskFilters => ({
  ...EMPTY_TASK_FILTERS,
  ...overrides,
})

// ── Chips / status filters ──────────────────────────────────────────────────

describe("status chips", () => {
  const overdue = task({ end_date: "2026-07-01" })
  const todayTask = task({ end_date: TODAY })
  const future = task({ end_date: "2026-08-01" })
  const unscheduled = task({ is_anytime: true, daily_start_time: null })
  const done = task({ completed: true, status: "completed" })
  const all = [overdue, todayTask, future, unscheduled, done]

  it("counts every chip", () => {
    expect(chipCounts(all, TODAY)).toEqual({
      all: 5,
      open: 4,
      today: 1,
      overdue: 1,
      unscheduled: 1,
      completed: 1,
    })
  })

  it("filters to open tasks", () => {
    expect(filterTasks(all, filters({ chip: "open" }), context())).toHaveLength(4)
  })

  it("filters to overdue tasks only", () => {
    expect(filterTasks(all, filters({ chip: "overdue" }), context())).toEqual([overdue])
  })

  it("filters to today's tasks in Asia/Seoul terms", () => {
    expect(filterTasks(all, filters({ chip: "today" }), context())).toEqual([todayTask])
  })

  it("filters to unscheduled tasks", () => {
    expect(filterTasks(all, filters({ chip: "unscheduled" }), context())).toEqual([unscheduled])
  })

  it("filters to completed tasks", () => {
    expect(filterTasks(all, filters({ chip: "completed" }), context())).toEqual([done])
  })

  it("filters by explicit workflow status", () => {
    const blocked = task({ status: "blocked" })
    const inProgress = task({ status: "in_progress" })
    expect(
      filterTasks([blocked, inProgress, future], filters({ statuses: ["blocked"] }), context()),
    ).toEqual([blocked])
  })
})

// ── Phase / key-result filters ──────────────────────────────────────────────

describe("phase and key-result filters", () => {
  const inPhase = task({ phase_id: "p1" })
  const otherPhase = task({ phase_id: "p2" })
  const noPhase = task({})
  const linked = task({ key_result_id: "kr1" })

  it("filters by phase", () => {
    expect(
      filterTasks([inPhase, otherPhase, noPhase], filters({ phaseIds: ["p1"] }), context()),
    ).toEqual([inPhase])
  })

  it("filters to the unassigned backlog", () => {
    expect(
      filterTasks(
        [inPhase, noPhase],
        filters({ phaseIds: [NONE_FILTER_VALUE] }),
        context(),
      ),
    ).toEqual([noPhase])
  })

  it("filters by key result", () => {
    expect(
      filterTasks([linked, noPhase], filters({ keyResultIds: ["kr1"] }), context()),
    ).toEqual([linked])
  })

  it("filters to tasks with no key result", () => {
    expect(
      filterTasks([linked, noPhase], filters({ keyResultIds: [NONE_FILTER_VALUE] }), context()),
    ).toEqual([noPhase])
  })
})

// ── Other filters ───────────────────────────────────────────────────────────

describe("remaining filters", () => {
  it("filters by impact", () => {
    const high = task({ impact_level: "high" })
    const low = task({ impact_level: "low" })
    expect(filterTasks([high, low], filters({ impacts: ["high"] }), context())).toEqual([high])
  })

  it("filters by scheduled / unscheduled", () => {
    const scheduled = task()
    const loose = task({ is_anytime: true })
    expect(filterTasks([scheduled, loose], filters({ scheduled: "scheduled" }), context())).toEqual([
      scheduled,
    ])
    expect(
      filterTasks([scheduled, loose], filters({ scheduled: "unscheduled" }), context()),
    ).toEqual([loose])
  })

  it("filters by date range, excluding undated tasks", () => {
    const inRange = task({ end_date: "2026-07-25" })
    const outOfRange = task({ end_date: "2026-09-01" })
    const undated = task({ start_date: "", end_date: "" })
    expect(
      filterTasks(
        [inRange, outOfRange, undated],
        filters({ dateFrom: "2026-07-01", dateTo: "2026-07-31" }),
        context(),
      ),
    ).toEqual([inRange])
  })

  it("filters by evidence required", () => {
    const needsEvidence = task({ evidence_required: true })
    expect(
      filterTasks([needsEvidence, task()], filters({ evidenceRequired: true }), context()),
    ).toEqual([needsEvidence])
  })

  it("filters by source, treating a missing source as manual", () => {
    const ai = task({ source: "ai" })
    const legacy = task({ source: undefined })
    expect(filterTasks([ai, legacy], filters({ sources: ["ai"] }), context())).toEqual([ai])
    expect(filterTasks([ai, legacy], filters({ sources: ["manual"] }), context())).toEqual([legacy])
  })

  it("reports whether any filter beyond chip/search is active", () => {
    expect(hasActiveFilters(filters())).toBe(false)
    expect(hasActiveFilters(filters({ chip: "overdue", search: "x" }))).toBe(false)
    expect(hasActiveFilters(filters({ impacts: ["high"] }))).toBe(true)
  })
})

// ── Search ──────────────────────────────────────────────────────────────────

describe("search", () => {
  const ctx = context({ phases: [phase()], keyResults: [keyResult()] })

  it("matches the title", () => {
    expect(matchesSearch(task({ title: "Record a mock answer" }), "mock", ctx)).toBe(true)
  })

  it("matches the description", () => {
    expect(matchesSearch(task({ description: "Ask about deployment" }), "deploy", ctx)).toBe(true)
  })

  it("matches the phase title", () => {
    expect(matchesSearch(task({ phase_id: "p1" }), "interview", ctx)).toBe(true)
    expect(matchesSearch(task({}), "interview", ctx)).toBe(false)
  })

  it("matches the key-result title", () => {
    expect(matchesSearch(task({ key_result_id: "kr1" }), "score", ctx)).toBe(true)
  })

  it("matches tags", () => {
    expect(matchesSearch(task({ tags: ["speaking", "urgent"] }), "urgent", ctx)).toBe(true)
  })

  it("requires every term to match (narrowing, not widening)", () => {
    const t = task({ title: "Record a mock answer", phase_id: "p1" })
    expect(matchesSearch(t, "mock interview", ctx)).toBe(true)
    expect(matchesSearch(t, "mock deployment", ctx)).toBe(false)
  })

  it("is case-insensitive and ignores empty queries", () => {
    expect(matchesSearch(task({ title: "Mock" }), "  MOCK ", ctx)).toBe(true)
    expect(matchesSearch(task({ title: "Anything" }), "   ", ctx)).toBe(true)
  })
})

// ── Smart priority ──────────────────────────────────────────────────────────

describe("smart priority sorting", () => {
  const ctx = context({ phases: [phase({ id: "active", status: "active" })] })

  const overdue = task({ id: "overdue", end_date: "2026-07-01" })
  const blockedHigh = task({
    id: "blockedHigh",
    status: "blocked",
    impact_level: "high",
    end_date: "2026-08-01",
  })
  const dueToday = task({ id: "dueToday", end_date: TODAY })
  const scheduledHigh = task({ id: "scheduledHigh", impact_level: "high", end_date: "2026-08-01" })
  const inActivePhase = task({ id: "inActivePhase", phase_id: "active", end_date: "2026-08-02" })
  const otherScheduled = task({ id: "otherScheduled", end_date: "2026-08-03" })
  const backlogTask = task({
    id: "backlogTask",
    is_anytime: true,
    daily_start_time: null,
    start_date: "",
    end_date: "",
  })
  const done = task({ id: "done", completed: true, status: "completed", end_date: "2026-07-01" })

  it("assigns the documented buckets", () => {
    expect(smartPriorityBucket(overdue, ctx)).toBe(0)
    expect(smartPriorityBucket(blockedHigh, ctx)).toBe(1)
    expect(smartPriorityBucket(dueToday, ctx)).toBe(2)
    expect(smartPriorityBucket(scheduledHigh, ctx)).toBe(3)
    expect(smartPriorityBucket(inActivePhase, ctx)).toBe(4)
    expect(smartPriorityBucket(otherScheduled, ctx)).toBe(5)
    expect(smartPriorityBucket(backlogTask, ctx)).toBe(6)
    expect(smartPriorityBucket(done, ctx)).toBe(7)
  })

  it("orders the full ladder", () => {
    const shuffled = [done, backlogTask, otherScheduled, inActivePhase, scheduledHigh, dueToday, blockedHigh, overdue]
    expect(sortTasks(shuffled, "smart", ctx).map((t) => t.id)).toEqual([
      "overdue",
      "blockedHigh",
      "dueToday",
      "scheduledHigh",
      "inActivePhase",
      "otherScheduled",
      "backlogTask",
      "done",
    ])
  })

  it("puts completed tasks after every open task", () => {
    const sorted = sortTasks([done, backlogTask], "smart", ctx)
    expect(sorted[sorted.length - 1].id).toBe("done")
  })

  it("is deterministic regardless of input order", () => {
    const a = task({ id: "a", title: "Bravo", end_date: "2026-08-01" })
    const b = task({ id: "b", title: "Alpha", end_date: "2026-08-01" })
    expect(sortTasks([a, b], "smart", ctx).map((t) => t.id)).toEqual(["b", "a"])
    expect(sortTasks([b, a], "smart", ctx).map((t) => t.id)).toEqual(["b", "a"])
  })

  it("does not treat a blocked low-impact task as top priority", () => {
    const blockedLow = task({ status: "blocked", impact_level: "low", end_date: "2026-08-01" })
    expect(smartPriorityBucket(blockedLow, ctx)).toBeGreaterThan(2)
  })
})

describe("other sorts", () => {
  const ctx = context()

  it("sorts by scheduled date, undated last", () => {
    const soon = task({ id: "soon", end_date: "2026-07-23" })
    const later = task({ id: "later", end_date: "2026-09-01" })
    const undated = task({ id: "undated", start_date: "", end_date: "" })
    expect(sortTasks([undated, later, soon], "scheduled_date", ctx).map((t) => t.id)).toEqual([
      "soon",
      "later",
      "undated",
    ])
  })

  it("sorts by impact, treating a missing impact as medium", () => {
    const high = task({ id: "high", impact_level: "high" })
    const none = task({ id: "none" })
    const low = task({ id: "low", impact_level: "low" })
    expect(sortTasks([low, none, high], "impact", ctx).map((t) => t.id)).toEqual([
      "high",
      "none",
      "low",
    ])
  })

  it("sorts by recency", () => {
    const older = task({ id: "older", created_at: "2026-07-01T00:00:00Z", updated_at: "2026-07-01T00:00:00Z" })
    const newer = task({ id: "newer", created_at: "2026-07-20T00:00:00Z", updated_at: "2026-07-20T00:00:00Z" })
    expect(sortTasks([older, newer], "recently_created", ctx).map((t) => t.id)).toEqual([
      "newer",
      "older",
    ])
    expect(sortTasks([older, newer], "recently_updated", ctx).map((t) => t.id)).toEqual([
      "newer",
      "older",
    ])
  })

  it("sorts completed tasks first for the completed-date sort", () => {
    const done = task({ id: "done", completed: true, updated_at: "2026-07-20T00:00:00Z" })
    const open = task({ id: "open", updated_at: "2026-07-21T00:00:00Z" })
    expect(sortTasks([open, done], "completed_date", ctx).map((t) => t.id)).toEqual(["done", "open"])
  })
})

describe("buildTaskView", () => {
  it("filters then sorts in one pass", () => {
    const overdue = task({ id: "overdue", end_date: "2026-07-01" })
    const done = task({ id: "done", completed: true })
    const view = buildTaskView([done, overdue], filters({ chip: "open" }), "smart", context())
    expect(view.map((t) => t.id)).toEqual(["overdue"])
  })
})

// ── Grouping ────────────────────────────────────────────────────────────────

describe("groupTasksForPlan", () => {
  const p1 = phase({ id: "p1", title: "Phase one", position: 0 })
  const p2 = phase({ id: "p2", title: "Phase two", position: 1 })
  const kr = keyResult({ id: "kr1" })
  const ctx = context({ phases: [p1, p2], keyResults: [kr] })

  it("groups by phase in plan order, backlog last", () => {
    const groups = groupTasksForPlan(
      [task({ phase_id: "p2" }), task({ phase_id: "p1" }), task({})],
      ctx,
    )
    expect(groups.map((g) => g.phase?.id ?? "backlog")).toEqual(["p1", "p2", "backlog"])
  })

  it("splits a phase's tasks by key result, unlinked last", () => {
    const linked = task({ phase_id: "p1", key_result_id: "kr1" })
    const unlinked = task({ phase_id: "p1" })
    const [group] = groupTasksForPlan([unlinked, linked], ctx)
    expect(group.keyResultGroups.map((g) => g.keyResult?.id ?? null)).toEqual(["kr1", null])
    expect(group.keyResultGroups[0].tasks).toEqual([linked])
  })

  it("reports per-phase completion, effort and unscheduled counts", () => {
    const groups = groupTasksForPlan(
      [
        task({ phase_id: "p1", completed: true, duration_minutes: 30 }),
        task({ phase_id: "p1", duration_minutes: 60, is_anytime: true, daily_start_time: null }),
      ],
      ctx,
    )
    expect(groups[0].tasks).toHaveLength(2)
    expect(groups[0].completedCount).toBe(1)
    expect(groups[0].effortMinutes).toBe(90)
    expect(groups[0].unscheduledCount).toBe(1)
  })

  it("keeps completed tasks inside their phase", () => {
    const [group] = groupTasksForPlan([task({ phase_id: "p1", completed: true })], ctx)
    expect(group.tasks).toHaveLength(1)
  })

  it("hides an empty archived phase but keeps one that still holds tasks", () => {
    const archived = phase({ id: "arch", status: "archived", position: 2 })
    const empty = groupTasksForPlan([], context({ phases: [p1, archived] }))
    expect(empty.map((g) => g.phase?.id ?? "backlog")).toEqual(["p1", "backlog"])

    const occupied = groupTasksForPlan(
      [task({ phase_id: "arch" })],
      context({ phases: [p1, archived] }),
    )
    expect(occupied.map((g) => g.phase?.id ?? "backlog")).toEqual(["p1", "arch", "backlog"])
  })

  it("puts tasks pointing at an unknown phase into the backlog rather than losing them", () => {
    const orphan = task({ phase_id: "deleted-phase" })
    const groups = groupTasksForPlan([orphan], ctx)
    expect(groups[groups.length - 1].tasks).toEqual([orphan])
  })

  it("always emits a backlog group, even when empty", () => {
    const groups = groupTasksForPlan([], ctx)
    expect(groups[groups.length - 1].phase).toBeNull()
    expect(groups[groups.length - 1].tasks).toEqual([])
  })
})
