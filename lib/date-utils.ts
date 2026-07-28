// Shared browser-local date helpers — pure, framework-free. Distinct from
// lib/recovery.ts's fixed KST offset (a deliberate domain-specific choice for
// that module); everything else in the app (streaks, activity log, this file)
// buckets by the user's own local clock, which is what "today" should mean in
// a personal journal/timeline.

const DAY_MS = 24 * 60 * 60 * 1000

/** "YYYY-MM-DD" in the browser's local timezone (not UTC). */
export function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Local midnight for the given date. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function endOfLocalDay(date: Date): Date {
  return new Date(startOfLocalDay(date).getTime() + DAY_MS - 1)
}

/** Local midnight of the Sunday on/before `date`. */
export function startOfLocalWeek(date: Date): Date {
  const start = startOfLocalDay(date)
  start.setDate(start.getDate() - start.getDay())
  return start
}

export function endOfLocalWeek(date: Date): Date {
  return new Date(startOfLocalWeek(date).getTime() + 7 * DAY_MS - 1)
}

export function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export type DateRangeGranularity = "day" | "week" | "month"

/** The [start, end] local-time window containing `date` at the given granularity. */
export function localRangeFor(date: Date, granularity: DateRangeGranularity): { start: Date; end: Date } {
  if (granularity === "day") return { start: startOfLocalDay(date), end: endOfLocalDay(date) }
  if (granularity === "week") return { start: startOfLocalWeek(date), end: endOfLocalWeek(date) }
  return { start: startOfLocalMonth(date), end: endOfLocalMonth(date) }
}

/** Moves `date` one whole unit forward/back at the given granularity (for prev/next navigation). */
export function shiftAnchorDate(date: Date, granularity: DateRangeGranularity, direction: 1 | -1): Date {
  const next = new Date(date)
  if (granularity === "day") next.setDate(next.getDate() + direction)
  else if (granularity === "week") next.setDate(next.getDate() + 7 * direction)
  else next.setMonth(next.getMonth() + direction)
  return next
}

// These labels are English by contract — the day branch returns the literal
// strings "Today"/"Yesterday", so the month/day parts must be English too or
// a single label reads as a mix of two languages. Passing `undefined` here
// used the host's locale instead, which rendered "7월 1일" on a ko-KR machine
// (the app's own primary audience) and made the labels non-deterministic
// across machines. Pin the locale so the whole label is one language.
const LABEL_LOCALE = "en-US"

/** Short human label for the period containing `date` (e.g. "Today", "Jul 12 – 18", "July 2026"). */
export function formatRangeLabel(date: Date, granularity: DateRangeGranularity, now: Date = new Date()): string {
  if (granularity === "day") {
    if (toLocalDateString(date) === toLocalDateString(now)) return "Today"
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (toLocalDateString(date) === toLocalDateString(yesterday)) return "Yesterday"
    return date.toLocaleDateString(LABEL_LOCALE, { month: "short", day: "numeric" })
  }
  if (granularity === "week") {
    const { start, end } = localRangeFor(date, "week")
    const sameMonth = start.getMonth() === end.getMonth()
    const startLabel = start.toLocaleDateString(LABEL_LOCALE, { month: "short", day: "numeric" })
    const endLabel = end.toLocaleDateString(LABEL_LOCALE, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" })
    return `${startLabel} – ${endLabel}`
  }
  return date.toLocaleDateString(LABEL_LOCALE, { month: "long", year: "numeric" })
}
