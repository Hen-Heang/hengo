"use client"

import { motion } from "motion/react"

import { ReminderRow } from "@/components/reminders/ReminderRow"
import { BackLink } from "@/components/ui/back-link"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { useReminders } from "@/hooks/useReminders"
import { containerVariants, itemVariants } from "@/lib/motion"

export default function RemindersSettingsPage() {
  const { reminders, loading, error } = useReminders({ status: "all" })

  const active = reminders.filter((r) => r.status === "active")
  const paused = reminders.filter((r) => r.status === "paused")
  const finished = reminders.filter((r) => r.status === "completed" || r.status === "cancelled")

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mx-auto max-w-2xl space-y-6 pb-16">
      <motion.div variants={itemVariants}>
        <BackLink href="/settings" label="Settings" />
        <h1 className="mt-2 text-xl font-bold text-foreground">Reminders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you&apos;ve set a reminder for — tasks, habits, notes, inbox items, journal, and activities. Set new
          ones from the bell icon on those items.
        </p>
      </motion.div>

      {loading ? (
        <motion.div variants={itemVariants} className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </motion.div>
      ) : error ? (
        <motion.div variants={itemVariants}>
          <ErrorBanner>{error}</ErrorBanner>
        </motion.div>
      ) : reminders.length === 0 ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">No reminders yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Look for the bell icon on a habit, note, inbox item, or the Journal page to set your first one.
          </p>
        </motion.div>
      ) : (
        <>
          {active.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active</h2>
              {active.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </motion.div>
          )}
          {paused.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paused</h2>
              {paused.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </motion.div>
          )}
          {finished.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed / cancelled</h2>
              {finished.map((r) => (
                <ReminderRow key={r.id} reminder={r} />
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
