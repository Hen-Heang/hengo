"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"

import { ReviewTabs } from "@/components/review/ReviewTabs"
import { WeeklyReviewView } from "@/components/review/WeeklyReviewView"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { habitsApi } from "@/lib/api"
import { useGoals } from "@/hooks/useGoals"
import { useHabits } from "@/hooks/useHabits"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { useTimeline } from "@/hooks/useTimeline"
import { getUserId } from "@/lib/auth-store"
import { formatRangeLabel, localRangeFor, toLocalDateString } from "@/lib/date-utils"
import { buildHabitWeeklyCompletion, buildWeeklyReviewSummary, localWeekDates } from "@/lib/review"
import { groupTimelineByDay } from "@/lib/timeline"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function WeeklyReviewPage() {
  useSessionTimer("review")
  const userId = getUserId()
  const now = new Date()
  const { start, end } = localRangeFor(now, "week")
  const from = toLocalDateString(start)
  const to = toLocalDateString(end)
  const rangeLabel = formatRangeLabel(now, "week")

  const { entries, loading: timelineLoading, error } = useTimeline({ from, to })
  const { allGoals, isLoading: goalsLoading } = useGoals()
  const { activeHabits, loading: habitsLoading } = useHabits()

  const { data: weekCheckins = [], isPending: checkinsLoading } = useQuery({
    queryKey: ["review", "habit-checkins-week", userId, from, to],
    queryFn: () => habitsApi.getCheckinsInRange({ from, to }),
    enabled: userId != null,
  })

  const loading = timelineLoading || goalsLoading || habitsLoading || checkinsLoading

  const daySummaries = groupTimelineByDay(entries)
  const habitCompletion = buildHabitWeeklyCompletion(
    activeHabits,
    weekCheckins,
    localWeekDates(start),
  )

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-2xl pb-16"
    >
      <motion.div variants={itemVariants} className="mb-2">
        <BackLink href="/home" label="Home" mobileOnly />
      </motion.div>
      <motion.div variants={itemVariants}>
        <ReviewTabs />
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorBanner>{error}</ErrorBanner>
      ) : (
        <WeeklyReviewView
          summary={buildWeeklyReviewSummary(daySummaries, allGoals, habitCompletion, rangeLabel)}
        />
      )}
    </motion.div>
  )
}
