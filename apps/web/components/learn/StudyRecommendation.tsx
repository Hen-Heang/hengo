import Link from "next/link"
import { ArrowRight, PartyPopper } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  missionItemCtaLabel,
  missionItemHref,
  missionItemLabel,
} from "@/lib/learning/mission-item-display"
import type { DailyMission } from "@/lib/api"

// "Recommended next" — the same deterministic daily mission /home and
// /practice already read (kori_daily_missions), not a second priority
// calculation invented for Study. Its first item is already the mission
// engine's highest-weighted pick (lib/learning/mission-engine.ts).
export function StudyRecommendation({
  mission,
  loading,
}: {
  mission: DailyMission | null
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-40 w-full rounded-3xl" />
  if (!mission) return null

  const next = mission.items.find((item) => item.status !== "completed")

  if (!next) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <PartyPopper size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Today&apos;s practice is done</p>
          <p className="text-xs text-muted-foreground">Come back tomorrow for a new plan.</p>
        </div>
      </div>
    )
  }

  // Scenario needs a real conversation + session created first (see
  // app/(main)/practice/page.tsx's startScenario) — Study hands off to the
  // focused practice session instead of duplicating that flow here.
  const href = next.type === "scenario" ? "/practice" : (missionItemHref(next) ?? "/practice")

  return (
    <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] via-card to-card p-5 shadow-sm dark:from-blue-500/[0.09] dark:via-slate-900/60 dark:to-slate-900/60 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
        Recommended next
      </p>
      <p className="mt-3 text-lg font-bold leading-snug text-foreground">{next.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {missionItemLabel(next.type)} · {next.estimatedMinutes} min
      </p>
      <Link
        href={href}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-500 active:scale-[0.985] dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto sm:px-6"
      >
        {missionItemCtaLabel(next.type)}
        <ArrowRight size={16} strokeWidth={2.2} />
      </Link>
    </div>
  )
}
