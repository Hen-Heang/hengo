// Pure mastery-update algorithm shared by every feature that records a
// kori_skill_events row (chat corrections, vocab/correction SRS grading,
// listening quizzes, scenario/interview evaluation). One attempt should
// never be treated as proof of mastery, and early evidence should move the
// score faster than a well-established skill with a long history.

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type MasteryDifficulty = "easy" | "medium" | "hard"

export interface MasteryUpdateInput {
  /** 0-100 mastery before this attempt. */
  currentMastery: number
  /** 0-100 score for this single attempt. */
  attemptScore: number
  /** Number of prior attempts recorded for this skill (0 for the first ever). */
  attemptCount: number
  /** 0-1 confidence in this attempt's score (e.g. AI grading confidence). Defaults to 1. */
  confidence?: number | null
  difficulty?: MasteryDifficulty | null
}

// How much a single new attempt should move the running mastery score.
// Fresh skills (little evidence) move fast so mastery isn't stuck near 0
// after one good attempt; well-evidenced skills settle toward the spec's
// baseline 75/25 current/attempt split.
function baseEvidenceWeight(attemptCount: number): number {
  if (attemptCount <= 0) return 0.6
  if (attemptCount < 3) return 0.4
  return 0.25
}

/** Updated 0-100 mastery score after one new attempt. */
export function calculateUpdatedMastery(input: MasteryUpdateInput): number {
  const currentMastery = clamp(input.currentMastery, 0, 100)
  const attemptScore = clamp(input.attemptScore, 0, 100)
  const confidence = input.confidence == null ? 1 : clamp(input.confidence, 0, 1)
  // Harder evidence should move the score more (succeeding at something hard
  // proves more); easier evidence should move it less.
  const difficultyFactor = input.difficulty === "hard" ? 1.2 : input.difficulty === "easy" ? 0.8 : 1

  const weight = clamp(baseEvidenceWeight(input.attemptCount) * difficultyFactor * confidence, 0.05, 0.9)

  const next = currentMastery * (1 - weight) + attemptScore * weight
  return Math.round(clamp(next, 0, 100))
}
