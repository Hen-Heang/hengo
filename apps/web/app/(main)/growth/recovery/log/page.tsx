"use client"

import { useRouter } from "next/navigation"

import { LogFlow } from "@/components/recovery/LogFlow"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecoveryEvents, useRecoveryHabitFromParams, useRecoveryTriggers } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

export default function RecoveryLogPage() {
  useSessionTimer("recovery")
  const router = useRouter()
  const { habit, backHref, loading: habitsLoading, error: habitsError } = useRecoveryHabitFromParams()
  const { logEvent, error: eventsError } = useRecoveryEvents(habit?.id ?? null)
  const { triggers, loading: triggersLoading, error: triggersError } = useRecoveryTriggers()

  if (habitsLoading || triggersLoading) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-end gap-4 px-4 pb-10">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    )
  }

  const error = habitsError || eventsError || triggersError
  if (error || !habit) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <ErrorBanner>{error || "Start a habit on the Recovery overview first."}</ErrorBanner>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-2">
        <BackLink href={backHref} label={habit.label} />
      </div>
      <LogFlow
        triggers={triggers}
        onSubmit={async (input) => {
          const event = await logEvent(input)
          // Slips get a calm debrief instead of a "nice job" screen; anything
          // else is offered a Pause.
          if (input.kind === "slip") {
            sessionStorage.setItem("hengo-recovery-debrief", JSON.stringify({ eventId: event.id, habitId: habit.id }))
            router.push("/growth/recovery/debrief")
          } else {
            router.push("/growth/recovery/urge")
          }
        }}
      />
    </div>
  )
}
