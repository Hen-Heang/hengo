// Decides — for one analyzed learner voice turn — whether to surface a live
// correction, defer it to the post-session report, or drop it, according to the
// session's correction policy. Pure and side-effect-free so the decision logic
// is unit tested without the realtime session.

import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

export type CorrectionPolicy = "fluency" | "balanced" | "accuracy"

export const CORRECTION_POLICIES: readonly CorrectionPolicy[] = [
  "fluency",
  "balanced",
  "accuracy",
] as const

export const DEFAULT_CORRECTION_POLICY: CorrectionPolicy = "balanced"

// "balanced" shows at most one live correction every few learner turns, so the
// conversation isn't interrupted on every mistake.
export const BALANCED_COOLDOWN_TURNS = 3

export function normalizeCorrectionPolicy(value: unknown): CorrectionPolicy {
  return typeof value === "string" && (CORRECTION_POLICIES as readonly string[]).includes(value)
    ? (value as CorrectionPolicy)
    : DEFAULT_CORRECTION_POLICY
}

export interface CorrectionPolicyState {
  // Count of eligible learner turns analyzed so far this session.
  userTurnIndex: number
  // The userTurnIndex at which the last live correction was shown.
  lastShownAtTurn: number | null
}

export function initialCorrectionState(): CorrectionPolicyState {
  return { userTurnIndex: 0, lastShownAtTurn: null }
}

export function hasImportantMistake(analysis: TurnAnalysis): boolean {
  return analysis.hasErrors && analysis.mistakes.some((mistake) => mistake.severity === "important")
}

export function hasAnyMistake(analysis: TurnAnalysis): boolean {
  return analysis.hasErrors && analysis.mistakes.length > 0
}

// The single most useful mistake to surface live: the first important one, or
// (failing that) the first mistake at all.
export function pickPrimaryMistake(analysis: TurnAnalysis): TurnAnalysis["mistakes"][number] | null {
  if (!hasAnyMistake(analysis)) return null
  return analysis.mistakes.find((mistake) => mistake.severity === "important") ?? analysis.mistakes[0]
}

export interface CorrectionDecision {
  // Show a compact, non-disruptive correction notice during the live session.
  show: boolean
  // Keep this analysis for the end-of-session report (every real mistake is
  // collected regardless of policy).
  collect: boolean
  hasImportant: boolean
}

/** Decides what to do with one turn's analysis. `state.userTurnIndex` is
 *  expected to already reflect the current turn (increment before calling). The
 *  caller updates `lastShownAtTurn` to `userTurnIndex` when `show` is true. */
export function decideCorrection(params: {
  policy: CorrectionPolicy
  analysis: TurnAnalysis
  state: CorrectionPolicyState
}): CorrectionDecision {
  const important = hasImportantMistake(params.analysis)
  const collect = hasAnyMistake(params.analysis)

  let show = false
  if (params.policy === "accuracy") {
    show = important
  } else if (params.policy === "balanced") {
    const { userTurnIndex, lastShownAtTurn } = params.state
    const cooldownElapsed =
      lastShownAtTurn === null || userTurnIndex - lastShownAtTurn >= BALANCED_COOLDOWN_TURNS
    show = important && cooldownElapsed
  }
  // "fluency" never shows live corrections — only collects for the report.

  return { show, collect, hasImportant: important }
}
