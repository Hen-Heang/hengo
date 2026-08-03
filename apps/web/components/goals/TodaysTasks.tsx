"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { motion, AnimatePresence } from "motion/react"
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTodaysTasks } from "@/hooks/useTodaysTasks"
import { bumpEndAfterStart } from "@/lib/calendar"
import { DEFAULT_TASK_COLOR, TASK_COLORS, type Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

// Ported from Orbit dashboard/TodaysTasks.tsx. Goal multi-select filter, quick
// add, progress, overdue/scheduled/anytime/completed grouping, and mark-all +
// undo are kept. Sharing / select-mode (deferred) are dropped.

interface TodaysTasksProps {
  className?: string
}

export function TodaysTasks({ className }: TodaysTasksProps) {
  const router = useRouter()
  const [showCompleted, setShowCompleted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")

  // Composer: a single inline "Google Tasks"-style entry that expands on
  // focus to reveal goal/time/description/color instead of a separate modal
  // duplicating the same choices.
  const [composerOpen, setComposerOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [isAnytime, setIsAnytime] = useState(true)
  const [dailyStart, setDailyStart] = useState("09:00")
  const [dailyEnd, setDailyEnd] = useState("10:00")
  const [color, setColor] = useState<string>(DEFAULT_TASK_COLOR)
  const [timeError, setTimeError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    tasks,
    loading,
    availableGoals,
    selectedGoalIds,
    newTaskTitle,
    setNewTaskTitle,
    newTaskGoalId,
    setNewTaskGoalId,
    isMarkingAll,
    canUndo,
    completedCount,
    totalCount,
    progressPct,
    groups,
    goalTitleById,
    toggleGoal,
    toggleAll,
    createTask,
    handleToggleTaskCompletion,
    handleMarkAllCompleted,
    handleUndoMarkAllCompleted,
    editTask,
    deleteTask,
  } = useTodaysTasks()

  const resetComposer = () => {
    setNewTaskTitle("")
    setDescription("")
    setIsAnytime(true)
    setDailyStart("09:00")
    setDailyEnd("10:00")
    setColor(DEFAULT_TASK_COLOR)
    setTimeError(null)
    setComposerOpen(false)
  }

  const handleStartTimeChange = (value: string) => {
    const v = value || "09:00"
    setDailyStart(v)
    setTimeError(null)
    setDailyEnd((prev) => bumpEndAfterStart(v, prev))
  }

  // Single submit path for both the collapsed fast-add (title only, Anytime
  // today) and the expanded form — whatever fields are currently set apply,
  // so there's exactly one way a task gets created.
  const submitTask = async () => {
    const title = newTaskTitle.trim()
    if (!title || submitting) return
    if (!isAnytime && dailyEnd <= dailyStart) {
      setTimeError("End time must be after start time.")
      return
    }
    setSubmitting(true)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
    try {
      await createTask({
        title,
        description: description.trim() || title,
        goal_id: newTaskGoalId,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        daily_start_time: isAnytime ? null : dailyStart,
        daily_end_time: isAnytime ? null : dailyEnd,
        is_anytime: isAnytime,
        color,
        completed: false,
      })
      resetComposer()
    } catch {
      /* toast already shown by createTask */
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditingValue(task.title || task.description || "")
  }

  const commitEdit = () => {
    if (editingId) void editTask(editingId, editingValue)
    setEditingId(null)
    setEditingValue("")
  }

  const allSelected =
    availableGoals.length > 0 && selectedGoalIds.length === availableGoals.length

  const handleTaskClick = (task: Task) => {
    if (task.goal_id) router.push(`/goals/${task.goal_id}?task=${task.id}`)
    else router.push("/goals/calendar")
  }

  const renderProgress = () => {
    if (totalCount === 0) return null
    const allDone = completedCount === totalCount
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className={cn(allDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {allDone ? "All tasks done" : "Daily progress"}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/5">
          <motion.div
            className={cn("h-full w-full origin-left rounded-full", allDone ? "bg-emerald-500" : "bg-primary")}
            initial={false}
            animate={{ scaleX: progressPct / 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      </div>
    )
  }

  const newTaskGoalTitle = newTaskGoalId ? goalTitleById[newTaskGoalId] : null

  const renderQuickAdd = () => (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        composerOpen ? "border-primary/40 bg-background shadow-sm" : "border-border bg-background/40"
      )}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onFocus={() => setComposerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void submitTask()
            }
            if (e.key === "Escape") resetComposer()
          }}
          placeholder="Add a task for today…"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/40"
        />
        {!composerOpen && (
          <Button
            size="sm"
            onClick={() => void submitTask()}
            disabled={!newTaskTitle.trim() || submitting}
            className="h-8 shrink-0 rounded-xl bg-primary px-3 text-xs font-medium text-white shadow-sm"
          >
            Add
          </Button>
        )}
      </div>

      {composerOpen && (
        <div className="space-y-3 border-t border-border/60 px-3.5 pb-3.5 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {availableGoals.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                      newTaskGoalId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Target className="h-3.5 w-3.5" />
                    {newTaskGoalTitle ? (
                      <span className="max-w-[160px] truncate">{newTaskGoalTitle}</span>
                    ) : (
                      "No goal"
                    )}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 rounded-2xl p-2 shadow-lg">
                  <DropdownMenuLabel className="px-3 pt-2 text-xs font-medium text-muted-foreground">
                    Assign to
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem
                    onSelect={() => setNewTaskGoalId(null)}
                    className={cn("rounded-xl font-medium", !newTaskGoalId && "bg-primary/10 text-primary")}
                  >
                    No goal (standalone)
                  </DropdownMenuItem>
                  <div className="max-h-56 overflow-y-auto">
                    {availableGoals.map((g) => (
                      <DropdownMenuItem
                        key={g.id}
                        onSelect={() => setNewTaskGoalId(g.id)}
                        className={cn("rounded-xl font-medium", newTaskGoalId === g.id && "bg-primary/10 text-primary")}
                      >
                        <span className="truncate">{g.title || "Untitled"}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              type="button"
              onClick={() => {
                setIsAnytime((v) => !v)
                setTimeError(null)
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                !isAnytime ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {isAnytime ? "Anytime" : `${dailyStart}–${dailyEnd}`}
            </button>
          </div>

          {!isAnytime && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                aria-label="Start time"
                value={dailyStart}
                onChange={(e) => handleStartTimeChange(e.target.value || "09:00")}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="time"
                aria-label="End time"
                value={dailyEnd}
                onChange={(e) => {
                  setDailyEnd(e.target.value || "10:00")
                  setTimeError(null)
                }}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          )}
          {timeError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {timeError}
            </p>
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details…"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background/60 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/40 focus-visible:border-primary/50"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {TASK_COLORS.map((c) => {
                const selected = color.toLowerCase() === c.value.toLowerCase()
                return (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={selected}
                    onClick={() => setColor(c.value)}
                    className="h-5 w-5 shrink-0 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.value,
                      boxShadow: selected
                        ? `0 0 0 2px var(--background, #fff), 0 0 0 3.5px ${c.value}`
                        : "inset 0 0 0 1px rgba(0,0,0,0.12)",
                    }}
                  />
                )
              })}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={resetComposer} className="h-8 rounded-xl px-3 text-xs font-medium">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void submitTask()}
                disabled={!newTaskTitle.trim() || submitting}
                className="h-8 rounded-xl bg-primary px-4 text-xs font-medium text-white shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Add task"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderActions = () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => (canUndo ? handleUndoMarkAllCompleted() : handleMarkAllCompleted())}
        disabled={isMarkingAll || (!canUndo && completedCount === totalCount)}
        className={cn(
          "h-9 gap-2 rounded-2xl border-border bg-background/50 px-4 text-xs font-medium",
          canUndo ? "text-red-500 hover:text-red-600" : "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {isMarkingAll ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : canUndo ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle className="h-3.5 w-3.5" />
        )}
        {isMarkingAll ? "Marking…" : canUndo ? "Undo" : "Mark all complete"}
      </Button>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-2xl border-border bg-background/50 px-4 text-xs font-medium">
              Filter goals
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 shadow-lg">
            <DropdownMenuLabel className="px-3 pt-2 text-xs font-medium text-muted-foreground">Show tasks from</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuCheckboxItem
              checked={allSelected}
              onCheckedChange={() => toggleAll()}
              onSelect={(e) => e.preventDefault()}
              className="rounded-xl font-medium"
            >
              All goals
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator className="my-2" />
            <div className="max-h-56 overflow-y-auto">
              {availableGoals.map((g) => (
                <DropdownMenuCheckboxItem
                  key={g.id}
                  checked={selectedGoalIds.includes(g.id)}
                  onCheckedChange={() => toggleGoal(g.id)}
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-xl font-medium"
                >
                  <span className="truncate">{g.title || "Untitled"}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  const renderTaskItem = (task: Task) => {
    const overdue = groups.isOverdue(task)
    const goalTitle = task.goal_id ? goalTitleById[task.goal_id] : null
    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "group/item relative flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-all duration-300",
          overdue
            ? "border-red-500/20 bg-red-500/[0.03] hover:bg-red-500/[0.05]"
            : "border-border bg-background/40 hover:bg-accent/50 lg:p-5"
        )}
        onClick={() => {
          if (editingId !== task.id) handleTaskClick(task)
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            void handleToggleTaskCompletion(task.id, task.completed)
          }}
          className={cn(
            "mt-0.5 shrink-0 transition-transform active:scale-90",
            task.completed ? "text-emerald-500" : "text-muted-foreground/60 hover:text-primary"
          )}
        >
          {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
        </button>
        <div className="min-w-0 flex-1">
          {editingId === task.id ? (
            <input
              autoFocus
              value={editingValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit()
                if (e.key === "Escape") {
                  setEditingId(null)
                  setEditingValue("")
                }
              }}
              onBlur={commitEdit}
              className="w-full rounded-lg border border-primary/40 bg-background px-2 py-1 text-sm font-medium outline-none"
            />
          ) : (
            <span className={cn(
              "block text-sm font-medium leading-snug transition-all",
              task.completed ? "text-muted-foreground line-through" : "text-foreground group-hover/item:text-primary"
            )}>
              {task.title || task.description}
            </span>
          )}
          <div className="mt-2 flex items-center justify-between text-xs font-medium">
            <span className={cn("flex items-center gap-1.5", overdue ? "text-red-500/80" : "text-muted-foreground")}>
              {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {task.is_anytime ? "Anytime" : task.daily_start_time?.slice(0, 5)}
            </span>
            {goalTitle && (
              <span className="max-w-[120px] truncate rounded-lg bg-foreground/[0.03] px-2 py-0.5 text-muted-foreground">
                {goalTitle}
              </span>
            )}
          </div>
        </div>

        {/* Row actions (hover) */}
        {editingId !== task.id && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
            <button
              type="button"
              aria-label="Edit task"
              onClick={(e) => {
                e.stopPropagation()
                startEditing(task)
              }}
              className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete task"
              onClick={(e) => {
                e.stopPropagation()
                void deleteTask(task.id)
              }}
              className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  const sectionHeader = (label: string, count: number, accent?: string) => (
    <div className="flex items-center gap-2 px-1 py-2">
      <span className={cn("text-[11px] font-semibold uppercase tracking-wide", accent || "text-muted-foreground")}>
        {label}
      </span>
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{count}</span>
      <div className="h-px flex-1 bg-foreground/5" />
    </div>
  )

  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40 lg:p-8",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Today&apos;s tasks</h3>
            <p className="text-xs font-medium text-muted-foreground">
              {format(new Date(), "EEEE, MMM d")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-xl p-2 text-muted-foreground/40 hover:bg-accent hover:text-foreground lg:hidden"
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform", collapsed && "-rotate-90")} />
        </button>
      </div>

      {!collapsed && (
        <div className="mt-6 space-y-5">
          {totalCount > 0 && renderProgress()}
          {renderQuickAdd()}
          {renderActions()}
          <div className="space-y-2 lg:max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-3 pt-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-base font-semibold">All clear</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground">No tasks left for today.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {groups.overdue.length > 0 && (
                  <React.Fragment key="overdue-group">
                    {sectionHeader("Overdue", groups.overdue.length, "text-red-500/80")}
                    {groups.overdue.map(t => renderTaskItem(t))}
                  </React.Fragment>
                )}
                {groups.scheduled.length > 0 && (
                  <React.Fragment key="scheduled-group">
                    {sectionHeader("Scheduled", groups.scheduled.length)}
                    {groups.scheduled.map(t => renderTaskItem(t))}
                  </React.Fragment>
                )}
                {groups.anytime.length > 0 && (
                  <React.Fragment key="anytime-group">
                    {sectionHeader("Anytime", groups.anytime.length)}
                    {groups.anytime.map(t => renderTaskItem(t))}
                  </React.Fragment>
                )}
                {groups.completed.length > 0 && (
                  <React.Fragment key="completed-group">
                    <button
                      key="completed-toggle"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex w-full items-center gap-2 py-2"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600/60">Completed</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{groups.completed.length}</span>
                      <div className="h-px flex-1 bg-foreground/5" />
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground/60", showCompleted && "rotate-180")} />
                    </button>
                    {showCompleted && groups.completed.map(t => renderTaskItem(t))}
                  </React.Fragment>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TodaysTasks
