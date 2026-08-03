// Pure goal-progress engine (Goal System v2 — see docs/goal-system-v2-audit.md).
//
// Today the app computes "progress" as done/total tasks — a goal can show
// 100% with the real-world outcome nowhere near achieved. This module
// replaces that with two clearly separated numbers:
//   - outcomeProgress: weighted average of key-result progress (the real
//     measure of whether the goal's outcome is being achieved), or null when
//     the goal has no key results yet.
//   - activityProgress: the old done/total task percentage, kept as a
//     labeled "legacy activity" fallback so pre-v2 goals still show
//     something meaningful.
// No I/O, no Supabase, no React — everything here is a pure function over
// plain data so it can be unit tested and reused by both the goal list and
// goal detail pages.
import type { GoalKeyResult } from "@/lib/goal-key-results"

export const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

type ProgressInputKeyResult = Pick<
  GoalKeyResult,
  "metric_type" | "baseline_value" | "current_value" | "target_value" | "weight" | "status"
>

/**
 * Progress (0–100) for a single key result.
 *
 * - `boolean` metrics ignore baseline/target: current_value truthy → 100, else 0.
 * - Every other metric type is baseline→target interpolation: missing baseline
 *   defaults to 0 (a "zero baseline" is a real, common case — starting from
 *   scratch — not the same as a *missing* one); a missing target_value means
 *   "no defined success point yet", so progress is 0 rather than guessed.
 * - baseline === target is a degenerate range (nothing to interpolate over):
 *   treated as done (100) once current reaches/exceeds it, else 0.
 * - Values past the target clamp to 100 (over-target), values below baseline
 *   clamp to 0 — the result is always in [0, 100].
 */
export const keyResultProgress = (kr: ProgressInputKeyResult): number => {
  if (kr.metric_type === "boolean") {
    return kr.current_value ? 100 : 0
  }
  if (kr.target_value == null) return 0

  const baseline = kr.baseline_value ?? 0
  const current = kr.current_value ?? baseline
  const target = kr.target_value

  if (target === baseline) {
    return current >= target ? 100 : 0
  }

  // Rounded to a whole percent — this is a display value (progress bars,
  // "62%" labels), not an intermediate used for further precise math.
  return Math.round(clampPercent(((current - baseline) / (target - baseline)) * 100))
}

/**
 * Weighted average progress across a goal's key results, or `null` if there
 * are none — callers must treat `null` as "no outcome data yet", never as 0%.
 * Archived key results are excluded entirely (neither numerator nor weight).
 */
export const weightedKeyResultProgress = (keyResults: ProgressInputKeyResult[]): number | null => {
  const active = keyResults.filter((kr) => kr.status !== "archived")
  if (active.length === 0) return null

  const totalWeight = active.reduce((sum, kr) => sum + Math.max(0, kr.weight), 0)
  if (totalWeight <= 0) return null

  const weightedSum = active.reduce(
    (sum, kr) => sum + keyResultProgress(kr) * Math.max(0, kr.weight),
    0,
  )
  // Rounded for the same reason as keyResultProgress above — this is the
  // number shown directly in the UI (goal card/hero "X% outcome progress").
  return Math.round(clampPercent(weightedSum / totalWeight))
}

export interface LegacyActivityProgress {
  total: number
  completed: number
  /** Labeled "legacy" deliberately — this is task-count activity, not outcome progress. */
  percentage: number
}

/** The old done/total task math, kept as a clearly-separate activity metric. */
export const legacyActivityProgress = (
  taskCounts?: { total: number; completed: number } | null,
): LegacyActivityProgress => {
  const total = taskCounts?.total ?? 0
  const completed = taskCounts?.completed ?? 0
  const percentage = total > 0 ? clampPercent(Math.round((completed / total) * 100)) : 0
  return { total, completed, percentage }
}

export interface GoalProgress {
  /** False when every key result is archived or the goal has none at all. */
  hasActiveKeyResults: boolean
  /** Weighted key-result progress, or null when there's no outcome data. */
  outcomeProgress: number | null
  /** Always present — the legacy done/total task percentage. */
  activityProgress: LegacyActivityProgress
}

export const computeGoalProgress = (
  taskCounts: { total: number; completed: number } | null | undefined,
  keyResults: ProgressInputKeyResult[],
): GoalProgress => {
  const active = keyResults.filter((kr) => kr.status !== "archived")
  return {
    hasActiveKeyResults: active.length > 0,
    outcomeProgress: weightedKeyResultProgress(keyResults),
    activityProgress: legacyActivityProgress(taskCounts),
  }
}

/**
 * Informational only: whether every active key result has reached its target
 * or been explicitly marked achieved. This never auto-completes a goal by
 * itself — completion always requires the user to confirm (rule 5 of the
 * progress spec) — callers use it only to decide whether to *offer* a
 * "mark complete" action.
 */
export const allKeyResultsAchieved = (keyResults: ProgressInputKeyResult[]): boolean => {
  const active = keyResults.filter((kr) => kr.status !== "archived")
  if (active.length === 0) return false
  return active.every((kr) => kr.status === "achieved" || keyResultProgress(kr) >= 100)
}
