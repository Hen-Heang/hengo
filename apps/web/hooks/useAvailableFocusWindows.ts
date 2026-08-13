"use client"

import { useMemo } from "react"
import { addDays, startOfDay } from "date-fns"

import { useGoogleCalendarFreeBusy } from "@/hooks/useGoogleCalendarFreeBusy"
import { getAvailableFocusWindows, type TimeRange } from "@/lib/free-time"
import type { Task } from "@/lib/tasks"

/**
 * Phase 8: today's (or any day's) free focus windows, combining Hengo tasks
 * already loaded for that day with Google's FreeBusy blocks. `tasks` must be
 * the day's *Hengo* tasks (e.g. filterTasksByDate(tasks, date)) — not the
 * Google-adapted merged list from the Planner view, which would double-count
 * Google busy time.
 */
export function useAvailableFocusWindows({
  date,
  tasks,
  enabled,
}: {
  date: Date
  tasks: Task[]
  enabled: boolean
}): TimeRange[] {
  const range = useMemo(() => {
    const start = startOfDay(date)
    return { timeMin: start.toISOString(), timeMax: addDays(start, 1).toISOString() }
  }, [date])

  const { busy } = useGoogleCalendarFreeBusy({ enabled, timeMin: range.timeMin, timeMax: range.timeMax })

  return useMemo(
    () => getAvailableFocusWindows({ date, tasks, googleBusy: busy }),
    [date, tasks, busy]
  )
}
