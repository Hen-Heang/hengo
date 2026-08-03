// Task workflow status — the state machine that `completed: boolean` couldn't
// express, plus the one canonical rule for keeping the two in sync.
//
// ── Why both exist ─────────────────────────────────────────────────────────
// `tasks` is shared with Orbit/DailyGoalMap, which only knows about
// `completed`. If that app (or any older client) toggles the boolean, a stored
// `status` would silently go stale. So:
//
//   READ:  `completed` wins whenever the two disagree — see resolveTaskStatus.
//   WRITE: never set one without the other — use taskStatusPatch /
//          taskCompletionPatch, which always emit both.
//
// ── When `completed` can be dropped ────────────────────────────────────────
// All three must hold:
//   1. No writer outside this repo sets `tasks.completed` (Orbit's task code
//      is retired or migrated).
//   2. Every write in this repo goes through the two patch helpers below —
//      verifiable with `grep -rn "completed:" lib/api`.
//   3. A backfill has run so no row has `completed <> (status = 'completed')`.
// Then: drop the column, delete `resolveTaskStatus`'s legacy branch, and make
// `status` the sole source of truth. Until then the boolean is load-bearing.

import { TZDate } from "@date-fns/tz"
import type { Task, TaskStatus } from "@/lib/tasks"
import { getTaskDateKey } from "@/lib/calendar"

// Single definition lives with the row shape in lib/tasks.ts; re-exported here
// so callers can get the type and its helpers from one place.
export type { TaskStatus }

export const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "scheduled",
  "in_progress",
  "blocked",
  "completed",
]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  scheduled: "Scheduled",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
}

/** The app's planning timezone. Matches goal_schedule_rules.timezone's default. */
export const APP_TIMEZONE = "Asia/Seoul"

/**
 * Today as a YYYY-MM-DD civil date **in Asia/Seoul**, whatever the host clock
 * says. A user in Seoul at 00:30 is already on the next day; deriving "today"
 * from the runtime's local date would mark their tasks overdue a day early
 * (or late, for a server in UTC).
 */
export function todayInAppTimezone(now: Date = new Date(), timeZone = APP_TIMEZONE): string {
  const zoned = new TZDate(now, timeZone)
  return `${zoned.getFullYear()}-${String(zoned.getMonth() + 1).padStart(2, "0")}-${String(
    zoned.getDate(),
  ).padStart(2, "0")}`
}

/** A task is scheduled when it has both a day and a concrete time slot. */
export function hasTimeSlot(task: Pick<Task, "is_anytime" | "daily_start_time">): boolean {
  return !task.is_anytime && Boolean(task.daily_start_time)
}

/** The day a task lands on, or null when it has no usable date. */
export function taskDueDate(task: Pick<Task, "start_date" | "end_date">): string | null {
  return getTaskDateKey(task.end_date) ?? getTaskDateKey(task.start_date)
}

/**
 * Status implied by a task's schedule alone — used to backfill legacy rows and
 * to pick a sensible status when a task is re-opened. Mirrors the SQL backfill
 * in 20260724020000_task_workflow_status.sql exactly.
 */
export function deriveStatusFromSchedule(
  task: Pick<Task, "start_date" | "end_date">,
  todayYmd: string,
): Extract<TaskStatus, "scheduled" | "backlog"> {
  const due = taskDueDate(task)
  return due != null && due >= todayYmd ? "scheduled" : "backlog"
}

/**
 * The canonical read. `completed` wins on disagreement, in both directions:
 * a legacy writer can only flip the boolean, so trusting the enum over it
 * would show a finished task as open (or an open task as finished).
 */
export function resolveTaskStatus(task: Task, todayYmd: string): TaskStatus {
  if (task.completed) return "completed"
  if (task.status && task.status !== "completed") return task.status
  // Either no status at all (pre-migration row) or a stale "completed" on a
  // task the boolean says is open.
  return deriveStatusFromSchedule(task, todayYmd)
}

/** Overdue is derived, never stored — it changes with the clock, not a write. */
export function isTaskOverdue(task: Task, todayYmd: string): boolean {
  if (resolveTaskStatus(task, todayYmd) === "completed") return false
  const due = taskDueDate(task)
  return due != null && due < todayYmd
}

export function isTaskDueToday(task: Task, todayYmd: string): boolean {
  if (resolveTaskStatus(task, todayYmd) === "completed") return false
  return taskDueDate(task) === todayYmd
}

/** Unscheduled = open and without a concrete time slot. */
export function isTaskUnscheduled(task: Task, todayYmd: string): boolean {
  return resolveTaskStatus(task, todayYmd) !== "completed" && !hasTimeSlot(task)
}

export interface TaskScheduleDisplay {
  /** True when this task counts toward the Unscheduled chip and the backlog. */
  unscheduled: boolean
  /** The civil day the task sits on, or null when it has none. */
  dueDate: string | null
  /** What a row / details header should render for "Schedule". */
  label: string
}

/**
 * The one schedule label. Rows used to render `dueDate ?? "Unscheduled"`, which
 * silently used a *different* rule than the rest of the app: "unscheduled"
 * everywhere else means **no time slot** (isTaskUnscheduled), not "no date".
 * `moveToBacklog` deliberately keeps a task's day and drops only its slot, so
 * every backlogged task still had a date and no surface ever said "Unscheduled"
 * — while the chip, the Schedule tab's backlog and the capacity card all
 * counted it. The day is kept alongside the word so nothing is lost.
 */
export function taskScheduleDisplay(task: Task, todayYmd: string): TaskScheduleDisplay {
  const dueDate = taskDueDate(task)
  const unscheduled = isTaskUnscheduled(task, todayYmd)
  const label = unscheduled
    ? dueDate
      ? `Unscheduled · ${dueDate}`
      : "Unscheduled"
    : (dueDate ?? "Unscheduled")
  return { unscheduled, dueDate, label }
}

export interface TaskStatusPatch {
  status: TaskStatus
  completed: boolean
  blocked_reason?: string | null
}

/** Write a status. Always mirrors `completed`, and clears a stale block note. */
export function taskStatusPatch(status: TaskStatus, blockedReason?: string | null): TaskStatusPatch {
  return {
    status,
    completed: status === "completed",
    blocked_reason: status === "blocked" ? (blockedReason?.trim() || null) : null,
  }
}

/** Write a completion toggle. Always mirrors `status`. */
export function taskCompletionPatch(
  completed: boolean,
  task: Pick<Task, "start_date" | "end_date">,
  todayYmd: string,
): TaskStatusPatch {
  return completed
    ? { status: "completed", completed: true }
    : { status: deriveStatusFromSchedule(task, todayYmd), completed: false }
}

export const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  backlog: "bg-foreground/5 text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  in_progress: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  blocked: "bg-red-500/10 text-red-700 dark:text-red-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
}
