"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { GrowthTabs } from "@/components/growth/GrowthTabs"
import { CreateHabitForm } from "@/components/recovery/CreateHabitForm"
import { RecoveryDashboard } from "@/components/recovery/RecoveryDashboard"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { useGoals } from "@/hooks/useGoals"
import { useHabits } from "@/hooks/useHabits"
import {
  useRecoveryDailyCheckIns,
  useRecoveryEvents,
  useRecoveryHabits,
  useRecoveryPrivacy,
  useRecoveryProtection,
} from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { userApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { buildRecoveryDashboardSummary } from "@/lib/recovery"

function RecoveryLoadingState() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  )
}

export default function RecoveryPage() {
  useSessionTimer("recovery")
  const userId = getUserId()
  const { habits: targets, activeHabit, loading: targetsLoading, error: targetsError, addHabit } = useRecoveryHabits()
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const target = targets.find((item) => item.id === selectedTargetId && item.active) ?? activeHabit
  const { events, loading: eventsLoading, error: eventsError } = useRecoveryEvents(target?.id ?? null)
  const { checkIns, loading: checkInsLoading, error: checkInsError } = useRecoveryDailyCheckIns(target?.id ?? null)
  const { items: protectionItems, loading: protectionLoading, error: protectionError } = useRecoveryProtection(target?.id ?? null)
  const { settings, loading: privacyLoading, error: privacyError } = useRecoveryPrivacy()
  const { sortedGoals } = useGoals()
  const { activeHabits } = useHabits()
  const { data: profile } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => userApi.getById(userId as string),
    enabled: userId != null,
  })
  const [showOnboarding, setShowOnboarding] = useState(false)

  const loading = targetsLoading || Boolean(target && (eventsLoading || checkInsLoading || protectionLoading || privacyLoading))
  if (loading) return <RecoveryLoadingState />

  const error = targetsError || eventsError || checkInsError || protectionError || privacyError
  const activeTargets = targets.filter((item) => item.active)
  if (activeTargets.length === 0 || showOnboarding || !target) {
    return (
      <div className="mx-auto max-w-5xl pb-14">
        <BackLink href="/home" label="Home" mobileOnly className="mb-2" />
        <GrowthTabs />
        {error && <div className="mx-auto mb-4 max-w-lg"><ErrorBanner>{error}</ErrorBanner></div>}
        <CreateHabitForm
          onCreate={async (input) => {
            const created = await addHabit(input)
            setShowOnboarding(false)
            return created
          }}
          onClose={activeTargets.length > 0 ? () => setShowOnboarding(false) : undefined}
        />
      </div>
    )
  }

  const summary = buildRecoveryDashboardSummary(target, events, checkIns)
  const activeGoals = sortedGoals
    .filter((goal) => goal.status !== "completed" && goal.status !== "archived")
    .map((goal) => ({ id: goal.id, label: goal.title }))

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/home" label="Home" mobileOnly className="mb-2" />
      <GrowthTabs />
      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}
      <RecoveryDashboard
        target={target}
        targets={activeTargets}
        summary={summary}
        checkIns={checkIns}
        protectionItems={protectionItems}
        displayName={profile?.displayName}
        recoveryLockEnabled={settings?.lockEnabled ?? false}
        goals={activeGoals}
        habits={activeHabits.map((habit) => ({ id: habit.id, label: habit.label }))}
        onAddTarget={() => setShowOnboarding(true)}
        onSelectTarget={setSelectedTargetId}
      />
    </div>
  )
}
