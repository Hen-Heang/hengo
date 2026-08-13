"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, ClipboardList } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useTodaysTasks } from "@/hooks/useTodaysTasks"
import { cn } from "@/lib/utils"

const LIMIT = 5

/**
 * Read-only-ish snapshot of today's goal-linked tasks for the Goals Overview
 * tab — shares useTodaysTasks' query cache with the Tasks tab (same query
 * key), so this never triggers an extra fetch. It's deliberately a filtered
 * slice (goal_id set, capped, no composer/filter/mark-all chrome), not a
 * second copy of the full Today's Tasks experience — that stays the Tasks
 * tab's job alone (see components/goals/TodaysTasks.tsx).
 */
export function GoalTasksSnapshot() {
  const router = useRouter()
  const { tasks, loading, goalTitleById, handleToggleTaskCompletion } = useTodaysTasks()

  const goalTasks = tasks.filter((t) => t.goal_id).slice(0, LIMIT)

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm dark:bg-slate-900/40 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList size={14} strokeWidth={2.5} />
          Goal tasks today
        </h3>
        <Link href="/goals/tasks" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : goalTasks.length === 0 ? (
        <p className="mt-3 rounded-lg border border-border bg-accent/5 px-3 py-3 text-sm text-muted-foreground">
          No goal tasks due today.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {goalTasks.map((task) => (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/goals/${task.goal_id}?task=${task.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/goals/${task.goal_id}?task=${task.id}`)
              }}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 transition-colors hover:bg-accent/40"
            >
              <button
                type="button"
                aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleToggleTaskCompletion(task.id, task.completed)
                }}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-[background-color,color,transform] hover:bg-accent active:scale-95",
                  task.completed ? "text-emerald-500" : "text-muted-foreground/60 hover:text-primary"
                )}
              >
                {task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium",
                  task.completed && "text-muted-foreground line-through"
                )}
              >
                {task.title || task.description}
              </span>
              {task.goal_id && (
                <span className="max-w-[100px] shrink-0 truncate rounded-md bg-foreground/[0.03] px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {goalTitleById[task.goal_id]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
