// Schedule rules + the recurring-occurrence engine (Goal Planning &
// Scheduling — see docs/goal-planning-scheduling-audit.md).
//
// A Schedule Rule is a recurring commitment ("Mon/Wed/Fri 07:00, 45 min").
// `generateOccurrences` turns one into a list of calendar dates; the API layer
// materialises those into `tasks` rows on an explicit user action.
//
// ── Timezone safety ────────────────────────────────────────────────────────
// Every date in this module is a bare YYYY-MM-DD *civil* date, and all
// arithmetic runs through Date.UTC. Nothing calls getFullYear/getMonth/getDate
// or constructs a Date from a local-time string, so the output is identical in
// every runtime timezone — which also makes it inherently DST-safe. The rule's
// `timezone` column records the wall-clock zone the `start_time` is meant in
// (default Asia/Seoul, which has no DST today); it deliberately does not shift
// the civil dates, because "every Monday" means Monday in the user's zone
// regardless of where the code runs.

import { z } from "zod"

export type RecurrenceType = "daily" | "weekly" | "monthly"

export interface GoalScheduleRule {
  id: string
  goal_id: string
  user_id: string
  phase_id: string | null
  key_result_id: string | null
  title: string
  description: string | null
  recurrence_type: RecurrenceType
  recurrence_interval: number
  days_of_week: number[] | null
  day_of_month: number | null
  start_time: string | null
  duration_minutes: number | null
  start_date: string
  end_date: string | null
  timezone: string
  active: boolean
  created_at: string
  updated_at: string
}

export const DEFAULT_SCHEDULE_TIMEZONE = "Asia/Seoul"

/** Rolling window the "Create next 14 days" action generates. */
export const OCCURRENCE_WINDOW_DAYS = 14

/** Hard ceiling so a malformed rule can never generate unbounded tasks. */
export const MAX_OCCURRENCES = 200

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

const YMD = /^\d{4}-\d{2}-\d{2}$/
const HHMM = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/

// ── Validation ──────────────────────────────────────────────────────────────

export const scheduleRuleInputSchema = z
  .object({
    title: z.string().trim().min(1, "Give this routine a name").max(200),
    description: z.string().trim().max(2000).nullish(),
    phase_id: z.string().uuid().nullish(),
    key_result_id: z.string().uuid().nullish(),
    recurrence_type: z.enum(["daily", "weekly", "monthly"]),
    recurrence_interval: z.number().int().min(1, "Repeat every 1 or more").max(52).default(1),
    days_of_week: z.array(z.number().int().min(0).max(6)).nullish(),
    day_of_month: z.number().int().min(1).max(31).nullish(),
    start_time: z.string().regex(HHMM, "Use a HH:MM time").nullish(),
    duration_minutes: z.number().int().positive("Duration must be positive").max(1440).nullish(),
    start_date: z.string().regex(YMD, "Use a YYYY-MM-DD date"),
    end_date: z.string().regex(YMD, "Use a YYYY-MM-DD date").nullish(),
    timezone: z.string().min(1).default(DEFAULT_SCHEDULE_TIMEZONE),
    active: z.boolean().default(true),
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: "A routine can't end before it starts",
    path: ["end_date"],
  })
  .refine((v) => v.recurrence_type !== "weekly" || (v.days_of_week?.length ?? 0) > 0, {
    message: "Pick at least one day of the week",
    path: ["days_of_week"],
  })
  .refine((v) => v.recurrence_type !== "monthly" || v.day_of_month != null, {
    message: "Pick a day of the month",
    path: ["day_of_month"],
  })

export type ScheduleRuleInput = z.infer<typeof scheduleRuleInputSchema>

// ── Civil-date helpers (UTC-anchored, timezone-independent) ─────────────────

const parseYmdUtc = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const toYmd = (date: Date): string => date.toISOString().slice(0, 10)

export const addDays = (ymd: string, days: number): string => {
  const dt = parseYmdUtc(ymd)
  dt.setUTCDate(dt.getUTCDate() + days)
  return toYmd(dt)
}

const diffDays = (a: string, b: string): number =>
  Math.round((parseYmdUtc(a).getTime() - parseYmdUtc(b).getTime()) / 86_400_000)

/** 0 = Sunday … 6 = Saturday, for the civil date (not the local weekday). */
export const weekdayOf = (ymd: string): number => parseYmdUtc(ymd).getUTCDay()

/** Sunday that starts the week containing `ymd`. */
const weekStart = (ymd: string): string => addDays(ymd, -weekdayOf(ymd))

const monthIndex = (ymd: string): number => {
  const [y, m] = ymd.split("-").map(Number)
  return y * 12 + (m - 1)
}

const daysInMonth = (year: number, month1: number): number =>
  new Date(Date.UTC(year, month1, 0)).getUTCDate()

const maxYmd = (...values: (string | null | undefined)[]): string | null =>
  values.filter((v): v is string => !!v).reduce<string | null>((a, v) => (a && a > v ? a : v), null)

const minYmd = (...values: (string | null | undefined)[]): string | null =>
  values.filter((v): v is string => !!v).reduce<string | null>((a, v) => (a && a < v ? a : v), null)

// ── Occurrence generation ───────────────────────────────────────────────────

