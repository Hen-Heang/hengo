"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"

import { MorningBriefView } from "@/components/review/MorningBriefView"
import { ReviewTabs } from "@/components/review/ReviewTabs"
import { BackLink } from "@/components/ui/back-link"
import { Skeleton } from "@/components/ui/skeleton"
import { habitsApi } from "@/lib/api"
import { useGoals } from "@/hooks/useGoals"
import { useHabits } from "@/hooks/useHabits"
import { useProgress } from "@/hooks/useProgress"
import { useReminders } from "@/hooks/useReminders"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { useTodaysTasks } from "@/hooks/useTodaysTasks"
import { getUserId } from "@/lib/auth-store"
import { toLocalDateString } from "@/lib/date-utils"
import { buildMorningBrief } from "@/lib/review"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function MorningBriefPage() {
  useSessionTimer("review")
  const userId = getUserId()
  const today = toLocalDateString(new Date())

  const { stats, loading: progressLoading } = useProgress()
  const { allGoals, isLoading: goalsLoading } = useGoals()
  const { activeHabits, loading: habitsLoading } = useHabits()
  const { reminders, loading: remindersLoading } = useReminders({ status: "active" })
  const { groups, completedCount, totalCount, loading: tasksLoading } = useTodaysTasks()

  const { data: todaysCheckins = [], isPending: checkinsLoading } = useQuery({
    queryKey: ["review", "habit-checkins-today", userId, today],
    queryFn: () => habitsApi.getCheckinsInRange({ from: today, to: today }),
    enabled: userId != null,
  })

  const loading =
    progressLoading ||
    goalsLoading ||
    habitsLoading ||
    remindersLoading ||
    tasksLoading ||
    checkinsLoading

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
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <MorningBriefView
          brief={buildMorningBrief({
            streakDays: stats.streakDays,
            taskCounts: {
              overdueCount: groups.overdue.length,
              scheduledCount: groups.scheduled.length,
              anytimeCount: groups.anytime.length,
              completedCount,
              totalCount,
            },
            activeHabits,
            todaysCheckins,
            reminders,
            goals: allGoals,
          })}
        />
      )}
    </motion.div>
  )
}
