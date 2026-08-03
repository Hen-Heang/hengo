"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { format } from "date-fns"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Target,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import EmojiIconPicker from "@/components/ui/emoji-icon-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { DeadlineStatusBadge } from "@/components/goals/DeadlineStatusBadge"
import { HealthBadge } from "@/components/goals/HealthBadge"
import { goalsApi } from "@/lib/api"
import { goalsQueryKey } from "@/hooks/useGoals"
import { calculateGoalDeadlineInfo, getDeadlineStatusStyling, type Goal, type SortOption } from "@/lib/goals"
import { allKeyResultsAchieved, computeGoalProgress } from "@/lib/goal-progress"
import { computeGoalHealth } from "@/lib/goal-health"
import { getUserId } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

export interface GoalListProps {
  goals: Goal[]
  isLoading: boolean
  isDeleting: string | null
  sortOption: SortOption
  onDeleteGoal: (goal: Goal, event: React.MouseEvent) => void
  onEditGoal?: (goal: Goal, event: React.MouseEvent) => void
  onToggleStar?: (goalId: string) => void
  onToggleComplete?: (goalId: string) => void
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 6) * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: { opacity: 0, scale: 0.92, y: 10, transition: { duration: 0.2 } },
  hover: { y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } },
  tap: { scale: 0.98, transition: { type: "spring", stiffness: 600, damping: 40 } },
}

const progressGradient = (progress: number) =>
  progress >= 75
    ? "linear-gradient(90deg, #10b981, #059669)"
    : progress >= 40
      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
      : "linear-gradient(90deg, #f59e0b, #ef4444)"

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 8) * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
}

type GoalActionHandlers = {
  goal: Goal
  onDeleteGoal: (goal: Goal, event: React.MouseEvent) => void
  onEditGoal?: (goal: Goal, event: React.MouseEvent) => void
  onToggleStar?: (goalId: string) => void
  onToggleComplete?: (goalId: string) => void
}

// Star + complete/edit/delete menu, shared by the grid card and the table row
// so the owner controls stay identical across views. `size` tunes the touch
// target (smaller for the compact row).
function GoalActions({ goal, size, onDeleteGoal, onEditGoal, onToggleStar, onToggleComplete }: GoalActionHandlers & { size: string }) {
  const isCompleted = goal.status === "completed"
  return (
    <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleStar?.(goal.id)}
        aria-label={goal.isStarred ? "Unstar goal" : "Star goal"}
        className={cn(
          size,
          "rounded-xl",
          goal.isStarred
            ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
            : "text-muted-foreground/60 hover:bg-amber-500/10 hover:text-amber-500"
        )}
      >
        <Star className={cn("h-4 w-4", goal.isStarred && "fill-current")} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Goal actions" className={cn(size, "rounded-xl hover:bg-foreground/5")}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-2xl p-2 shadow-lg">
          <DropdownMenuItem className="rounded-xl font-medium" onSelect={() => onToggleComplete?.(goal.id)}>
            {isCompleted ? (
              <RotateCcw className="mr-3 h-4 w-4 text-blue-500" />
            ) : (
              <CheckCircle2 className="mr-3 h-4 w-4 text-emerald-500" />
            )}
            {isCompleted ? "Reopen goal" : "Mark complete"}
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-xl font-medium" onSelect={(e) => onEditGoal?.(goal, e as unknown as React.MouseEvent)}>
            <Pencil className="mr-3 h-4 w-4 text-primary" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem variant="destructive" className="rounded-xl font-medium" onSelect={(e) => onDeleteGoal(goal, e as unknown as React.MouseEvent)}>
            <Trash2 className="mr-3 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Emoji/initial avatar with the inline icon picker, shared by both views.
function GoalIcon({
  goal,
  icon,
  onChange,
  className,
}: {
  goal: Goal
  icon: string | null
  onChange: (emoji: string | null) => void
  className: string
}) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden bg-primary/10 font-bold text-primary", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <EmojiIconPicker value={icon} onChange={onChange}>
        <button className="flex h-full w-full items-center justify-center">
          {icon || goal.title.charAt(0).toUpperCase()}
        </button>
      </EmojiIconPicker>
    </div>
  )
}

