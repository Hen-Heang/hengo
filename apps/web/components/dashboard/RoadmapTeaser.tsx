"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, Map } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "roadmap_completed_topics"

const TOTAL_TOPICS = 105 // 14+14+14+15+15+15+15 across 7 phases

const PHASE_TOPIC_RANGES: Record<string, { start: number; count: number; title: string }> = {
  "phase-1": { start: 0, count: 14, title: "Java Foundations" },
  "phase-2": { start: 14, count: 14, title: "Java Advanced" },
  "phase-3": { start: 28, count: 14, title: "SQL & Database" },
  "phase-4": { start: 42, count: 15, title: "Spring Core & Boot" },
  "phase-5": { start: 57, count: 15, title: "Spring Data + Security" },
  "phase-6": { start: 72, count: 15, title: "Advanced Spring" },
  "phase-7": { start: 87, count: 15, title: "System Design" },
}

// Derive which phase is currently active (first incomplete, or last)
function getCurrentPhase(completed: Set<string>): { num: number; title: string; phasePct: number; overallPct: number } {
  let current = { num: 1, title: "Java Foundations", phasePct: 0 }

  const entries = Object.entries(PHASE_TOPIC_RANGES)
  for (let i = 0; i < entries.length; i++) {
    const [, info] = entries[i]
    // Count topics for this phase by checking IDs p{n}-t{n}
    const phaseNum = i + 1
    const ids = Array.from({ length: info.count }, (_, j) => `p${phaseNum}-t${j + 1}`)
    const done = ids.filter(id => completed.has(id)).length
    const pct = Math.round((done / info.count) * 100)

    if (done < info.count) {
      // This is the current phase (first incomplete)
      current = { num: phaseNum, title: info.title, phasePct: pct }
      break
    }
    // All topics done in this phase — continue to next
    current = { num: phaseNum, title: info.title, phasePct: 100 }
  }

  const totalDone = completed.size
  const overallPct = Math.min(100, Math.round((totalDone / TOTAL_TOPICS) * 100))

  return { ...current, overallPct }
}

export function RoadmapTeaser({ className }: { className?: string }) {
  const storedProgress = useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback)
      return () => window.removeEventListener("storage", callback)
    },
    () => window.localStorage.getItem(STORAGE_KEY) ?? "",
    () => ""
  )

  const data = useMemo(() => {
    try {
      const completed: Set<string> = storedProgress
        ? new Set(JSON.parse(storedProgress) as string[])
        : new Set()
      return getCurrentPhase(completed)
    } catch {
      return { num: 1, title: "Java Foundations", phasePct: 0, overallPct: 0 }
    }
  }, [storedProgress])

  return (
    <Link
      href="/roadmap"
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-violet-500/40 dark:bg-slate-900/40",
        className
      )}
    >
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
        <Map size={20} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold tabular-nums text-foreground">{data.overallPct}%</p>
          <p className="text-xs font-medium text-muted-foreground">complete</p>
        </div>
        <p className="text-xs font-medium text-muted-foreground/70">
          Phase {data.num} — {data.title}
        </p>

        {/* Phase progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-foreground/5">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${data.phasePct}%` }}
          />
        </div>
      </div>

      <ArrowRight
        size={16}
        className="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500"
      />
    </Link>
  )
}
