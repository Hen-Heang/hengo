"use client"

import { useEffect, useState } from "react"
import { Flame } from "lucide-react"
import { motion } from "motion/react"
import dynamic from "next/dynamic"

import { PageHero } from "@/components/app/page-hero"
import { FeatureBreakdown } from "@/components/progress/FeatureBreakdown"
import { PhrasebookStatsCard } from "@/components/phrasebook/PhrasebookStatsCard"
import { Skeleton } from "@/components/ui/skeleton"
import { achievementsApi } from "@/lib/api"
import { useProgress } from "@/hooks/useProgress"
import { containerVariants, itemVariants } from "@/lib/motion"
import type { AchievementSummary } from "@/lib/types"

// recharts is heavy; defer it so the shell + above-the-fold cards paint
// first, then the weekly graph streams in — same pattern as /home, /dashboard.
const ProgressChart = dynamic(
  () => import("@/components/dashboard/ProgressChart").then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-muted/20" />,
  }
)

export default function StatisticsPage() {
  const { chartData, error, loading, stats } = useProgress()
  const [summary, setSummary] = useState<AchievementSummary | null>(null)

  useEffect(() => {
    let active = true
    achievementsApi
      .getSummary()
      .then((s) => active && setSummary(s))
      .catch(() => active && setSummary(null))
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Progress"
          title="Statistics"
          description="Your practice time, streak, and XP across every Learning and Productivity feature — one analytics view for the whole platform."
          stats={[
            { label: "Streak", value: `${stats.streakDays} days`, href: "/history" },
            { label: "This week", value: `${stats.weeklyMinutes}m`, href: "/dashboard" },
            summary
              ? { label: "Level", value: `${summary.level.level} · ${summary.level.totalXp} XP`, href: "/achievements" }
              : { label: "Level", value: "—", href: "/achievements" },
          ]}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            Weekly practice time
          </h2>
          <div className="mt-4">
            <ProgressChart data={chartData} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
            Activity by feature (30d)
          </h2>
          <div className="mt-4">
            <FeatureBreakdown />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Phrasebook</h2>
        <div className="mt-4">
          <PhrasebookStatsCard />
        </div>
      </motion.div>

      {stats.streakDays > 0 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-3.5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Flame size={18} strokeWidth={2.5} />
          </div>
          <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
            {stats.streakDays}-day streak — {stats.wordsSaved} words saved along the way.
          </p>
        </motion.div>
      )}

      {error ? (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-center text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}
    </motion.div>
  )
}
