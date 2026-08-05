"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Flame, Sparkles, Target, TreeDeciduous, Trophy } from "lucide-react"
import { motion } from "motion/react"

import { FirstRunBanner } from "@/components/dashboard/FirstRunBanner"
import { WorkspacePosterCard } from "@/components/home/WorkspacePosterCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { achievementsApi } from "@/lib/api"
import { useGoals } from "@/hooks/useGoals"
import { useHabits } from "@/hooks/useHabits"
import { useProgress } from "@/hooks/useProgress"
import { useRecoveryEvents, useRecoveryHabits } from "@/hooks/useRecovery"
import { getUserId } from "@/lib/auth-store"
import { calculateGoalDeadlineInfo } from "@/lib/goals"
import { daysSince } from "@/lib/recovery"
import { containerVariants, itemVariants } from "@/lib/motion"
import { getLastVisited } from "@/lib/last-visited"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function HomeLoadingState() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] sm:space-y-8 sm:px-6 sm:pt-6 lg:px-8">
      <Skeleton className="h-20 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-60 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const { loading, stats } = useProgress()
  const { sortedGoals, isLoading: goalsLoading } = useGoals()
  const { activeHabits, loading: habitsLoading } = useHabits()
  const { activeHabit: recoveryHabit, loading: recoveryHabitsLoading } = useRecoveryHabits()
  const { lastSlipAt, loading: recoveryEventsLoading } = useRecoveryEvents(recoveryHabit?.id ?? null)
  const userId = getUserId()
  const { data: achievementsSummary, isPending: achievementsLoading } = useQuery({
    queryKey: ["achievements-summary", userId],
    queryFn: () => achievementsApi.getSummary(),
    enabled: userId != null,
  })

  if (
    loading ||
    goalsLoading ||
    achievementsLoading ||
    habitsLoading ||
    recoveryHabitsLoading ||
    (recoveryHabit && recoveryEventsLoading)
  ) {
    return <HomeLoadingState />
  }

  const activeGoals = sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived")
  const overdueGoals = activeGoals.filter((g) => calculateGoalDeadlineInfo(g).status === "overdue")
  const completedGoals = sortedGoals.filter((g) => g.status === "completed")
  const level = achievementsSummary?.level
  const unlockedCount = achievementsSummary?.unlockedCount ?? 0
  const totalCount = achievementsSummary?.totalCount ?? 0
  const recoveryStreakDays = recoveryHabit ? daysSince(recoveryHabit.startedAt, lastSlipAt) : null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-6xl space-y-6 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] sm:space-y-8 sm:px-6 sm:pt-6 lg:px-8"
    >
      {/* ── Hero strip ── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="max-w-2xl">
          <p className="app-kicker">Your daily workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">
            {getGreeting()} 👋
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Choose what needs your attention today, or ask your AI coach for a quick start.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3.5 shadow-xs">
            <Flame size={15} className="text-orange-500" />
            <span className="text-sm font-semibold text-foreground">{stats.streakDays} day streak</span>
          </div>
          <Button asChild className="h-10 flex-1 sm:flex-none">
            <Link href="/chat">
              <Sparkles data-icon="inline-start" className="size-4" aria-hidden="true" />
              Ask AI Coach
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* First-run onboarding — shown once to users with no activity yet */}
      {stats.wordsSaved === 0 && stats.streakDays === 0 && (
        <motion.div variants={itemVariants}>
          <FirstRunBanner />
        </motion.div>
      )}

      {/* ── Big entry points ── */}
      {/* Goals and Growth lead, Progress follows, Learn sits last and carries
          no stat tiles — Hengo's identity is the daily/goals/growth workspace,
          with Korean learning as one workspace among others, not the headline.
          Its streak/due/vocab counts still live on /learn and the Korean
          pages themselves; this card is just a generic door into that hub. */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        <WorkspacePosterCard
          href={getLastVisited("goals", "/goals")}
          eyebrow="Productivity"
          title="Goal Setting"
          description="Plan goals, break them into tasks, and track deadlines — see what needs you today."
          icon={Target}
          accentColor="emerald"
          stats={[
            { label: "Active goals", value: String(activeGoals.length) },
            {
              label: overdueGoals.length > 0 ? "Overdue" : "Completed",
              value: overdueGoals.length > 0 ? String(overdueGoals.length) : String(completedGoals.length),
            },
          ]}
          cta="Continue planning"
        />
        <WorkspacePosterCard
          href="/growth/habits"
          eyebrow="Growth"
          title="Habits & Recovery"
          description="Build identity-based habits and track recovery, one calm check-in at a time."
          icon={TreeDeciduous}
          accentColor="violet"
          stats={[
            { label: "Active habits", value: String(activeHabits.length) },
            ...(recoveryStreakDays !== null ? [{ label: "Recovery streak", value: `${recoveryStreakDays}d` }] : []),
          ]}
          cta="Open Growth"
        />
        <WorkspacePosterCard
          href={getLastVisited("review", "/achievements")}
          eyebrow="Progress"
          title="Your Progress"
          description="Level, XP, and badges earned across every module — see how far you've come."
          icon={Trophy}
          accentColor="amber"
          stats={[
            { label: "Level", value: level ? String(level.level) : "1" },
            { label: "XP", value: level ? String(level.totalXp) : "0" },
            { label: "Badges", value: `${unlockedCount}/${totalCount}` },
          ]}
          cta="View achievements"
        />
        <WorkspacePosterCard
          href="/learn"
          eyebrow="Learning"
          title="Learn"
          description="Access your learning tools and continue when you are ready."
          icon={Sparkles}
          accentColor="blue"
          stats={[]}
          cta="Open Learn"
        />
      </motion.div>
    </motion.div>
  )
}
