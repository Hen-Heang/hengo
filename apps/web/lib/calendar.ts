// Pure calendar helpers ported from Orbit/DailyGoalMap
// (src/utils/parseYMD.ts, taskDateUtils.ts, timeGrid.ts). No Supabase / router
// coupling — these are date math + time-grid layout used by the calendar views.

import {
  addDays,
  format,
  isValid,
  parseISO,
  subDays,
  format as formatDateFn,
} from "date-fns"
import type { Task } from "@/lib/tasks"

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

// ── parseYMD ─────────────────────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string as a local Date at midnight; null if invalid. */
export function parseYMD(dateString?: string | null): Date | null {
  if (!dateString) return null
  const parts = dateString.split("-")
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dt = new Date(y, m - 1, d)
      dt.setHours(0, 0, 0, 0)
      return dt
    }
  }
  const parsed = new Date(dateString)
  return isNaN(parsed.getTime()) ? null : parsed
}

/** Format a Date as yyyy-MM-dd using local date values. */
export function formatYMD(date: Date): string {
  return formatDateFn(date, "yyyy-MM-dd")
}

// ── Task date keys / filtering ──────────────────────────────────────────────

const parseTaskDate = (raw?: string | null): Date | null => {
  if (!raw) return null
  if (DATE_ONLY_RE.test(raw)) return parseYMD(raw)
  const parsed = new Date(raw)
  return isNaN(parsed.getTime()) ? null : parsed
}

export const getTaskDateKey = (raw?: string | null): string | null => {
  if (!raw) return null
  const str = String(raw).trim()
  if (DATE_ONLY_RE.test(str)) return str
  const parsed = parseTaskDate(str)
  return parsed ? format(parsed, "yyyy-MM-dd") : null
}

export const getTaskAnchorDate = (task: {
  start_date?: string | null
}): Date => parseYMD(getTaskDateKey(task.start_date)) || new Date()

/** Tasks that overlap the given calendar day, sorted by daily start time. */
export const filterTasksByDate = (tasks: Task[], date: Date): Task[] => {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEndExclusive = new Date(dayStart)
  dayEndExclusive.setDate(dayEndExclusive.getDate() + 1)

  return tasks
    .filter((task) => {
      const startDate = task.start_date
      const endDate = task.end_date || task.start_date
      if (!startDate) return false
      const start = parseTaskDate(startDate)
      const end = parseTaskDate(endDate || startDate)
      if (!start || !end) return false
      return start < dayEndExclusive && end >= dayStart
    })
    .sort((a, b) => {
      if (a.daily_start_time && b.daily_start_time) {
        return a.daily_start_time.localeCompare(b.daily_start_time)
      }
      if (a.daily_start_time) return -1
      if (b.daily_start_time) return 1
      const aKey = getTaskDateKey(a.start_date) || ""
      const bKey = getTaskDateKey(b.start_date) || ""
      return aKey.localeCompare(bKey)
    })
}

// ── Day navigation ──────────────────────────────────────────────────────────

export const getNextDay = (date: Date): Date => addDays(date, 1)
export const getPreviousDay = (date: Date): Date => subDays(date, 1)

// ── Display formatting ──────────────────────────────────────────────────────

export const formatTaskDateRange = (
  startDateValue?: string | null,
  endDateValue?: string | null
): string => {
  if (!startDateValue) return "-"
  const startDate = parseISO(startDateValue)
  const endDate = endDateValue ? parseISO(endDateValue) : startDate
  if (!isValid(startDate)) return "-"
  if (!isValid(endDate) || startDateValue.slice(0, 10) === endDateValue?.slice(0, 10)) {
    return format(startDate, "MMM d, yyyy")
  }
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
}

export const formatTaskTime = (timeValue?: string | null): string => {
  if (!timeValue) return "-"
  const [hours = 0, minutes = 0] = timeValue.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return isValid(date) ? format(date, "h:mm a") : "-"
}

export const formatTaskTimeRange = (
  startTime?: string | null,
  endTime?: string | null,
  isAnytime?: boolean | null
): string => {
  if (isAnytime) return "Anytime"
  if (!startTime) return "-"
  const formattedStart = formatTaskTime(startTime)
  const formattedEnd = endTime ? formatTaskTime(endTime) : null
  return formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart
}

// ── Time-grid layout (week/day views) ───────────────────────────────────────

export const MINUTES_IN_DAY = 24 * 60

