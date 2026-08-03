"use client"

import { motion } from "motion/react"

import { EveningReviewView } from "@/components/review/EveningReviewView"
import { ReviewTabs } from "@/components/review/ReviewTabs"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { useTimeline } from "@/hooks/useTimeline"
import { toLocalDateString } from "@/lib/date-utils"
import { buildEveningReviewSummary } from "@/lib/review"
import { groupTimelineByDay } from "@/lib/timeline"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function EveningReviewPage() {
  useSessionTimer("review")
  const today = toLocalDateString(new Date())
  const { entries, loading, error } = useTimeline({ from: today, to: today })

  const todaySummary = groupTimelineByDay(entries)[0]
  const hasJournalToday = entries.some((e) => e.kind === "journal")

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-2xl pb-16">
      <motion.div variants={itemVariants} className="mb-2">
        <BackLink href="/home" label="Home" mobileOnly />
      </motion.div>
      <motion.div variants={itemVariants}>
        <ReviewTabs />
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorBanner>{error}</ErrorBanner>
      ) : (
        <EveningReviewView
          summary={buildEveningReviewSummary(todaySummary, hasJournalToday)}
          entries={todaySummary?.entries ?? []}
        />
      )}
    </motion.div>
  )
}
