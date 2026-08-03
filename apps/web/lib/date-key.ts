// Korea-aware "today" key. `new Date().toISOString().slice(0, 10)` uses UTC,
// which shows the *previous* day during Korean mornings (KST is UTC+9) —
// e.g. 2026-07-21 00:30 KST is still 2026-07-20 in UTC. Daily features
// (mission, daily phrase, streaks) should all key off this instead.
export const DEFAULT_TIME_ZONE = "Asia/Seoul"

function format(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const lookup: Record<string, string> = {}
  for (const part of parts) lookup[part.type] = part.value
  return `${lookup.year}-${lookup.month}-${lookup.day}`
}

/** YYYY-MM-DD for `date` in `timeZone` (defaults to now / Asia/Seoul). Falls
 *  back to Asia/Seoul if an unsupported/invalid IANA zone is passed in. */
export function dateKeyInTimeZone(date: Date = new Date(), timeZone: string = DEFAULT_TIME_ZONE): string {
  try {
    return format(date, timeZone)
  } catch {
    return format(date, DEFAULT_TIME_ZONE)
  }
}
