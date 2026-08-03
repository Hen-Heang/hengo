// Multi-signal level-up recommendation. Vocabulary-count-and-mastery alone
// used to decide this; now every category needs real, recent evidence before
// an upgrade is even offered, and the reason always names actual evidence
// (or what's missing) instead of a generic "keep studying" message.

export const LEVEL_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const
export type KoreanLevel = (typeof LEVEL_ORDER)[number]

export interface CategoryEvidence {
  attempts: number
  /** 0-100 */
  averageScore: number
}

const CATEGORY_KEYS = ["vocabulary", "grammar", "listening", "speaking", "workplaceCommunication"] as const
type CategoryKey = (typeof CATEGORY_KEYS)[number]

export interface LevelEvidenceInput extends Record<CategoryKey, CategoryEvidence> {
  currentLevel: string
}

export interface LevelRecommendation {
  currentLevel: string
  suggestedLevel: string | null
  upgradeAvailable: boolean
  weightedScore: number
  reason: string
  missingEvidence: string[]
}

const WEIGHTS: Record<CategoryKey, number> = {
  vocabulary: 0.25,
  grammar: 0.2,
  listening: 0.2,
  speaking: 0.2,
  workplaceCommunication: 0.15,
}

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  vocabulary: "vocabulary",
  grammar: "grammar",
  listening: "listening",
  speaking: "speaking",
  workplaceCommunication: "workplace communication",
}

// Minimum evidence required before an upgrade is even considered.
const MIN_TOTAL_ATTEMPTS = 30
const MIN_ATTEMPTS_PER_CATEGORY = 5
const MIN_CATEGORIES_WITH_ENOUGH_ATTEMPTS = 3
// A category this far below the passing bar blocks an upgrade even if the
// weighted average looks fine — no single major weakness gets averaged away.
const MIN_CATEGORY_SCORE_FLOOR = 40
const UPGRADE_SCORE_THRESHOLD = 65

function normalizeLevel(level: string): KoreanLevel | null {
  const upper = level.toUpperCase()
  return (LEVEL_ORDER as readonly string[]).includes(upper) ? (upper as KoreanLevel) : null
}

/** Evidence-based next-level suggestion. Never suggests a downgrade — the
 *  worst outcome is simply no suggestion (suggestedLevel: null). The
 *  learner must still manually accept any suggested upgrade. */
export function recommendLevel(input: LevelEvidenceInput): LevelRecommendation {
  const totalAttempts = CATEGORY_KEYS.reduce((sum, k) => sum + input[k].attempts, 0)
  const categoriesWithEnough = CATEGORY_KEYS.filter((k) => input[k].attempts >= MIN_ATTEMPTS_PER_CATEGORY)
  const weightedScore = Math.round(
    CATEGORY_KEYS.reduce((sum, k) => sum + input[k].averageScore * WEIGHTS[k], 0),
  )
  const weakCategories = CATEGORY_KEYS.filter(
    (k) => input[k].attempts > 0 && input[k].averageScore < MIN_CATEGORY_SCORE_FLOOR,
  )

  const currentLevel = normalizeLevel(input.currentLevel) ?? "BEGINNER"
  const idx = LEVEL_ORDER.indexOf(currentLevel)
  const canUpgrade = idx >= 0 && idx < LEVEL_ORDER.length - 1
  const nextLevel = canUpgrade ? LEVEL_ORDER[idx + 1] : null

  const missingEvidence: string[] = []
  if (totalAttempts < MIN_TOTAL_ATTEMPTS) {
    missingEvidence.push(`${MIN_TOTAL_ATTEMPTS - totalAttempts} more total practice attempts`)
  }
  if (categoriesWithEnough.length < MIN_CATEGORIES_WITH_ENOUGH_ATTEMPTS) {
    const short = CATEGORY_KEYS.filter((k) => input[k].attempts < MIN_ATTEMPTS_PER_CATEGORY)
    if (short.length > 0) missingEvidence.push(`more attempts in ${short.map((k) => CATEGORY_LABEL[k]).join(", ")}`)
  }
  if (weakCategories.length > 0) {
    missingEvidence.push(`stronger ${weakCategories.map((k) => CATEGORY_LABEL[k]).join(", ")} performance`)
  }

  const hasEnoughEvidence =
    totalAttempts >= MIN_TOTAL_ATTEMPTS &&
    categoriesWithEnough.length >= MIN_CATEGORIES_WITH_ENOUGH_ATTEMPTS &&
    weakCategories.length === 0

  const qualifies = canUpgrade && hasEnoughEvidence && weightedScore >= UPGRADE_SCORE_THRESHOLD

  let reason: string
  if (!canUpgrade) {
    reason = "You're already at the highest level."
  } else if (qualifies && nextLevel) {
    const strongest = [...CATEGORY_KEYS].sort((a, b) => input[b].averageScore - input[a].averageScore).slice(0, 2)
    reason = `Your ${strongest.map((k) => CATEGORY_LABEL[k]).join(" and ")} are ready for ${nextLevel} (weighted score ${weightedScore}/100).`
  } else if (missingEvidence.length > 0) {
    reason = `Complete ${missingEvidence.join(" and ")} before upgrading to ${nextLevel}.`
  } else {
    reason = `Your weighted score is ${weightedScore}/100 — a bit more consistent practice before ${nextLevel}.`
  }

  return {
    currentLevel: input.currentLevel,
    suggestedLevel: qualifies ? nextLevel : null,
    upgradeAvailable: qualifies,
    weightedScore,
    reason,
    missingEvidence,
  }
}
