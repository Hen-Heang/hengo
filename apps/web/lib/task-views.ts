// Pure filtering, sorting, grouping and search for the goal's task views
// (Plan view + All Tasks view). No React, no I/O, no clock: "today" is always
// an injected Asia/Seoul civil date, so every function is deterministic and
// directly testable.

import type { Task } from "@/lib/tasks"
import type { GoalKeyResult } from "@/lib/goal-key-results"
import type { GoalPlanPhase } from "@/lib/goal-plan-phases"
import { sortPhases } from "@/lib/goal-plan-phases"
import { taskEffortMinutes } from "@/lib/weekly-capacity"
import {
  hasTimeSlot,
  isTaskDueToday,
  isTaskOverdue,
  isTaskUnscheduled,
  resolveTaskStatus,
  taskDueDate,
  type TaskStatus,
} from "@/lib/task-status"

// ── Shared context ──────────────────────────────────────────────────────────

export interface TaskViewContext {
  /** Today as a YYYY-MM-DD civil date in Asia/Seoul (see todayInAppTimezone). */
  todayYmd: string
  phases: GoalPlanPhase[]
  keyResults: GoalKeyResult[]
}

// ── Summary chips ───────────────────────────────────────────────────────────

export type TaskChip = "all" | "open" | "today" | "overdue" | "unscheduled" | "completed"

export const TASK_CHIPS: { value: TaskChip; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "today", label: "Today" },
  { value: "overdue", label: "Overdue" },
  { value: "unscheduled", label: "Unscheduled" },
  { value: "completed", label: "Completed" },
]

export function matchesChip(task: Task, chip: TaskChip, todayYmd: string): boolean {
  const status = resolveTaskStatus(task, todayYmd)
  switch (chip) {
    case "all":
      return true
    case "open":
      return status !== "completed"
    case "today":
      return isTaskDueToday(task, todayYmd)
    case "overdue":
      return isTaskOverdue(task, todayYmd)
    case "unscheduled":
      return isTaskUnscheduled(task, todayYmd)
    case "completed":
      return status === "completed"
  }
}

export function chipCounts(tasks: Task[], todayYmd: string): Record<TaskChip, number> {
  const counts = { all: 0, open: 0, today: 0, overdue: 0, unscheduled: 0, completed: 0 }
  for (const task of tasks) {
    for (const chip of TASK_CHIPS) {
      if (matchesChip(task, chip.value, todayYmd)) counts[chip.value] += 1
    }
  }
  return counts
}

// ── Filters ─────────────────────────────────────────────────────────────────

export interface TaskFilters {
  chip: TaskChip
  search: string
  statuses: TaskStatus[]
  /** Phase ids; the literal "__none__" matches the unassigned backlog. */
  phaseIds: string[]
  /** Key-result ids; "__none__" matches tasks with no key result. */
  keyResultIds: string[]
  impacts: ("low" | "medium" | "high")[]
  scheduled: "any" | "scheduled" | "unscheduled"
  dateFrom: string | null
  dateTo: string | null
  evidenceRequired: boolean
  sources: NonNullable<Task["source"]>[]
}

export const NONE_FILTER_VALUE = "__none__"

export const EMPTY_TASK_FILTERS: TaskFilters = {
  chip: "all",
  search: "",
  statuses: [],
  phaseIds: [],
  keyResultIds: [],
  impacts: [],
  scheduled: "any",
  dateFrom: null,
  dateTo: null,
  evidenceRequired: false,
  sources: [],
}

/** True when anything beyond the chip and search is narrowing the list. */
export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.statuses.length > 0 ||
    filters.phaseIds.length > 0 ||
    filters.keyResultIds.length > 0 ||
    filters.impacts.length > 0 ||
    filters.scheduled !== "any" ||
    filters.dateFrom != null ||
    filters.dateTo != null ||
    filters.evidenceRequired ||
    filters.sources.length > 0
  )
}

/**
 * Free-text search across the task's own fields **and** the titles of the
 * phase and key result it's attached to — searching "interview" should find
 * the tasks inside the "Interview prep" phase even when the word appears in
 * neither their title nor their description.
 */
