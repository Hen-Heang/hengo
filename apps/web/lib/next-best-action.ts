// Next Best Action — the single task the Overview tab tells you to do next.
//
// Deterministic by design: no AI in this version, so the same inputs always
// produce the same answer and the reason shown to the user is the actual rule
// that fired (see docs/goal-planning-scheduling-audit.md).

import type { Task } from "@/lib/tasks"
import type { GoalKeyResult } from "@/lib/goal-key-results"
import type { GoalPlanPhase } from "@/lib/goal-plan-phases"
import { keyResultProgress } from "@/lib/goal-progress"
import { getTaskDateKey } from "@/lib/calendar"
import { isScheduled, taskEffortMinutes } from "@/lib/weekly-capacity"

/** Priority rules, in the order they're evaluated. */
export type NextActionRule =
  | "overdue_high_impact"
  | "at_risk_key_result"
  | "active_phase"
  | "nearest_deadline"
  | "unscheduled_high_impact"
  | "earliest_scheduled"

export const NEXT_ACTION_RULE_REASONS: Record<NextActionRule, string> = {
  overdue_high_impact: "Overdue and high impact — this is holding the goal back.",
  at_risk_key_result: "The key result it feeds is behind where it needs to be.",
  active_phase: "It belongs to the phase you're in right now.",
  nearest_deadline: "It has the closest deadline of anything left.",
  unscheduled_high_impact: "High impact but not on the calendar yet — give it a slot.",
  earliest_scheduled: "It's the next thing on your schedule.",
}

export interface NextBestAction {
  task: Task
  rule: NextActionRule
  reason: string
  effortMinutes: number
  keyResult: GoalKeyResult | null
  phase: GoalPlanPhase | null
  isScheduled: boolean
  isOverdue: boolean
}

export interface NextBestActionInput {
  tasks: Task[]
  keyResults?: GoalKeyResult[]
  phases?: GoalPlanPhase[]
  /** Today as a civil YYYY-MM-DD date — injected so this stays pure. */
  todayYmd: string
}

/** A key result counts as at risk when it's active and under half done. */
const AT_RISK_THRESHOLD = 50

const dueKey = (task: Task): string | null =>
  getTaskDateKey(task.end_date) ?? getTaskDateKey(task.start_date)

// Deterministic tiebreak within a rule: earliest due date, then higher impact,
// then title, then id — never insertion order, which Supabase doesn't promise.
const IMPACT_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

const compareTasks = (a: Task, b: Task): number => {
  const aDue = dueKey(a) ?? "9999-12-31"
  const bDue = dueKey(b) ?? "9999-12-31"
  return (
    aDue.localeCompare(bDue) ||
    (IMPACT_RANK[a.impact_level ?? "medium"] ?? 1) - (IMPACT_RANK[b.impact_level ?? "medium"] ?? 1) ||
    (a.title ?? "").localeCompare(b.title ?? "") ||
    a.id.localeCompare(b.id)
  )
}

const pick = (tasks: Task[]): Task | null =>
  tasks.length === 0 ? null : [...tasks].sort(compareTasks)[0]

/**
 * Selection priority (first rule that matches any task wins):
 *
 * 1. overdue high-impact task
 * 2. task feeding an at-risk key result
 * 3. task in the active phase
 * 4. nearest deadline
 * 5. unscheduled high-impact task
 * 6. earliest scheduled incomplete task
 */
export function selectNextBestAction(input: NextBestActionInput): NextBestAction | null {
  const { todayYmd } = input
  const open = input.tasks.filter((t) => !t.completed)
  if (open.length === 0) return null

  const keyResults = input.keyResults ?? []
  const phases = input.phases ?? []

  const isOverdue = (t: Task) => {
    const due = dueKey(t)
    return due != null && due < todayYmd
  }

  const atRiskKrIds = new Set(
    keyResults
      .filter((kr) => kr.status === "active" && keyResultProgress(kr) < AT_RISK_THRESHOLD)
      .map((kr) => kr.id),
  )
  const activePhaseIds = new Set(phases.filter((p) => p.status === "active").map((p) => p.id))

  const candidates: [NextActionRule, Task | null][] = [
    ["overdue_high_impact", pick(open.filter((t) => t.impact_level === "high" && isOverdue(t)))],
    ["at_risk_key_result", pick(open.filter((t) => t.key_result_id && atRiskKrIds.has(t.key_result_id)))],
    ["active_phase", pick(open.filter((t) => t.phase_id && activePhaseIds.has(t.phase_id)))],
    ["nearest_deadline", pick(open.filter((t) => dueKey(t) !== null))],
    ["unscheduled_high_impact", pick(open.filter((t) => t.impact_level === "high" && !isScheduled(t)))],
    ["earliest_scheduled", pick(open.filter(isScheduled))],
  ]

  let chosen: [NextActionRule, Task] | null = null
  for (const [rule, task] of candidates) {
    if (task) {
      chosen = [rule, task]
      break
    }
  }
  // Every rule missed (e.g. a single undated, untimed task) — still give the
  // user something to do rather than an empty card.
  if (!chosen) chosen = ["earliest_scheduled", pick(open)!]

  const [rule, task] = chosen
  return {
    task,
    rule,
    reason: NEXT_ACTION_RULE_REASONS[rule],
    effortMinutes: taskEffortMinutes(task),
    keyResult: keyResults.find((kr) => kr.id === task.key_result_id) ?? null,
    phase: phases.find((p) => p.id === task.phase_id) ?? null,
    isScheduled: isScheduled(task),
    isOverdue: isOverdue(task),
  }
}
