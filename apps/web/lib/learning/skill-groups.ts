import { SKILL_TAXONOMY, type SkillCode } from "./skills"

// Deterministic presentation grouping for Study's "Your Korean" summary.
// kori_skill_mastery tracks more granular skill codes than a learner needs
// to see at a glance — this collapses them into five familiar buckets
// without touching the underlying events/scores at all.

export type StudyGroupId = "speaking" | "listening" | "vocabulary" | "grammar" | "reading"

export const STUDY_GROUP_ORDER: StudyGroupId[] = [
  "speaking",
  "listening",
  "vocabulary",
  "grammar",
  "reading",
]

export const STUDY_GROUP_LABELS: Record<StudyGroupId, string> = {
  speaking: "Speaking",
  listening: "Listening",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
}

// "communication" (politeness, clarification, status updates, task
// completion) is folded into Speaking — it's spoken-interaction quality, not
// a distinct skill a learner thinks of separately. "interview" is excluded
// entirely: exam-prep skills are gated behind an active exam window
// (isExamActive in lib/study-plan.ts) and would misrepresent everyday
// progress if blended into the general summary.
const GROUP_FOR_SKILL: Record<SkillCode, StudyGroupId | null> = Object.fromEntries(
  Object.values(SKILL_TAXONOMY).map((def) => {
    const group: StudyGroupId | null =
      def.category === "grammar"
        ? "grammar"
        : def.category === "communication" || def.category === "speaking"
          ? "speaking"
          : def.category === "vocabulary"
            ? "vocabulary"
            : def.category === "listening"
              ? "listening"
              : def.category === "reading"
                ? "reading"
                : null
    return [def.code, group]
  }),
) as Record<SkillCode, StudyGroupId | null>

export interface SkillMasteryInput {
  skillCode: SkillCode
  masteryScore: number
  attemptCount: number
}

export interface StudyGroupSummary {
  id: StudyGroupId
  label: string
  /** Average mastery across this group's attempted skills, 0-100. */
  masteryPercent: number
  /** Whether at least one skill in this group has real practice evidence. */
  hasEvidence: boolean
}

/**
 * Averages mastery per display group, counting only skills with at least
 * one real attempt — an unpracticed skill code neither drags the average
 * down nor fakes a starting percentage. A group with no practiced skills at
 * all reports `hasEvidence: false` rather than a fabricated 0%.
 */
export function summarizeStudyGroups(mastery: SkillMasteryInput[]): StudyGroupSummary[] {
  const totals = new Map<StudyGroupId, { sum: number; count: number }>(
    STUDY_GROUP_ORDER.map((id) => [id, { sum: 0, count: 0 }]),
  )

  for (const entry of mastery) {
    if (entry.attemptCount <= 0) continue
    const group = GROUP_FOR_SKILL[entry.skillCode]
    if (!group) continue
    const bucket = totals.get(group)!
    bucket.sum += entry.masteryScore
    bucket.count += 1
  }

  return STUDY_GROUP_ORDER.map((id) => {
    const bucket = totals.get(id)!
    return {
      id,
      label: STUDY_GROUP_LABELS[id],
      masteryPercent: bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0,
      hasEvidence: bucket.count > 0,
    }
  })
}
