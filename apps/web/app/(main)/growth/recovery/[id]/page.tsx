"use client"

import { useParams, useRouter } from "next/navigation"

import { RecoveryOverview } from "@/components/recovery/RecoveryOverview"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { daysSince } from "@/lib/recovery"
import { useRecoveryEvents, useRecoveryHabits, useRecoveryPlans, useRecoveryTriggers } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function OverviewLoadingState() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-12 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export default function RecoveryHabitPage() {
  useSessionTimer("recovery")
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const {
    habits,
    loading: habitsLoading,
    error: habitsError,
    updateHabit,
    deleteHabit,
  } = useRecoveryHabits()
  const habit = habits.find((h) => h.id === id) ?? null
  const {
    events,
    daysSinceLastEvent,
    lastEventAt,
    rodeOutCount,
    lastSlipAt,
    loading: eventsLoading,
    error: eventsError,
  } = useRecoveryEvents(habit?.id ?? null)
  // Counts for the section cards — loaded alongside; the tickers simply
  // settle once the data arrives, so these don't gate the loading state.
  const { plans, duePlans } = useRecoveryPlans(habit?.id ?? null)
  const { triggers } = useRecoveryTriggers()

  if (habitsLoading || (habit && eventsLoading)) {
    return <OverviewLoadingState />
  }

  const error = habitsError || eventsError
  if (error || !habit) {
    return (
      <div className="mx-auto max-w-xl pt-10">
        <ErrorBanner>{error || "This habit doesn't exist (it may have been deleted)."}</ErrorBanner>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <div className="mx-auto mb-2 max-w-xl">
        <BackLink href="/growth/recovery" label="Recovery" />
      </div>
      <RecoveryOverview
        habit={habit}
        daysSinceLastEvent={daysSinceLastEvent}
        lastEventAt={lastEventAt}
        rodeOutCount={rodeOutCount}
        streakDays={daysSince(habit.startedAt, lastSlipAt)}
        checkinsCount={events.length}
        plansCount={plans.length}
        duePlansCount={duePlans.length}
        triggersCount={triggers.length}
        onUpdateHabit={(data) => updateHabit(habit.id, data)}
        onDeleteHabit={async () => {
          await deleteHabit(habit.id)
          router.push("/growth/recovery")
        }}
      />
    </div>
  )
}
