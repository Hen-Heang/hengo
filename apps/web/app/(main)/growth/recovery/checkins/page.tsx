"use client"

import { motion } from "motion/react"

import { CheckInsList } from "@/components/recovery/CheckInsList"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { containerVariants, itemVariants } from "@/lib/motion"
import { useRecoveryEvents, useRecoveryHabitFromParams } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function CheckInsLoadingState() {
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  )
}

export default function RecoveryCheckInsPage() {
  useSessionTimer("recovery")
  const { habit, backHref, loading: habitsLoading, error: habitsError } = useRecoveryHabitFromParams()
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    updateEvent,
    deleteEvent,
  } = useRecoveryEvents(habit?.id ?? null)

  if (habitsLoading || (habit && eventsLoading)) {
    return <CheckInsLoadingState />
  }

  const error = habitsError || eventsError
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
      <motion.p variants={itemVariants} className="mb-4 text-sm font-semibold text-muted-foreground">
        {events.length} check-in{events.length === 1 ? "" : "s"}
      </motion.p>
      <CheckInsList
        events={events}
        onUpdateNote={(id, note) => updateEvent(id, { note })}
        onDelete={deleteEvent}
      />
    </motion.div>
  )
}
