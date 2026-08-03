"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, ClipboardList, Plus, Target } from "lucide-react"

import { Button as UIButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { useGoals } from "@/hooks/useGoals"
import { calculateGoalDeadlineInfo, type Goal } from "@/lib/goals"
import { cn } from "@/lib/utils"

const progressGradient = (progress: number) =>
  progress >= 75
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress >= 40
      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
      : "linear-gradient(90deg, #f59e0b, #ef4444)"

const taskProgress = (goal: Goal) =>
  goal.taskCounts && goal.taskCounts.total > 0
    ? Math.round((goal.taskCounts.completed / goal.taskCounts.total) * 100)
    : 0

// Compact, dashboard-sized view of the user's active goals. Reuses the shared
// useGoals query (cache-shared with /goals), shows the top few by sort order.
export function GoalsOverview({ className, limit = 3 }: { className?: string; limit?: number }) {
  const { sortedGoals, isLoading } = useGoals()

  const activeGoals = useMemo(
    () => sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived"),
    [sortedGoals]
  )
  const visible = activeGoals.slice(0, limit)

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40 lg:p-8",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Target size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Your goals</h3>
            <p className="text-xs font-medium text-muted-foreground">
              {activeGoals.length} active
            </p>
          </div>
        </div>
        <UIButton asChild variant="ghost" size="sm" className="rounded-xl font-medium text-muted-foreground">
          <Link href="/goals">View all</Link>
        </UIButton>
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Target size={28} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold tracking-tight">No active goals</h3>
            <p className="mb-6 mt-1 max-w-[200px] text-xs font-medium text-muted-foreground">
              Set a goal and track your progress in one place.
            </p>
            <UIButton asChild size="sm" className="rounded-xl font-medium">
              <Link href="/goals/create">Create a goal</Link>
            </UIButton>
          </div>
        ) : (
          visible.map((goal) => {
            const deadlineInfo = calculateGoalDeadlineInfo(goal)
            const progress = taskProgress(goal)
            const icon = goal.metadata?.icon
            return (
              <Link
                key={goal.id}
                href={`/goals/${goal.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-background/40 p-4 transition-all hover:bg-accent/50 lg:p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">
                  {icon || (goal.title ? goal.title.charAt(0).toUpperCase() : "G")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                      {goal.title}
                    </p>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-primary"
                      style={{ background: progressGradient(progress) }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <ClipboardList className="h-3 w-3" />
                      {goal.taskCounts?.completed}/{goal.taskCounts?.total}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default GoalsOverview
