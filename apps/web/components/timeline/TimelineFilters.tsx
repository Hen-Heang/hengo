"use client"

import { ChevronLeft, ChevronRight, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DateRangeGranularity } from "@/lib/date-utils"
import { TIMELINE_KIND_META, type TimelineKind } from "@/lib/timeline"
import { cn } from "@/lib/utils"

const GRANULARITIES: { value: DateRangeGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

export function TimelineFilters({
  granularity,
  onGranularityChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  kind,
  onKindChange,
  query,
  onQueryChange,
}: {
  granularity: DateRangeGranularity
  onGranularityChange: (g: DateRangeGranularity) => void
  rangeLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  kind: TimelineKind | "all"
  onKindChange: (kind: TimelineKind | "all") => void
  query: string
  onQueryChange: (query: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1" role="group" aria-label="Timeline range">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onGranularityChange(g.value)}
              aria-pressed={granularity === g.value}
              className={cn(
                "min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                granularity === g.value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon-sm" onClick={onPrev} aria-label="Previous period">
            <ChevronLeft size={16} />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday} className="min-w-32 justify-center">
            {rangeLabel}
          </Button>
          <Button type="button" variant="outline" size="icon-sm" onClick={onNext} aria-label="Next period">
            <ChevronRight size={16} />
          </Button>
        </div>

        <Select value={kind} onValueChange={(v) => onKindChange(v as TimelineKind | "all")}>
          <SelectTrigger className="w-44" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(TIMELINE_KIND_META) as TimelineKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {TIMELINE_KIND_META[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search this period…"
          className="pl-9"
        />
      </div>
    </div>
  )
}
