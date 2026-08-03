"use client"

import { motion } from "motion/react"
import { Flame, Layers3, Target } from "lucide-react"

import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { computeVocabStats } from "@/lib/vocab-review"
import type { VocabItem } from "@/lib/types"

type VocabStatsProps = {
  words: VocabItem[]
  dueCount: number
}

const BUCKETS = [
  { key: "weak", label: "Weak", bar: "bg-red-500", text: "text-red-500", dot: "bg-red-500" },
  { key: "learning", label: "Learning", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  { key: "mastered", label: "Mastered", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
] as const

export function VocabStats({ words, dueCount }: VocabStatsProps) {
  const stats = computeVocabStats(words)

  if (stats.total === 0) return null

  const tiles = [
    {
      label: "Due now",
      value: dueCount,
      helper: dueCount > 0 ? "Ready for review" : "You’re caught up",
      icon: Flame,
      accent: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "In progress",
      value: stats.weak + stats.learning,
      helper: "Still building recall",
      icon: Layers3,
      accent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Mastered",
      value: stats.mastered,
      helper: "At least 80% mastery",
      icon: Target,
      accent: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
  ]

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="app-kicker">Deck health</p>
            <h3 className="mt-1 text-base font-semibold text-foreground sm:text-lg">How your memory is developing</h3>
          </div>
          <p className="text-sm text-muted-foreground">Based on {stats.total} saved words</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.8fr)]">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-primary/[0.035] p-3.5 sm:gap-4 sm:p-4">
            <AnimatedCircularProgressBar
              value={stats.averageMastery}
              gaugePrimaryColor="var(--primary)"
              gaugeSecondaryColor="var(--muted)"
              label="Average vocabulary mastery"
              className="size-20 shrink-0 font-mono text-sm"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Average mastery</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Review weak words to move the whole collection forward.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {tiles.map(({ label, value, helper, icon: Icon, accent, iconBg }) => (
              <div key={label} className="min-w-0 rounded-2xl border border-border/60 bg-background/60 p-3 sm:p-4">
                <div className={cn("flex size-7 items-center justify-center rounded-lg sm:size-8", iconBg, accent)}>
                  <Icon size={15} strokeWidth={2.25} />
                </div>
                <p className={cn("mt-2.5 font-mono text-xl font-semibold tracking-tight sm:mt-3 sm:text-2xl", accent)}>
                  {value}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-tight text-foreground sm:text-xs">{label}</p>
                <p className="mt-0.5 hidden text-[11px] leading-4 text-muted-foreground sm:block">{helper}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${stats.weak} weak, ${stats.learning} learning, ${stats.mastered} mastered`}
          >
          {BUCKETS.map(({ key, bar }) => {
            const count = stats[key]
            if (count === 0) return null
            return (
              <motion.div
                key={key}
                initial={{ width: 0 }}
                animate={{ width: `${(count / stats.total) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full", bar)}
              />
            )
          })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {BUCKETS.map(({ key, label, text, dot }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", dot)} />
              <span className="text-xs font-bold text-muted-foreground">{label}</span>
              <span className={cn("text-xs font-bold tabular-nums", text)}>{stats[key]}</span>
            </div>
          ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
