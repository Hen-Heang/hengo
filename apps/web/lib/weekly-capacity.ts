// Weekly capacity + schedule conflict detection (Goal Planning & Scheduling).
//
// Capacity is `goals.weekly_capacity_minutes`. Nothing here blocks scheduling
// when a week is over capacity — the product decision is to warn and explain
// (see docs/goal-planning-scheduling-audit.md).

import type { Task } from "@/lib/tasks"
import { getTaskDateKey, parseHHMMToMinutes } from "@/lib/calendar"
import { addDays } from "@/lib/goal-schedule-rules"
import { hasTimeSlot } from "@/lib/task-status"

export type CapacityStatus = "unset" | "healthy" | "nearly_full" | "over_capacity"

export const CAPACITY_STATUS_LABELS: Record<CapacityStatus, string> = {
  unset: "No weekly capacity set",
  healthy: "Healthy",
  nearly_full: "Nearly full",
  over_capacity: "Over capacity",
}

/** ≥ this share of capacity is "nearly full"; > 100% is "over capacity". */
const NEARLY_FULL_RATIO = 0.85

export interface WeekSummary {
  weekStart: string
  weekEnd: string
  capacityMinutes: number | null
  plannedSessions: number
  completedSessions: number
  plannedMinutes: number
  completedMinutes: number
  /** Capacity left after planned minutes; 0 when over (see overMinutes). */
  remainingMinutes: number
  overMinutes: number
  unscheduledCount: number
  status: CapacityStatus
}

/** Minutes a task is expected to take — explicit effort wins over duration. */
export function taskEffortMinutes(task: Pick<Task, "effort_minutes" | "duration_minutes">): number {
  const effort = task.effort_minutes
  if (typeof effort === "number" && effort > 0) return effort
  const duration = task.duration_minutes
  if (typeof duration === "number" && duration > 0) return duration
  return 0
}

/**
 * A task counts as "scheduled" when it has a concrete day *and* a time —
 * `is_anytime` tasks have a day but no slot, so they sit in the backlog for
 * capacity purposes while still showing on the day they're due.
 *
 * Alias of `hasTimeSlot` so there is exactly one definition of "scheduled".
 */
export const isScheduled = (task: Task): boolean => hasTimeSlot(task)

/** Sunday that starts the week containing `ymd` (civil dates, UTC-anchored). */
export function weekStartOf(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return addDays(ymd, -dow)
}

/**
 * Capacity summary for the week containing `todayYmd`, over the goal's tasks.
 * `unscheduledCount` counts incomplete tasks with no time slot at all (across
 * the whole goal, not just this week) — that's the backlog the Schedule tab
 * surfaces.
 */
export function summarizeWeek(
  tasks: Task[],
  options: { todayYmd: string; capacityMinutes?: number | null },
): WeekSummary {
  const weekStart = weekStartOf(options.todayYmd)
  const weekEnd = addDays(weekStart, 6)
  const capacityMinutes =
    typeof options.capacityMinutes === "number" && options.capacityMinutes > 0
      ? options.capacityMinutes
      : null

  let plannedSessions = 0
  let completedSessions = 0
  let plannedMinutes = 0
  let completedMinutes = 0

  for (const task of tasks) {
    const key = getTaskDateKey(task.start_date)
    if (!key || key < weekStart || key > weekEnd) continue
    const minutes = taskEffortMinutes(task)
    plannedSessions += 1
    plannedMinutes += minutes
    if (task.completed) {
      completedSessions += 1
      completedMinutes += minutes
    }
  }

  const unscheduledCount = tasks.filter((t) => !t.completed && !isScheduled(t)).length

  const remainingMinutes = capacityMinutes ? Math.max(0, capacityMinutes - plannedMinutes) : 0
  const overMinutes = capacityMinutes ? Math.max(0, plannedMinutes - capacityMinutes) : 0

  let status: CapacityStatus = "unset"
  if (capacityMinutes) {
    const ratio = plannedMinutes / capacityMinutes
    status = ratio > 1 ? "over_capacity" : ratio >= NEARLY_FULL_RATIO ? "nearly_full" : "healthy"
  }

  return {
    weekStart,
    weekEnd,
    capacityMinutes,
    plannedSessions,
    completedSessions,
    plannedMinutes,
    completedMinutes,
    remainingMinutes,
    overMinutes,
    unscheduledCount,
    status,
  }
}

/** Two timed tasks on the same day whose [start, end) minute ranges overlap. */
export interface ScheduleConflict {
  a: Task
  b: Task
  date: string
}

const timeBounds = (task: Task): [number, number] | null => {
  const start = parseHHMMToMinutes(task.daily_start_time)
  if (start == null) return null
  const end =
    parseHHMMToMinutes(task.daily_end_time) ??
    start + (taskEffortMinutes(task) || 60)
  return [start, Math.max(start + 1, end)]
}

/** All pairwise time overlaps among the goal's timed, incomplete tasks. */
export function findScheduleConflicts(tasks: Task[]): ScheduleConflict[] {
  const byDay = new Map<string, Task[]>()
  for (const task of tasks) {
    if (task.completed || !isScheduled(task)) continue
    const key = getTaskDateKey(task.start_date)
    if (!key) continue
    const list = byDay.get(key)
    if (list) list.push(task)
    else byDay.set(key, [task])
  }

  const conflicts: ScheduleConflict[] = []
  for (const [date, dayTasks] of byDay) {
    const bounded = dayTasks
      .map((task) => ({ task, bounds: timeBounds(task) }))
      .filter((t): t is { task: Task; bounds: [number, number] } => t.bounds !== null)
      .sort((x, y) => x.bounds[0] - y.bounds[0])
    for (let i = 0; i < bounded.length; i++) {
      for (let j = i + 1; j < bounded.length; j++) {
        if (bounded[j].bounds[0] >= bounded[i].bounds[1]) break
        conflicts.push({ a: bounded[i].task, b: bounded[j].task, date })
      }
    }
  }
  return conflicts
}
