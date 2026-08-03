"use client"

import { endOfWeek, format, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarView = "day" | "week" | "month"

interface CalendarViewSwitcherProps {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  selectedDate: Date
  onNavigate: (dir: "prev" | "next" | "today") => void
  views?: CalendarView[]
  showNav?: boolean
  className?: string
}

const rangeLabel = (view: CalendarView, date: Date): string => {
  if (view === "month") return format(date, "MMMM yyyy")
  if (view === "day") return format(date, "EEE, MMM d, yyyy")
  const start = startOfWeek(date, { weekStartsOn: 0 })
  const end = endOfWeek(date, { weekStartsOn: 0 })
  const sameMonth = start.getMonth() === end.getMonth()
  return sameMonth
    ? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
    : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
}

export function CalendarViewSwitcher({
  view,
  onViewChange,
  selectedDate,
  onNavigate,
  views = ["day", "week", "month"],
  showNav = true,
  className,
}: CalendarViewSwitcherProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2 px-2 py-2 sm:px-3", className)}>
      {showNav ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-lg px-2.5 text-xs font-medium"
            onClick={() => onNavigate("today")}
          >
            Today
          </Button>
          <div className="flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => onNavigate("prev")}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => onNavigate("next")}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span title={rangeLabel(view, selectedDate)} className="ml-1 truncate text-sm font-semibold text-foreground sm:text-base">
            {rangeLabel(view, selectedDate)}
          </span>
        </div>
      ) : (
        <span className="min-w-0 flex-1" />
      )}

      <div className="flex shrink-0 items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
        {views.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors sm:px-3",
              view === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export { rangeLabel }
