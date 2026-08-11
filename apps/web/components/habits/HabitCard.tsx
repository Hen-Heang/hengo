"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Flame } from "lucide-react"

import { ReminderButton } from "@/components/reminders/ReminderButton"
import { itemVariants } from "@/lib/motion"
import { useHabitCheckins } from "@/hooks/useHabits"
import type { Habit } from "@/lib/types"
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from "./categoryMeta"
import { MilestoneBadge } from "./MilestoneBadge"

export function HabitCard({ habit }: { habit: Habit }) {
  const { currentStreak, milestone, loading } = useHabitCheckins(habit.id, habit.startedAt)
  const Icon = CATEGORY_ICONS[habit.category]

  return (
    <motion.div variants={itemVariants}>
      <div className="relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50 sm:p-5">
        {/* Stretched link — the ReminderButton below sits after it in the DOM
            so it stays clickable without being nested inside an <a>. */}
        <Link href={`/growth/habits/${habit.id}`} className="absolute inset-0" aria-label={habit.label} />

        <div
          className={`pointer-events-none flex size-11 shrink-0 items-center justify-center rounded-xl ${CATEGORY_COLORS[habit.category]}`}
        >
          <Icon size={20} strokeWidth={2} />
        </div>

        <div className="pointer-events-none min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{habit.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{CATEGORY_LABELS[habit.category]}</p>
        </div>

        {!loading && (
          <div className="pointer-events-none flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-1 text-sm font-bold text-foreground">
              <Flame size={14} strokeWidth={2} className="text-orange-500" />
              {currentStreak}
            </div>
            <MilestoneBadge phase={milestone} />
          </div>
        )}

        <div className="relative shrink-0">
          <ReminderButton entityType="habit" entityId={habit.id} deepLink="https://hengo.henheang.site/growth/habits" defaultTitle={`Check in: ${habit.label}`} />
        </div>
      </div>
    </motion.div>
  )
}
