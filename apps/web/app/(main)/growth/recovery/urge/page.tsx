"use client"

import { useGoals } from "@/hooks/useGoals"
import {
  useRecoveryEvents,
  useRecoveryHabits,
  useRecoveryProtection,
  useRecoveryTriggers,
} from "@/hooks/useRecovery"
import { UrgeRescueFlow } from "@/components/recovery/UrgeRescueFlow"
import { ErrorBanner } from "@/components/ui/error-banner"

export default function RecoveryUrgePage() {
  const { activeHabit: target, loading: targetsLoading, error: targetsError } = useRecoveryHabits()
  const { triggers, loading: triggersLoading, error: triggersError } = useRecoveryTriggers()
  const { items, loading: protectionLoading, error: protectionError } = useRecoveryProtection(target?.id ?? null)
  const { logEvent, error: eventsError } = useRecoveryEvents(target?.id ?? null)
  const { sortedGoals } = useGoals()

  if (targetsLoading || triggersLoading || protectionLoading) return <div className="fixed inset-0 z-[70] bg-slate-950" />
  const error = targetsError || triggersError || protectionError || eventsError
  if (error || !target) {
    return <div className="mx-auto max-w-lg pt-10"><ErrorBanner>{error || "Create a private recovery plan first."}</ErrorBanner></div>
  }

  return (
    <UrgeRescueFlow
      target={target}
      triggers={triggers}
      protectionItems={items}
      goals={sortedGoals.filter((goal) => goal.status !== "completed" && goal.status !== "archived").map((goal) => goal.title)}
      onSave={logEvent}
    />
  )
}
