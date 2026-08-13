"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, CheckCircle2, Circle, ClipboardList } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useTodaysTasks } from "@/hooks/useTodaysTasks"
import { cn } from "@/lib/utils"

const VISIBLE_LIMIT = 3

/**
 * Compact "Today's tasks" widget for the Today page — shares useTodaysTasks'
 * query cache with the full Tasks tab (/goals/tasks) and Goals Overview's
 * GoalTasksSnapshot, so mounting this here never triggers an extra fetch.
 * Overdue tasks surface first; anything past the 3-item cap is reachable via
 * "View all" rather than rendered here.
 */
export function TodayTasksCard() {
  const router = useRouter()
  const { groups, totalCount, loading, error, handleToggleTaskCompletion } = useTodaysTasks()

  const pending = [...groups.overdue, ...groups.scheduled, ...groups.anytime]
  const visible = pending.slice(0, VISIBLE_LIMIT)
  const remaining = Math.max(0, pending.length - VISIBLE_LIMIT)
  const allDone = totalCount > 0 && pending.length === 0

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm dark:bg-slate-900/40 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList size={14} strokeWidth={2.5} />
          Today&apos;s tasks
        </h3>
        <Link
          href="/goals/tasks"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm text-destructive">
          <AlertTriangle size={16} className="shrink-0" />
          Couldn&apos;t load today&apos;s tasks.
        </div>
      ) : totalCount === 0 ? (
        <p className="mt-3 rounded-lg border border-border bg-accent/5 px-3 py-3 text-sm text-muted-foreground">
          No tasks for today.
        </p>
      ) : allDone ? (
        <motion.p
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 size={16} className="shrink-0" />
          All tasks done for today.
        </motion.p>
      ) : (
        <div className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {visible.map((task) => {
              const overdue = groups.isOverdue(task)
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(task.goal_id ? `/goals/${task.goal_id}?task=${task.id}` : "/goals/calendar")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      router.push(task.goal_id ? `/goals/${task.goal_id}?task=${task.id}` : "/goals/calendar")
                  }}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                    overdue
                      ? "border-red-500/20 bg-red-500/3 hover:bg-red-500/5"
                      : "border-border bg-background/40 hover:bg-accent/40"
                  )}
                >
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleToggleTaskCompletion(task.id, task.completed)
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-primary"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {task.completed ? (
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
                          <Circle className="h-5 w-5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {task.title || task.description}
                  </span>
                  {overdue && (
                    <span className="shrink-0 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                      Overdue
                    </span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {remaining > 0 && (
            <p className="px-1 text-xs font-medium text-muted-foreground">
              +{remaining} more task{remaining === 1 ? "" : "s"} today
            </p>
          )}
        </div>
      )}
    </div>
  )
}
