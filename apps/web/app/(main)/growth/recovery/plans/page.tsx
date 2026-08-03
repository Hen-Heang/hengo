"use client"

import { motion } from "motion/react"

import { PlansList } from "@/components/recovery/PlansList"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { containerVariants, itemVariants } from "@/lib/motion"
import { useRecoveryHabitFromParams, useRecoveryPlans } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function PlansLoadingState() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}

export default function RecoveryPlansPage() {
  useSessionTimer("recovery")
  const { habit, backHref, loading: habitsLoading, error: habitsError } = useRecoveryHabitFromParams()
  const {
    plans,
    duePlans,
    loading: plansLoading,
    error: plansError,
    reviewPlan,
    updatePlan,
    deletePlan,
  } = useRecoveryPlans(habit?.id ?? null)

  if (habitsLoading || (habit && plansLoading)) {
    return <PlansLoadingState />
  }

  const error = habitsError || plansError
  if (error || !habit) {
    return (
      <div className="mx-auto max-w-xl pt-10">
        <ErrorBanner>{error || "Start a habit on the Recovery overview first."}</ErrorBanner>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-xl pb-12">
      <motion.div variants={itemVariants} className="mb-2">
        <BackLink href={backHref} label={habit.label} />
      </motion.div>
      <PlansList plans={plans} duePlans={duePlans} onReview={reviewPlan} onUpdate={updatePlan} onDelete={deletePlan} />
    </motion.div>
  )
}
