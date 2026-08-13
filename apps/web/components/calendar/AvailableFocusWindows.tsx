"use client"

import { format, isToday } from "date-fns"
import { CalendarClock } from "lucide-react"

import { formatFreeWindow, type TimeRange } from "@/lib/free-time"

export function AvailableFocusWindows({ date, windows }: { date: Date; windows: TimeRange[] }) {
  const label = isToday(date) ? "Available today" : `Available ${format(date, "MMM d")}`
  const formattedWindows = windows.map(formatFreeWindow)
  const fullSummary = formattedWindows.join(", ")

  return (
    <div
      className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-3 py-2 text-xs sm:px-4"
      aria-live="polite"
    >
      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 font-medium text-muted-foreground">{label}:</span>
      {windows.length === 0 ? (
        <span className="truncate text-muted-foreground">No free windows</span>
      ) : (
        <span title={fullSummary} className="min-w-0 truncate font-semibold text-foreground">
          <span className="sm:hidden">
            {formattedWindows[0]}
            {formattedWindows.length > 1 ? ` +${formattedWindows.length - 1} more` : ""}
          </span>
          <span className="hidden sm:inline">{fullSummary}</span>
        </span>
      )}
    </div>
  )
}
