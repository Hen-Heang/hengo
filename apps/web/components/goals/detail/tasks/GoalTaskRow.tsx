"use client"

import { Check, Clock, Flag, MoreHorizontal, Paperclip, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/tasks"
import type { GoalKeyResult } from "@/lib/goal-key-results"
import type { GoalPlanPhase } from "@/lib/goal-plan-phases"
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  isTaskOverdue,
  resolveTaskStatus,
  taskScheduleDisplay,
} from "@/lib/task-status"
import { taskEffortMinutes } from "@/lib/weekly-capacity"
import { cn } from "@/lib/utils"

export interface GoalTaskRowProps {
  task: Task
  todayYmd: string
  phase?: GoalPlanPhase | null
  keyResult?: GoalKeyResult | null
  /** "card" = mobile/stacked; "row" = desktop dense list. */
  variant: "card" | "row"
  isSelected?: boolean
  showPhase?: boolean
  onToggleCompleted: (task: Task) => void
  onOpen: (task: Task) => void
  onSetStatus: (task: Task, status: Task["status"]) => void
  onSchedule: (task: Task) => void
  onMoveToBacklog: (task: Task) => void
  onDelete: (task: Task) => void
}

export const formatEffort = (m: number): string =>
  m <= 0 ? "—" : m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m}m`

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  medium: "bg-foreground/5 text-muted-foreground",
  low: "bg-foreground/5 text-muted-foreground/80",
}

/**
 * One task, in either presentation. Both variants share the same data and
 * the same actions — the mobile card is not a squeezed desktop table row, and
 * the desktop row is never horizontally scrolled on mobile.
 *
 * Deliberately shows a fixed, small set of fields (status, date, duration,
 * phase, key result, impact, blocked reason, evidence flag) rather than every
 * column the row has; the rest lives in the details panel.
 */
export function GoalTaskRow({
  task,
  todayYmd,
  phase,
  keyResult,
  variant,
  isSelected,
  showPhase = true,
  onToggleCompleted,
  onOpen,
  onSetStatus,
  onSchedule,
  onMoveToBacklog,
  onDelete,
}: GoalTaskRowProps) {
  const status = resolveTaskStatus(task, todayYmd)
  const overdue = isTaskOverdue(task, todayYmd)
  const schedule = taskScheduleDisplay(task, todayYmd)
  const effort = taskEffortMinutes(task)
  const isDone = status === "completed"
  const title = task.title || task.description || "Untitled task"

  const completionControl = (
    <button
      type="button"
      onClick={() => onToggleCompleted(task)}
      aria-label={isDone ? `Mark "${title}" not done` : `Mark "${title}" done`}
      aria-pressed={isDone}
      className={cn(
        // 44px hit area on touch, tighter visual box on desktop.
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors",
          isDone
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent hover:border-primary/50",
        )}
      >
        <Check size={13} strokeWidth={3} />
      </span>
    </button>
  )

  const overflow = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for "${title}"`}
          className="h-11 w-11 shrink-0 rounded-lg sm:h-8 sm:w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
        <DropdownMenuItem className="rounded-lg" onSelect={() => onOpen(task)}>
          Open details
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg" onSelect={() => onSchedule(task)}>
          Schedule…
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg" onSelect={() => onMoveToBacklog(task)}>
          Move to backlog
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        {TASK_STATUSES.filter((s) => s !== status).map((s) => (
          <DropdownMenuItem key={s} className="rounded-lg" onSelect={() => onSetStatus(task, s)}>
            Mark {TASK_STATUS_LABELS[s].toLowerCase()}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          variant="destructive"
          className="rounded-lg"
          onSelect={() => onDelete(task)}
        >
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const statusBadge = (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
        overdue ? "bg-red-500/10 text-red-700 dark:text-red-400" : TASK_STATUS_STYLES[status],
      )}
    >
      {overdue ? "Overdue" : TASK_STATUS_LABELS[status]}
    </span>
  )

  const scheduleLabel = (
    <span
      className={cn(
        schedule.unscheduled ? "text-amber-700 dark:text-amber-400" : "tabular-nums",
        overdue && "text-red-600 dark:text-red-400",
      )}
    >
      {schedule.label}
    </span>
  )

  if (variant === "row") {
    return (
      <li
        className={cn(
          "grid items-center gap-2 border-b border-border/50 px-1.5 py-1.5 text-sm transition-colors last:border-b-0 hover:bg-accent/40",
          showPhase
            ? "grid-cols-[auto_minmax(0,1fr)_6.5rem_6.5rem_8rem_8rem_4.5rem_4.5rem_auto]"
            : "grid-cols-[auto_minmax(0,1fr)_6.5rem_6.5rem_8rem_4.5rem_4.5rem_auto]",
          isSelected && "bg-accent/60",
        )}
      >
        {completionControl}
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="min-w-0 truncate text-left font-medium text-foreground hover:underline"
        >
          <span className={cn(isDone && "text-muted-foreground line-through")}>{title}</span>
          {task.blocked_reason && status === "blocked" && (
            <span className="ml-2 text-[11px] font-normal text-red-600 dark:text-red-400">
              {task.blocked_reason}
            </span>
          )}
        </button>
        <span className="truncate">{statusBadge}</span>
        <span className="truncate text-xs font-medium text-muted-foreground">{scheduleLabel}</span>
        {showPhase && (
          <span className="truncate text-xs font-medium text-muted-foreground">
            {phase?.title ?? "—"}
          </span>
        )}
        <span className="truncate text-xs font-medium text-muted-foreground">
          {keyResult?.title ?? "—"}
        </span>
        <span className="truncate text-xs font-medium capitalize text-muted-foreground">
          {task.impact_level ?? "—"}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-muted-foreground">
          {formatEffort(effort)}
          {task.evidence_required && (
            <Paperclip size={12} aria-label="Evidence required" className="shrink-0" />
          )}
        </span>
        {overflow}
      </li>
    )
  }

  return (
    <li
      className={cn(
        "rounded-xl border border-border/60 px-2.5 py-2 transition-colors",
        isSelected && "border-primary/40 bg-primary/[0.03]",
      )}
    >
      <div className="flex items-start gap-1.5">
        {completionControl}
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="min-w-0 flex-1 py-2 text-left"
        >
          <span
            className={cn(
              "block text-sm font-medium leading-snug",
              isDone ? "text-muted-foreground line-through" : "text-foreground",
            )}
          >
            {title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-muted-foreground">
            {statusBadge}
            {scheduleLabel}
            {effort > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {formatEffort(effort)}
              </span>
            )}
            {phase && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Flag size={11} className="shrink-0" />
                <span className="truncate">{phase.title}</span>
              </span>
            )}
            {keyResult && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Target size={11} className="shrink-0" />
                <span className="truncate">{keyResult.title}</span>
              </span>
            )}
            {task.impact_level && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  IMPACT_STYLES[task.impact_level],
                )}
              >
                {task.impact_level} impact
              </span>
            )}
            {task.evidence_required && (
              <span className="inline-flex items-center gap-1">
                <Paperclip size={11} /> Evidence
              </span>
            )}
          </span>
          {status === "blocked" && task.blocked_reason && (
            <span className="mt-1 block text-[11px] font-medium text-red-600 dark:text-red-400">
              Blocked: {task.blocked_reason}
            </span>
          )}
        </button>
        {overflow}
      </div>
    </li>
  )
}
