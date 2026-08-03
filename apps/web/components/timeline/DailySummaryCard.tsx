"use client"

import { TimelineEntryRow } from "@/components/timeline/TimelineEntryRow"
import type { DailySummary } from "@/lib/timeline"

function formatDayHeading(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return "Today"
  if (isYesterday) return "Yesterday"
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
}

export function DailySummaryCard({ day }: { day: DailySummary }) {
  const parts: string[] = []
  if (day.completedCount > 0) parts.push(`${day.completedCount} completed`)
  if (day.hengoMinutes > 0) parts.push(`${day.hengoMinutes} min in Hengo`)
  if (day.manualActivityCount > 0) parts.push(`${day.manualActivityCount} activity logged`)
  if (day.journalCount > 0) parts.push(`${day.journalCount} journal entry`)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-foreground">{formatDayHeading(day.date)}</h2>
        {parts.length > 0 && <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>}
      </div>
      <div className="space-y-2">
        {day.entries.map((entry) => (
          <TimelineEntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
