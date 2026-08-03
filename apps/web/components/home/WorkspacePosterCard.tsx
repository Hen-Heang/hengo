import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ACCENTS = {
  blue: {
    glow: "bg-blue-500/10",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "hover:border-blue-500/40",
    eyebrow: "text-blue-600 dark:text-blue-400",
    cta: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    glow: "bg-emerald-500/10",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "hover:border-emerald-500/40",
    eyebrow: "text-emerald-600 dark:text-emerald-400",
    cta: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    glow: "bg-amber-500/10",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "hover:border-amber-500/40",
    eyebrow: "text-amber-600 dark:text-amber-400",
    cta: "text-amber-600 dark:text-amber-400",
  },
  violet: {
    glow: "bg-violet-500/10",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    border: "hover:border-violet-500/40",
    eyebrow: "text-violet-600 dark:text-violet-400",
    cta: "text-violet-600 dark:text-violet-400",
  },
} as const

export interface WorkspacePosterStat {
  label: string
  value: string
}

// One of the big "pick a lane" entry points on Home — Korean Learning, Goal
// Setting, Progress, and Growth. The whole card deep-links via getLastVisited so it
// carries forward the same "continue where you left off" behavior the old
// ContinueCards had, just with a real-data summary instead of a bare label.
export function WorkspacePosterCard({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
  accentColor,
  stats,
  cta,
}: {
  href: string
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  accentColor: keyof typeof ACCENTS
  stats: WorkspacePosterStat[]
  cta: string
}) {
  const accent = ACCENTS[accentColor]

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full min-h-72 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-sm shadow-slate-950/5 ring-1 ring-white/50 outline-none transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-950/8 focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-900/70 dark:ring-white/5 sm:p-6",
        accent.border
      )}
    >
      <div className={cn("pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[100px]", accent.glow)} />

      <div className="relative z-10 flex flex-1 flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accent.iconBg)}>
            <Icon size={22} strokeWidth={2} />
          </div>
          <p className={cn("text-xs font-semibold uppercase tracking-wide", accent.eyebrow)}>{eyebrow}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-background/55 px-3.5 py-2.5 dark:bg-white/5"
            >
              <p className="font-mono text-lg font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center gap-1.5 text-sm font-semibold", accent.cta)}>
          {cta}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