export function GoalList({
  goals,
  isLoading,
  onDeleteGoal,
  onEditGoal,
  onToggleStar,
  onToggleComplete,
}: GoalListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUser = getUserId()
  const [openingGoalId, setOpeningGoalId] = useState<string | null>(null)
  const [iconOverrides, setIconOverrides] = useState<Record<string, string | null>>({})
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("dg_goal_view") === "grid"
      ? "grid"
      : "list"
  )

  const setView = (next: "grid" | "list") => {
    setViewMode(next)
    localStorage.setItem("dg_goal_view", next)
  }

  const getGoalIcon = (goal: Goal): string | null => {
    if (Object.prototype.hasOwnProperty.call(iconOverrides, goal.id)) return iconOverrides[goal.id]
    return goal.metadata?.icon ?? null
  }

  const handleMarkComplete = async (goal: Goal, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      const updated = await goalsApi.update(goal.id, {
        title: goal.title,
        description: goal.description ?? "",
        target_date: goal.target_date ?? null,
        no_duration: goal.no_duration ?? Boolean(goal.metadata?.no_duration),
        metadata: goal.metadata,
        status: "completed",
      })
      queryClient.setQueryData<Goal[]>(goalsQueryKey(currentUser), (prev) =>
        prev?.map((g) => (g.id === goal.id ? { ...g, ...updated } : g))
      )
      toast.success("Goal marked as complete")
    } catch {
      toast.error("Could not mark goal as complete")
    }
  }

  const handleIconChange = async (goal: Goal, emoji: string | null) => {
    setIconOverrides((prev) => ({ ...prev, [goal.id]: emoji }))
    try {
      // Send the full goal payload (mirroring the edit panel) so the backend
      // persists the metadata change — a metadata-only PUT was being dropped.
      const updated = await goalsApi.update(goal.id, {
        title: goal.title,
        description: goal.description ?? "",
        target_date: goal.target_date ?? null,
        no_duration: goal.no_duration ?? Boolean(goal.metadata?.no_duration),
        metadata: { ...goal.metadata, icon: emoji ?? undefined },
      })
      // Propagate the saved icon into the cached list so it survives refetch
      // and navigation instead of living only in local override state.
      queryClient.setQueryData<Goal[]>(goalsQueryKey(currentUser), (prev) =>
        prev?.map((g) => (g.id === goal.id ? { ...g, ...updated } : g))
      )
      toast.success(emoji ? "Icon updated" : "Icon removed")
    } catch {
      setIconOverrides((prev) => {
        const next = { ...prev }
        delete next[goal.id]
        return next
      })
      toast.error("Could not update icon")
    }
  }

  if (isLoading) {
    return viewMode === "grid" ? (
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card/30 px-4 py-10 text-center sm:gap-6 sm:py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 sm:h-20 sm:w-20">
          <Target size={32} strokeWidth={1.5} className="sm:size-9" />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">No goals found</h3>
          <p className="mt-2 max-w-sm text-sm font-medium text-muted-foreground">
            Try adjusting your filters or create a new goal to get started.
          </p>
        </div>
        <Button onClick={() => router.push("/goals/create")} size="lg" className="rounded-xl font-semibold shadow-lg shadow-blue-600/20">
          <Plus size={18} strokeWidth={2} className="mr-2" /> New goal
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-1 rounded-xl bg-foreground/5 p-1">
          {([
            { mode: "list", Icon: List, label: "List view" },
            { mode: "grid", Icon: LayoutGrid, label: "Grid view" },
          ] as const).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              aria-label={label}
              aria-pressed={viewMode === mode}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/50 hover:text-foreground"
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Key the container by viewMode so the two layouts cross-fade as separate
          trees, instead of morphing the same keyed nodes across a grid⇄flex
          change (which is what made the switch janky). */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn(viewMode === "grid" ? "grid grid-cols-2 gap-4 sm:gap-6" : "flex flex-col gap-2.5")}
        >
          {goals.map((goal, i) => {
            const deadlineInfo = calculateGoalDeadlineInfo(goal)
            const deadlineStyling = deadlineInfo
              ? getDeadlineStatusStyling(deadlineInfo.status, deadlineInfo.urgencyLevel)
              : null
            // Outcome progress (weighted key results) takes priority over the
            // legacy done/total task percentage — see lib/goal-progress.ts.
            const goalProgress = computeGoalProgress(goal.taskCounts, goal.keyResults ?? [])
            const total = goalProgress.activityProgress.total
            const done = goalProgress.activityProgress.completed
            const progress = goalProgress.outcomeProgress ?? goalProgress.activityProgress.percentage
            const readyToComplete =
              goal.status !== "completed" &&
              (goalProgress.hasActiveKeyResults
                ? allKeyResultsAchieved(goal.keyResults ?? [])
                : goalProgress.activityProgress.percentage === 100)
            // List-level health: no per-goal task-detail fetch here, so overdue
            // high-impact / inactivity signals are omitted (0 / null) — the
            // goal detail page computes those from the full task list.
            const health = computeGoalHealth({
              goalStatus: goal.status,
              hasKeyResults: goalProgress.hasActiveKeyResults,
              outcomeProgress: goalProgress.outcomeProgress,
              allKeyResultsAchieved: goalProgress.hasActiveKeyResults
                ? allKeyResultsAchieved(goal.keyResults ?? [])
                : false,
              activityTotalTasks: total,
              targetDate: goal.target_date,
              startDate: goal.metadata?.start_date ?? null,
              noDuration: Boolean(goal.no_duration || goal.metadata?.no_duration),
              now: new Date(),
              daysSinceLastActivity: null,
              overdueHighImpactTaskCount: 0,
            })
            const goalIcon = getGoalIcon(goal)
            const isOpening = openingGoalId === goal.id
            const isOwner = currentUser != null && String(currentUser) === String(goal.user_id)
            const open = () => {
              setOpeningGoalId(goal.id)
              router.push(`/goals/${goal.id}`)
            }

            // ── List view: thin full-width table row ──
            if (viewMode === "list") {
              return (
                <motion.div
                  key={goal.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  onClick={open}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-3 py-3 transition-all hover:border-primary/30 hover:shadow-lg dark:bg-slate-900/40",
                    isOpening && "ring-2 ring-primary",
                    readyToComplete && "border-emerald-500/40 bg-emerald-500/[0.03]",
                    deadlineStyling?.borderColor
                  )}
                >
                  <GoalIcon
                    goal={goal}
                    icon={goalIcon}
                    onChange={(emoji) => handleIconChange(goal, emoji)}
                    className="h-11 w-11 rounded-xl text-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 title={goal.title} className="truncate text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {goal.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="shrink-0">
                        <HealthBadge status={health.status} reason={health.reason} />
                      </span>
                      <div className="h-2 min-w-6 flex-1 overflow-hidden rounded-full bg-foreground/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{ background: progressGradient(progress) }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                        {done}/{total}
                      </span>
                    </div>
                  </div>
                  {readyToComplete ? (
                    <button
                      type="button"
                      onClick={(e) => handleMarkComplete(goal, e)}
                      className="shrink-0 animate-pulse rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-500/30 hover:animate-none hover:bg-emerald-500/25 dark:text-emerald-400"
                    >
                      Mark complete
                    </button>
                  ) : (
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{progress}%</span>
                  )}
                  {isOpening ? (
                    <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    isOwner && (
                      <GoalActions
                        goal={goal}
                        size="h-11 w-11"
                        onDeleteGoal={onDeleteGoal}
                        onEditGoal={onEditGoal}
                        onToggleStar={onToggleStar}
                        onToggleComplete={onToggleComplete}
                      />
                    )
                  )}
                </motion.div>
              )
            }

            // ── Grid view: compact card, 2-up on phones ──
            return (
              <motion.div
                key={goal.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
                layout
                className="group relative"
              >
                <Card
                  className={cn(
                    "h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 dark:bg-slate-900/40",
                    isOpening && "ring-2 ring-primary",
                    readyToComplete && "border-emerald-500/40 bg-emerald-500/[0.03]",
                    deadlineStyling?.borderColor
                  )}
                  onClick={open}
                >
                  <CardContent className="flex h-full flex-col p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <GoalIcon
                        goal={goal}
                        icon={goalIcon}
                        onChange={(emoji) => handleIconChange(goal, emoji)}
                        className="h-12 w-12 rounded-2xl text-2xl sm:h-14 sm:w-14 sm:text-3xl"
                      />
                      {isOwner && (
                        <GoalActions
                          goal={goal}
                          size="h-11 w-11"
                          onDeleteGoal={onDeleteGoal}
                          onEditGoal={onEditGoal}
                          onToggleStar={onToggleStar}
                          onToggleComplete={onToggleComplete}
                        />
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
                        {goal.metadata?.goal_type || "General"}
                      </Badge>
                      <HealthBadge status={health.status} reason={health.reason} />
                      {deadlineInfo && <DeadlineStatusBadge deadlineInfo={deadlineInfo} size="sm" />}
                    </div>
                    <h3 title={goal.title} className="mt-2 line-clamp-2 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg">
                      {goal.title}
                    </h3>

                    <div className="mt-auto space-y-3 pt-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-end gap-2">
                          {readyToComplete ? (
                            <button
                              type="button"
                              onClick={(e) => handleMarkComplete(goal, e)}
                              className="animate-pulse rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-500/30 hover:animate-none hover:bg-emerald-500/25 dark:text-emerald-400"
                            >
                              Mark complete
                            </button>
                          ) : (
                            <span className="text-sm font-semibold tabular-nums text-primary">{progress}%</span>
                          )}
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-foreground/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{ background: progressGradient(progress) }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <ClipboardList size={14} className="text-primary/60" />
                          {done}/{total}
                          {goalProgress.hasActiveKeyResults && " activity"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {isOpening ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : goal.target_date ? (
                            <>
                              <CalendarDays size={14} className="text-primary/60" />
                              {format(new Date(goal.target_date), "MMM d")}
                            </>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default GoalList