export interface OccurrenceRule {
  recurrence_type: RecurrenceType
  recurrence_interval: number
  days_of_week?: number[] | null
  day_of_month?: number | null
  start_date: string
  end_date?: string | null
  timezone?: string
}

export interface OccurrenceWindow {
  /** First date the caller wants occurrences for (inclusive, YYYY-MM-DD). */
  from: string
  /** Last date the caller wants occurrences for (inclusive, YYYY-MM-DD). */
  to: string
}

export interface OccurrenceOptions {
  /** Goal window — occurrences never fall outside it. */
  goalStartDate?: string | null
  goalTargetDate?: string | null
  /** Ceiling on returned dates (defaults to MAX_OCCURRENCES). */
  limit?: number
}

/**
 * Deterministic list of civil dates a rule fires on, intersected with the
 * requested window, the rule's own start/end, and the goal's date window.
 *
 * - Daily: every `interval` days counted from `start_date`.
 * - Weekly: the selected weekdays, in every `interval`-th week counted from
 *   the (Sunday-anchored) week containing `start_date`.
 * - Monthly: `day_of_month` in every `interval`-th month counted from
 *   `start_date`'s month. Months that are too short for the requested day
 *   (e.g. the 31st in February) are **skipped**, never clamped — a clamped
 *   date would silently move a commitment onto a day the user didn't pick.
 *
 * Always sorted ascending and free of duplicates.
 */
export function generateOccurrences(
  rule: OccurrenceRule,
  window: OccurrenceWindow,
  options: OccurrenceOptions = {},
): string[] {
  const limit = Math.max(0, Math.min(options.limit ?? MAX_OCCURRENCES, MAX_OCCURRENCES))
  if (limit === 0) return []

  const interval = Math.max(1, Math.trunc(rule.recurrence_interval || 1))

  const from = maxYmd(window.from, rule.start_date, options.goalStartDate)
  const to = minYmd(window.to, rule.end_date, options.goalTargetDate)
  if (!from || !to || from > to) return []

  const dates: string[] = []

  if (rule.recurrence_type === "daily") {
    // Snap forward to the first on-cycle day at or after `from`.
    const offset = diffDays(from, rule.start_date)
    const remainder = ((offset % interval) + interval) % interval
    let cursor = remainder === 0 ? from : addDays(from, interval - remainder)
    while (cursor <= to && dates.length < limit) {
      dates.push(cursor)
      cursor = addDays(cursor, interval)
    }
  } else if (rule.recurrence_type === "weekly") {
    const days = [...new Set((rule.days_of_week ?? []).filter((d) => d >= 0 && d <= 6))].sort(
      (a, b) => a - b,
    )
    if (days.length === 0) return []
    const anchorWeek = weekStart(rule.start_date)
    let week = weekStart(from)
    while (week <= to && dates.length < limit) {
      const weeksSinceAnchor = Math.round(diffDays(week, anchorWeek) / 7)
      if (weeksSinceAnchor >= 0 && weeksSinceAnchor % interval === 0) {
        for (const day of days) {
          const date = addDays(week, day)
          if (date >= from && date <= to && dates.length < limit) dates.push(date)
        }
      }
      week = addDays(week, 7)
    }
  } else {
    const day = rule.day_of_month
    if (day == null || day < 1 || day > 31) return []
    const anchorMonth = monthIndex(rule.start_date)
    let month = monthIndex(from)
    const lastMonth = monthIndex(to)
    while (month <= lastMonth && dates.length < limit) {
      const monthsSinceAnchor = month - anchorMonth
      if (monthsSinceAnchor >= 0 && monthsSinceAnchor % interval === 0) {
        const year = Math.floor(month / 12)
        const month1 = (month % 12) + 1
        if (day <= daysInMonth(year, month1)) {
          const date = `${String(year).padStart(4, "0")}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          if (date >= from && date <= to) dates.push(date)
        }
      }
      month += 1
    }
  }

  return [...new Set(dates)].sort()
}

/**
 * The default "next 14 days" window, anchored on a civil date the caller
 * supplies (so callers stay testable and the window never depends on the
 * server's local clock).
 */
export function rollingWindow(todayYmd: string, days = OCCURRENCE_WINDOW_DAYS): OccurrenceWindow {
  return { from: todayYmd, to: addDays(todayYmd, Math.max(0, days - 1)) }
}

/** Human-readable summary of a rule's cadence, e.g. "Every 2 weeks · Mon, Wed". */
export function describeRecurrence(rule: OccurrenceRule): string {
  const n = Math.max(1, Math.trunc(rule.recurrence_interval || 1))
  if (rule.recurrence_type === "daily") return n === 1 ? "Every day" : `Every ${n} days`
  if (rule.recurrence_type === "weekly") {
    const days = [...new Set(rule.days_of_week ?? [])].sort((a, b) => a - b)
    const label = days.map((d) => WEEKDAY_LABELS[d]).join(", ")
    const cadence = n === 1 ? "Every week" : `Every ${n} weeks`
    return label ? `${cadence} · ${label}` : cadence
  }
  const cadence = n === 1 ? "Every month" : `Every ${n} months`
  return rule.day_of_month ? `${cadence} · day ${rule.day_of_month}` : cadence
}

/** 'HH:MM' end time derived from a start time + duration, clamped to 23:59. */
export function endTimeFor(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number)
  const total = Math.min(h * 60 + m + Math.max(1, durationMinutes), 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}
