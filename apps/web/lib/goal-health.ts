// Pure, deterministic goal-health engine (Goal System v2 — see
// docs/goal-system-v2-audit.md). No AI here by design — this is the
// first-version heuristic the spec asks for before any AI enhancement layers
// on top of it. Every input is a plain value so this is fully unit-testable
// and has no dependency on Supabase, the clock, or React.
import { differenceInDays, parseISO } from "date-fns"
import { clampPercent } from "@/lib/goal-progress"
import type { GoalHealthStatus } from "@/lib/goals"

export interface GoalHealthInput {
  /** Goal.status — "completed" short-circuits everything else. */
  goalStatus: string
  hasKeyResults: boolean
  /** Weighted key-result progress (0–100), or null if it can't be computed yet. */
  outcomeProgress: number | null
  allKeyResultsAchieved: boolean
  /** Total task count, used only to distinguish "not started" from "no key results yet but active". */
  activityTotalTasks: number
  targetDate: string | null
  startDate: string | null
  noDuration: boolean
  now: Date
  /** Days since the most recent completed task/activity, or null if there's never been any. */
  daysSinceLastActivity: number | null
  overdueHighImpactTaskCount: number
}

export interface GoalHealth {
  status: GoalHealthStatus
  reason: string
}

const SEVERITY: Record<Extract<GoalHealthStatus, "on_track" | "attention" | "at_risk" | "blocked">, number> = {
  on_track: 0,
  attention: 1,
  at_risk: 2,
  blocked: 3,
}

/**
 * Deterministic health status + a short human-readable reason. Priority
 * order: explicit completion > no-key-results fallback > all-KRs-achieved >
 * the most severe of {deadline pace, overdue high-impact tasks, inactivity}.
 */
export const computeGoalHealth = (input: GoalHealthInput): GoalHealth => {
  if (input.goalStatus === "completed") {
    return { status: "completed", reason: "Goal marked complete." }
  }

  if (!input.hasKeyResults) {
    if (input.activityTotalTasks === 0) {
      return {
        status: "not_started",
        reason: "No key results or tasks yet — add key results to start tracking real outcome progress.",
      }
    }
    return {
      status: "attention",
      reason: "No key results defined yet — showing legacy task-completion activity only.",
    }
  }

  if (input.allKeyResultsAchieved) {
    return { status: "on_track", reason: "All key results are complete." }
  }

  const outcomeProgress = input.outcomeProgress ?? 0
  const candidates: { status: "attention" | "at_risk" | "blocked"; reason: string }[] = []

  if (!input.noDuration && input.targetDate) {
    const target = parseISO(input.targetDate)
    const start = input.startDate ? parseISO(input.startDate) : input.now
    const totalDays = differenceInDays(target, start)
    const daysElapsed = differenceInDays(input.now, start)
    const daysRemaining = differenceInDays(target, input.now)

    if (daysRemaining < 0) {
      const overdueDays = Math.abs(daysRemaining)
      candidates.push({
        status: "blocked",
        reason: `Deadline passed ${overdueDays} day${overdueDays === 1 ? "" : "s"} ago with outcome progress at ${Math.round(outcomeProgress)}%.`,
      })
    } else if (totalDays > 0) {
      const expectedProgress = clampPercent((daysElapsed / totalDays) * 100)
      const deficit = expectedProgress - outcomeProgress
      if (deficit > 25) {
        candidates.push({
          status: "at_risk",
          reason: `Progress is ${Math.round(deficit)}% behind the expected pace.`,
        })
      } else if (deficit > 10) {
        candidates.push({
          status: "attention",
          reason: `Progress is ${Math.round(deficit)}% behind the expected pace.`,
        })
      }
    }
  }

  if (input.overdueHighImpactTaskCount > 0) {
    candidates.push({
      status: input.overdueHighImpactTaskCount >= 3 ? "at_risk" : "attention",
      reason: `${input.overdueHighImpactTaskCount} overdue high-impact task${input.overdueHighImpactTaskCount === 1 ? "" : "s"} need attention.`,
    })
  }

  if (input.daysSinceLastActivity != null && input.daysSinceLastActivity >= 7) {
    candidates.push({
      status: input.daysSinceLastActivity >= 14 ? "at_risk" : "attention",
      reason: `No high-impact action has been completed in ${input.daysSinceLastActivity} days.`,
    })
  }

  if (candidates.length === 0) {
    return { status: "on_track", reason: "Progress matches the expected pace." }
  }

  return candidates.reduce((worst, candidate) =>
    SEVERITY[candidate.status] > SEVERITY[worst.status] ? candidate : worst,
  )
}
