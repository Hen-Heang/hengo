"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CalendarClock } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { useGoals } from "@/hooks/useGoals"
import { calculateGoalDeadlineInfo } from "@/lib/goals"

// Cross-goal deadline list for the Productivity dashboard — the Goals page
// only surfaces a single "N overdue" banner, not a ranked list, so this
// composes sortedGoals + calculateGoalDeadlineInfo into one.
export function UpcomingDeadlines({ limit = 5 }: { limit?: number }) {
  const { sortedGoals, isLoading } = useGoals()

  const upcoming = useMemo(
    () =>
      sortedGoals
        .filter((g) => g.status !== "completed" && g.status !== "archived" && g.target_date)
        .map((goal) => ({ goal, info: calculateGoalDeadlineInfo(goal) }))
        .filter(({ info }) => info.status !== "completed")
        .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining)
        .slice(0, limit),
    [sortedGoals, limit]
  )

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
        <CalendarClock size={14} strokeWidth={2.5} />
        Upcoming Deadlines
      </h3>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-border bg-accent/5 px-4 py-4 text-sm font-medium text-muted-foreground">
          No goals with a deadline coming up.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {upcoming.map(({ goal, info }) => (
            <Link
              key={goal.id}
              href={`/goals/${goal.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <span className="min-w-0 truncate text-sm font-bold text-foreground">{goal.title}</span>
              <DeadlineStatusBadge deadlineInfo={info} size="sm" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
