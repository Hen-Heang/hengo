"use client"

import { motion } from "motion/react"

import { TriggersManager } from "@/components/recovery/TriggersManager"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { containerVariants, itemVariants } from "@/lib/motion"
import { useRecoveryTriggers } from "@/hooks/useRecovery"
import { useSessionTimer } from "@/hooks/useSessionTimer"

export default function RecoveryTriggersPage() {
  useSessionTimer("recovery")
  const { triggers, loading, error, addTrigger, updateTrigger, deleteTrigger } = useRecoveryTriggers()

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-xl pb-12">
      {/* Triggers are global (not per-habit), so back goes to the list. */}
      <motion.div variants={itemVariants} className="mb-2">
        <BackLink href="/growth/recovery" label="Recovery" />
      </motion.div>
      {error && (
        <motion.div variants={itemVariants} className="mb-4">
          <ErrorBanner>{error}</ErrorBanner>
        </motion.div>
      )}
      <TriggersManager triggers={triggers} onAdd={addTrigger} onUpdate={updateTrigger} onDelete={deleteTrigger} />
    </motion.div>
  )
}