export function taskSearchHaystack(task: Task, context: TaskViewContext): string {
  const phase = context.phases.find((p) => p.id === task.phase_id)
  const keyResult = context.keyResults.find((kr) => kr.id === task.key_result_id)
  return [
    task.title,
    task.description,
    phase?.title,
    keyResult?.title,
    ...(task.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function matchesSearch(task: Task, query: string, context: TaskViewContext): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true
  const haystack = taskSearchHaystack(task, context)
  // Every whitespace-separated term must appear somewhere, so "korean mock"
  // narrows rather than widens.
  return trimmed.split(/\s+/).every((term) => haystack.includes(term))
}

export function filterTasks(
  tasks: Task[],
  filters: TaskFilters,
  context: TaskViewContext,
): Task[] {
  const { todayYmd } = context
  return tasks.filter((task) => {
    if (!matchesChip(task, filters.chip, todayYmd)) return false
    if (!matchesSearch(task, filters.search, context)) return false

    if (filters.statuses.length > 0 && !filters.statuses.includes(resolveTaskStatus(task, todayYmd)))
      return false

    if (filters.phaseIds.length > 0) {
      const key = task.phase_id ?? NONE_FILTER_VALUE
      if (!filters.phaseIds.includes(key)) return false
    }

    if (filters.keyResultIds.length > 0) {
      const key = task.key_result_id ?? NONE_FILTER_VALUE
      if (!filters.keyResultIds.includes(key)) return false
    }

    if (filters.impacts.length > 0) {
      if (!task.impact_level || !filters.impacts.includes(task.impact_level)) return false
    }

    if (filters.scheduled === "scheduled" && !hasTimeSlot(task)) return false
    if (filters.scheduled === "unscheduled" && hasTimeSlot(task)) return false

    if (filters.dateFrom || filters.dateTo) {
      const due = taskDueDate(task)
      if (!due) return false
      if (filters.dateFrom && due < filters.dateFrom) return false
      if (filters.dateTo && due > filters.dateTo) return false
    }

    if (filters.evidenceRequired && !task.evidence_required) return false

    if (filters.sources.length > 0) {
      if (!filters.sources.includes(task.source ?? "manual")) return false
    }

    return true
  })
}

// ── Sorting ─────────────────────────────────────────────────────────────────

export type TaskSort =
  | "smart"
  | "scheduled_date"
  | "impact"
  | "recently_created"
  | "recently_updated"
  | "completed_date"

export const TASK_SORTS: { value: TaskSort; label: string }[] = [
  { value: "smart", label: "Smart priority" },
  { value: "scheduled_date", label: "Scheduled date" },
  { value: "impact", label: "Highest impact" },
  { value: "recently_created", label: "Recently created" },
  { value: "recently_updated", label: "Recently updated" },
  { value: "completed_date", label: "Completed date" },
]

/**
 * Smart-priority bucket (lower sorts first):
 *
 * 0. overdue and incomplete
 * 1. blocked high-impact
 * 2. due today
 * 3. scheduled high-impact
 * 4. in the active phase
 * 5. other scheduled
 * 6. unscheduled backlog
 * 7. completed
 */
export function smartPriorityBucket(task: Task, context: TaskViewContext): number {
  const { todayYmd } = context
  const status = resolveTaskStatus(task, todayYmd)
  if (status === "completed") return 7
  if (isTaskOverdue(task, todayYmd)) return 0
  if (status === "blocked" && task.impact_level === "high") return 1
  if (isTaskDueToday(task, todayYmd)) return 2

  const scheduled = hasTimeSlot(task)
  if (scheduled && task.impact_level === "high") return 3

  const activePhaseIds = new Set(
    context.phases.filter((p) => p.status === "active").map((p) => p.id),
  )
  if (task.phase_id && activePhaseIds.has(task.phase_id)) return 4
  if (scheduled) return 5
  return 6
}

const IMPACT_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }
const impactRank = (task: Task) => IMPACT_RANK[task.impact_level ?? "medium"] ?? 1

const FAR_FUTURE = "9999-12-31"
const dueOrFarFuture = (task: Task) => taskDueDate(task) ?? FAR_FUTURE

// Final tiebreak so two runs over the same data never differ. Supabase makes
// no ordering promise without an ORDER BY, so insertion order is not stable.
const byIdentity = (a: Task, b: Task) =>
  (a.title ?? "").localeCompare(b.title ?? "") || a.id.localeCompare(b.id)

export function sortTasks(tasks: Task[], sort: TaskSort, context: TaskViewContext): Task[] {
  const next = [...tasks]
  switch (sort) {
    case "smart":
      return next.sort(
        (a, b) =>
          smartPriorityBucket(a, context) - smartPriorityBucket(b, context) ||
          dueOrFarFuture(a).localeCompare(dueOrFarFuture(b)) ||
          impactRank(a) - impactRank(b) ||
          byIdentity(a, b),
      )
    case "scheduled_date":
      return next.sort(
        (a, b) => dueOrFarFuture(a).localeCompare(dueOrFarFuture(b)) || byIdentity(a, b),
      )
    case "impact":
      return next.sort(
        (a, b) =>
          impactRank(a) - impactRank(b) ||
          dueOrFarFuture(a).localeCompare(dueOrFarFuture(b)) ||
          byIdentity(a, b),
      )
    case "recently_created":
      return next.sort(
        (a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "") || byIdentity(a, b),
      )
    case "recently_updated":
      return next.sort(
        (a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "") || byIdentity(a, b),
      )
    case "completed_date":
      // Completed first, newest completion first; open tasks trail behind.
      return next.sort((a, b) => {
        const aDone = resolveTaskStatus(a, context.todayYmd) === "completed"
        const bDone = resolveTaskStatus(b, context.todayYmd) === "completed"
        if (aDone !== bDone) return aDone ? -1 : 1
        return (b.updated_at ?? "").localeCompare(a.updated_at ?? "") || byIdentity(a, b)
      })
  }
}

/** Filter then sort — the one entry point both views use. */
export function buildTaskView(
  tasks: Task[],
  filters: TaskFilters,
  sort: TaskSort,
  context: TaskViewContext,
): Task[] {
  return sortTasks(filterTasks(tasks, filters, context), sort, context)
}

// ── Grouping (Plan view) ────────────────────────────────────────────────────

export interface KeyResultGroup {
  keyResult: GoalKeyResult | null
  tasks: Task[]
}

export interface PhaseGroup {
  phase: GoalPlanPhase | null
  /** Tasks in this phase, split by the key result they serve. */
  keyResultGroups: KeyResultGroup[]
  tasks: Task[]
  completedCount: number
  effortMinutes: number
  unscheduledCount: number
}

/**
 * Phase → key result → tasks, with the unassigned backlog last (as a group
 * whose `phase` is null). Phases keep their plan order; archived phases are
 * included only when they still hold tasks, so nothing can go invisible.
 */
export function groupTasksForPlan(
  tasks: Task[],
  context: TaskViewContext,
  sort: TaskSort = "smart",
): PhaseGroup[] {
  const byPhase = new Map<string, Task[]>()
  for (const task of tasks) {
    const key = task.phase_id ?? NONE_FILTER_VALUE
    const list = byPhase.get(key)
    if (list) list.push(task)
    else byPhase.set(key, [task])
  }

  const buildGroup = (phase: GoalPlanPhase | null, phaseTasks: Task[]): PhaseGroup => {
    const sorted = sortTasks(phaseTasks, sort, context)

    const byKeyResult = new Map<string, Task[]>()
    for (const task of sorted) {
      const key = task.key_result_id ?? NONE_FILTER_VALUE
      const list = byKeyResult.get(key)
      if (list) list.push(task)
      else byKeyResult.set(key, [task])
    }

    // Key results in their own stable order, with the "no key result" bucket last.
    const keyResultGroups: KeyResultGroup[] = context.keyResults
      .filter((kr) => byKeyResult.has(kr.id))
      .map((kr) => ({ keyResult: kr, tasks: byKeyResult.get(kr.id)! }))
    const unlinked = byKeyResult.get(NONE_FILTER_VALUE)
    if (unlinked) keyResultGroups.push({ keyResult: null, tasks: unlinked })

    return {
      phase,
      keyResultGroups,
      tasks: sorted,
      completedCount: sorted.filter((t) => resolveTaskStatus(t, context.todayYmd) === "completed")
        .length,
      effortMinutes: sorted.reduce((sum, t) => sum + taskEffortMinutes(t), 0),
      unscheduledCount: sorted.filter((t) => isTaskUnscheduled(t, context.todayYmd)).length,
    }
  }

  const groups: PhaseGroup[] = sortPhases(context.phases)
    .filter((phase) => phase.status !== "archived" || (byPhase.get(phase.id)?.length ?? 0) > 0)
    .map((phase) => buildGroup(phase, byPhase.get(phase.id) ?? []))

  // Orphans: tasks pointing at a phase this goal no longer lists (deleted or
  // filtered out) fall into the backlog rather than vanishing.
  const knownPhaseIds = new Set(context.phases.map((p) => p.id))
  const backlog = [
    ...(byPhase.get(NONE_FILTER_VALUE) ?? []),
    ...tasks.filter((t) => t.phase_id && !knownPhaseIds.has(t.phase_id)),
  ]
  groups.push(buildGroup(null, backlog))

  return groups
}