/** Parse an 'HH:MM'/'HH:MM:SS' string to minutes-since-midnight, or null. */
export const parseHHMMToMinutes = (value?: string | null): number | null => {
  if (!value) return null
  const [h, m] = value.split(":")
  const hours = parseInt(h, 10)
  const minutes = parseInt(m ?? "0", 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

/** Tolerant variant for form fields: invalid/empty maps to 0. */
export const hhmmToMinutes = (value?: string | null): number =>
  parseHHMMToMinutes(value) ?? 0

export const minutesToHHMM = (n: number): string =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`

/**
 * When the start time reaches/passes the end time, bump the end to start + 1h
 * (capped at 23:59); otherwise leave the end as-is.
 */
export const bumpEndAfterStart = (start: string, end: string): string => {
  const s = hhmmToMinutes(start)
  return s >= hhmmToMinutes(end)
    ? minutesToHHMM(Math.min(s + 60, MINUTES_IN_DAY - 1))
    : end
}

export interface TaskTimeBounds {
  isAllDay: boolean
  startMin: number
  endMin: number
}

const MIN_BLOCK_MINUTES = 30

export const getTaskTimeBounds = (task: Task): TaskTimeBounds => {
  if (task.is_anytime) return { isAllDay: true, startMin: 0, endMin: MIN_BLOCK_MINUTES }

  const startMin = parseHHMMToMinutes(task.daily_start_time)
  if (startMin == null) return { isAllDay: true, startMin: 0, endMin: MIN_BLOCK_MINUTES }

  let endMin = parseHHMMToMinutes(task.daily_end_time)
  if (endMin == null || endMin <= startMin) {
    const dur =
      typeof task.duration_minutes === "number" && task.duration_minutes > 0
        ? task.duration_minutes
        : 60
    endMin = startMin + dur
  }

  const clampedStart = Math.max(0, Math.min(startMin, MINUTES_IN_DAY))
  const clampedEnd = Math.max(
    clampedStart + MIN_BLOCK_MINUTES,
    Math.min(endMin, MINUTES_IN_DAY)
  )
  return { isAllDay: false, startMin: clampedStart, endMin: clampedEnd }
}

export interface PositionedTask {
  task: Task
  startMin: number
  endMin: number
  lane: number
  lanes: number
  /** How many lanes this event expands across (fills free space to its right). */
  span: number
}

/** Lay out a day's timed tasks into side-by-side lanes (Google-Calendar style). */
export const layoutDayTasks = (tasks: Task[]): PositionedTask[] => {
  const timed = tasks
    .map((task) => ({ task, bounds: getTaskTimeBounds(task) }))
    .filter((t) => !t.bounds.isAllDay)
    .map((t) => ({ task: t.task, startMin: t.bounds.startMin, endMin: t.bounds.endMin }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const result: PositionedTask[] = []
  let cluster: PositionedTask[] = []
  let clusterEnd = -1

  const flush = () => {
    const lanes = cluster.reduce((max, t) => Math.max(max, t.lane + 1), 0)
    cluster.forEach((t) => {
      t.lanes = lanes
      // Expand rightward into adjacent lanes that are free for this event's
      // full duration, so a block fills the available width instead of being
      // pinned to a single 1/lanes column when there's empty space beside it.
      let span = 1
      for (let l = t.lane + 1; l < lanes; l++) {
        const blocked = cluster.some(
          (o) => o !== t && o.lane === l && o.startMin < t.endMin && o.endMin > t.startMin
        )
        if (blocked) break
        span++
      }
      t.span = span
    })
    result.push(...cluster)
    cluster = []
    clusterEnd = -1
  }

  for (const ev of timed) {
    if (cluster.length && ev.startMin >= clusterEnd) flush()

    const laneEnds: number[] = []
    cluster.forEach((t) => {
      laneEnds[t.lane] = Math.max(laneEnds[t.lane] ?? -1, t.endMin)
    })
    let lane = laneEnds.findIndex((end) => end <= ev.startMin)
    if (lane === -1) lane = laneEnds.length

    cluster.push({ task: ev.task, startMin: ev.startMin, endMin: ev.endMin, lane, lanes: 1, span: 1 })
    clusterEnd = Math.max(clusterEnd, ev.endMin)
  }
  if (cluster.length) flush()

  return result
}

export const getAllDayTasks = (tasks: Task[]): Task[] =>
  tasks.filter((task) => getTaskTimeBounds(task).isAllDay)
