"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, CheckCircle2, Circle, Flame, TreeDeciduous } from "lucide-react"

import { CATEGORY_ICONS } from "@/components/habits/categoryMeta"
import { Skeleton } from "@/components/ui/skeleton"
import { toCheckinDate, useHabitCheckins, useHabits } from "@/hooks/useHabits"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"

const VISIBLE_LIMIT = 4

function HabitCheckinRow({ habit }: { habit: Habit }) {
  const { checkins, currentStreak, loading, toggleCheckin } = useHabitCheckins(habit.id, habit.startedAt)
  const today = toCheckinDate()
  const doneToday = checkins.some((c) => c.date === today && c.completed)
  const Icon = CATEGORY_ICONS[habit.category]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
        doneToday ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-background/40"
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
        <Icon size={16} strokeWidth={2} />
      </div>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{habit.label}</span>
      {!loading && currentStreak > 0 && (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Flame size={12} className="text-orange-500" />
          {currentStreak}
        </span>
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.85 }}
        aria-label={doneToday ? `Undo today's check-in for ${habit.label}` : `Check in ${habit.label} for today`}
        onClick={() => void toggleCheckin(today)}
        disabled={loading}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
      >
        <AnimatePresence mode="wait" initial={false}>
          {doneToday ? (
            <motion.span
              key="done"
              initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </motion.span>
          ) : (
            <motion.span
              key="todo"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Circle className="h-5 w-5 text-muted-foreground/60" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

/**
 * Compact "Today's habit check-ins" widget — one toggle per active habit
 * (mirrors HabitCard's per-item useHabitCheckins usage, just condensed to a
 * single row). Capped so a long habit list stays scannable; the rest live in
 * Growth.
 */
export function TodayHabitCheckins() {
  const { activeHabits, loading, error } = useHabits()
  const visible = activeHabits.slice(0, VISIBLE_LIMIT)
  const remaining = Math.max(0, activeHabits.length - VISIBLE_LIMIT)

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm dark:bg-slate-900/40 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TreeDeciduous size={14} strokeWidth={2.5} />
          Today&apos;s habits
        </h3>
        <Link
          href="/growth/habits"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          Couldn&apos;t load your habits.
        </div>
      ) : activeHabits.length === 0 ? (
        <div className="mt-3 rounded-lg border border-border bg-accent/5 px-3 py-3 text-sm text-muted-foreground">
          No active habits yet.{" "}
          <Link href="/growth/habits" className="font-medium text-primary hover:underline">
            Add one
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((habit) => (
            <HabitCheckinRow key={habit.id} habit={habit} />
          ))}
          {remaining > 0 && (
            <p className="px-1 text-xs font-medium text-muted-foreground">
              +{remaining} more habit{remaining === 1 ? "" : "s"} in Growth
            </p>
          )}
        </div>
      )}
    </div>
  )
}
