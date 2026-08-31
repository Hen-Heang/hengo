import { skillLabel, skillsForListeningTopic, skillsForScenarioCategory, type SkillCode } from "@/lib/learning/skills"

// Deterministic daily-mission selection. No Math.random anywhere — the same
// MissionContext always produces the same DailyMissionPlan, which is what
// lets lib/api/missions.ts persist one mission per (user, dateKey) and have
// it survive a page refresh untouched. Any tie-breaking needed among equally
// good candidates uses a stable hash of dateKey instead of randomness.

export type MissionItemType =
  | "vocab_review"
  | "correction_review"
  | "daily_phrase"
  | "scenario"
  | "listening"
  | "interview"
  | "phrase_review"

export interface DueVocabularyItem {
  id: string
  term: string
  meaning: string
}

export interface DueCorrectionItem {
  id: string
  originalText: string
  correctedText: string
}

export interface DuePhraseItem {
  id: string
  category: string
}

export interface SkillMasterySummary {
  skillCode: SkillCode
  masteryScore: number
}

export interface ScenarioCandidate {
  id: string
  title: string
  category: string
}

export interface ListeningCandidate {
  topic: string
}

export interface MissionContext {
  dateKey: string
  koreanLevel: string
  learningGoal: string | null
  availableMinutes: number
  dueVocabulary: DueVocabularyItem[]
  dueVocabularyCount: number
  dueCorrections: DueCorrectionItem[]
  dueCorrectionsCount: number
  duePhrases: DuePhraseItem[]
  duePhrasesCount: number
  weakSkills: SkillMasterySummary[]
  recentFeatures: string[]
  recentTopics: string[]
  upcomingExam: { date: string; type: string } | null
  availableScenarios: ScenarioCandidate[]
  availableListeningTopics: ListeningCandidate[]
  dailyPhraseLearned: boolean
}

export interface DailyMissionItemPlan {
  type: MissionItemType
  title: string
  reason: string
  targetCount: number
  referenceIds: string[]
  skillCodes: SkillCode[]
  estimatedMinutes: number
}

export interface DailyMissionPlan {
  dateKey: string
  title: string
  reason: string
  estimatedMinutes: number
  focusSkillCodes: SkillCode[]
  items: DailyMissionItemPlan[]
}

// Stable, seedable pick among equally-ranked candidates — replaces
// Math.random() with something that's the same every time for a given date.
function stableIndex(seed: string, length: number): number {
  if (length <= 0) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash % length
}

function stablePick<T>(items: T[], seed: string): T | null {
  if (items.length === 0) return null
  return items[stableIndex(seed, items.length)]
}

function activityTypeForSkillCategory(code: SkillCode): MissionItemType {
  if (code.startsWith("vocabulary.")) return "vocab_review"
  if (code.startsWith("grammar.") || code.startsWith("communication.")) return "correction_review"
  if (code.startsWith("listening.")) return "listening"
  if (code.startsWith("speaking.")) return "scenario"
  if (code.startsWith("interview.")) return "interview"
  return "scenario"
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

interface Candidate {
  weight: number
  item: DailyMissionItemPlan
}

function buildVocabCandidate(ctx: MissionContext, weight: number): Candidate | null {
  if (ctx.dueVocabularyCount <= 0) return null
  const targetCount = Math.min(ctx.dueVocabularyCount, 20)
  return {
    weight,
    item: {
      type: "vocab_review",
      title: `Review ${plural(ctx.dueVocabularyCount, "vocabulary card")}`,
      reason: `${plural(ctx.dueVocabularyCount, "word")} you saved earlier came due for review today.`,
      targetCount,
      referenceIds: ctx.dueVocabulary.slice(0, targetCount).map((v) => v.id),
      skillCodes: [],
      estimatedMinutes: Math.min(15, Math.max(5, Math.ceil(ctx.dueVocabularyCount / 2))),
    },
  }
}

function buildCorrectionCandidate(ctx: MissionContext, weight: number): Candidate | null {
  if (ctx.dueCorrectionsCount <= 0) return null
  const targetCount = Math.min(ctx.dueCorrectionsCount, 20)
  return {
    weight,
    item: {
      type: "correction_review",
      title: `Clear ${plural(ctx.dueCorrectionsCount, "repeated mistake")}`,
      reason: `${plural(ctx.dueCorrectionsCount, "past mistake")} of yours are due to review again — clearing them keeps them from coming back.`,
      targetCount,
      referenceIds: ctx.dueCorrections.slice(0, targetCount).map((c) => c.id),
      skillCodes: [],
      estimatedMinutes: Math.min(15, Math.max(5, Math.ceil(ctx.dueCorrectionsCount / 2))),
    },
  }
}

function buildPhraseCandidate(ctx: MissionContext, weight: number): Candidate | null {
  if (ctx.duePhrasesCount <= 0) return null
  const targetCount = Math.min(ctx.duePhrasesCount, 10)
  return {
    weight,
    item: {
      type: "phrase_review",
      title: `Review ${plural(ctx.duePhrasesCount, "Phrasebook Q&A card")}`,
      reason: `${plural(ctx.duePhrasesCount, "phrase")} you saved earlier came due for review today.`,
      targetCount,
      referenceIds: ctx.duePhrases.slice(0, targetCount).map((p) => p.id),
      skillCodes: [],
      estimatedMinutes: Math.min(15, Math.max(5, Math.ceil(ctx.duePhrasesCount / 2))),
    },
  }
}

function buildScenarioCandidate(ctx: MissionContext, weight: number, reason: string, skillCodes: SkillCode[]): Candidate | null {
  if (ctx.availableScenarios.length === 0) return null
  const scenario = stablePick(ctx.availableScenarios, ctx.dateKey)
  if (!scenario) return null
  return {
    weight,
    item: {
      type: "scenario",
      title: `Practice: ${scenario.title}`,
      reason,
      targetCount: 1,
      referenceIds: [scenario.id],
      skillCodes,
      estimatedMinutes: 10,
    },
  }
}

function buildListeningCandidate(ctx: MissionContext, weight: number, reason: string, skillCodes: SkillCode[]): Candidate | null {
  if (ctx.availableListeningTopics.length === 0) return null
  const topic = stablePick(ctx.availableListeningTopics, ctx.dateKey)
  if (!topic) return null
  return {
    weight,
    item: {
      type: "listening",
      title: `Listening: ${topic.topic}`,
      reason,
      targetCount: 1,
      referenceIds: [topic.topic],
      skillCodes,
      estimatedMinutes: 10,
    },
  }
}

function buildInterviewCandidate(weight: number, reason: string, skillCodes: SkillCode[]): Candidate {
  return {
    weight,
    item: {
      type: "interview",
      title: "Mock interview practice",
      reason,
      targetCount: 1,
      referenceIds: [],
      skillCodes,
      estimatedMinutes: 15,
    },
  }
}

function buildWeaknessCandidate(ctx: MissionContext, alreadyPresent: Set<MissionItemType>): Candidate | null {
  const weakest = ctx.weakSkills[0]
  if (!weakest) return null
  const type = activityTypeForSkillCategory(weakest.skillCode)
  // Already covered by a due-SRS item — don't add a duplicate item type, the
  // caller instead folds the weak-skill tag onto the existing candidate.
  if (alreadyPresent.has(type)) return null

  const reason = `Your ${skillLabel(weakest.skillCode)} skill is at ${Math.round(weakest.masteryScore)}% mastery — this practices it directly.`
  if (type === "listening") return buildListeningCandidate(ctx, 0.3, reason, [weakest.skillCode])
  if (type === "interview") {
    // Only steer toward mock-interview practice when there's a real exam to
    // prep for — otherwise fall back to general speaking practice, which
    // exercises the same underlying skill without implying an exam exists.
    if (!ctx.upcomingExam) return buildScenarioCandidate(ctx, 0.3, reason, [weakest.skillCode])
    return buildInterviewCandidate(0.3, reason, [weakest.skillCode])
  }
  return buildScenarioCandidate(ctx, 0.3, reason, [weakest.skillCode])
}

function buildGoalCandidate(ctx: MissionContext, alreadyPresent: Set<MissionItemType>): Candidate | null {
  if (ctx.upcomingExam) {
    if (alreadyPresent.has("interview")) return null
    return buildInterviewCandidate(
      0.2,
      `Your ${ctx.upcomingExam.type} exam is coming up on ${ctx.upcomingExam.date} — keep your interview skills sharp.`,
      ["interview.task_completion"],
    )
  }
  if (ctx.learningGoal) {
    if (alreadyPresent.has("scenario")) return null
    return buildScenarioCandidate(
      ctx,
      0.2,
      `This ties back to your goal: "${ctx.learningGoal}".`,
      [],
    )
  }
  return null
}

const VARIETY_TYPES: MissionItemType[] = ["scenario", "listening", "vocab_review", "correction_review", "interview"]

function buildVarietyCandidate(ctx: MissionContext, alreadyPresent: Set<MissionItemType>): Candidate | null {
  // The type that appears least (or not at all) in recent activity. Interview
  // only enters the rotation when there's a real active exam — otherwise
  // "haven't practiced interview in a while" would make it look neglected
  // for every learner who has simply never taken a mock interview.
  const varietyTypes = ctx.upcomingExam ? VARIETY_TYPES : VARIETY_TYPES.filter((t) => t !== "interview")
  const counts = new Map<MissionItemType, number>()
  for (const type of varietyTypes) counts.set(type, 0)
  for (const feature of ctx.recentFeatures) {
    if (counts.has(feature as MissionItemType)) counts.set(feature as MissionItemType, (counts.get(feature as MissionItemType) ?? 0) + 1)
  }
  const neglected = [...counts.entries()]
    .filter(([type]) => !alreadyPresent.has(type))
    .sort((a, b) => a[1] - b[1])[0]?.[0]

  if (!neglected) return null
  const reason = "You haven't practiced this in a while — a little variety keeps skills balanced."
  if (neglected === "scenario") return buildScenarioCandidate(ctx, 0.1, reason, [])
  if (neglected === "listening") return buildListeningCandidate(ctx, 0.1, reason, [])
  if (neglected === "interview") return buildInterviewCandidate(0.1, reason, [])
  return null
}

/** Deterministically builds today's mission from real evidence — due SRS
 *  work, measured weak skills, the learner's stated goal/exam, and variety
 *  across recently-neglected features. Same input → same output, always. */
export function buildDailyMission(ctx: MissionContext): DailyMissionPlan {
  const candidates: Candidate[] = []
  const totalDue = ctx.dueVocabularyCount + ctx.dueCorrectionsCount + ctx.duePhrasesCount
  const vocabCandidate = buildVocabCandidate(ctx, 0.4 * (ctx.dueVocabularyCount / Math.max(1, totalDue) || 0.34))
  const correctionCandidate = buildCorrectionCandidate(ctx, 0.4 * (ctx.dueCorrectionsCount / Math.max(1, totalDue) || 0.34))
  const phraseCandidate = buildPhraseCandidate(ctx, 0.4 * (ctx.duePhrasesCount / Math.max(1, totalDue) || 0.34))
  if (vocabCandidate) candidates.push(vocabCandidate)
  if (correctionCandidate) candidates.push(correctionCandidate)
  if (phraseCandidate) candidates.push(phraseCandidate)

  const presentTypes = new Set(candidates.map((c) => c.item.type))
  const weaknessCandidate = buildWeaknessCandidate(ctx, presentTypes)
  if (weaknessCandidate) {
    candidates.push(weaknessCandidate)
    presentTypes.add(weaknessCandidate.item.type)
  } else {
    // Weak skill's activity type is already present as a due-SRS item — fold
    // the weak-skill tag + a bumped weight onto it instead of a duplicate.
    const weakest = ctx.weakSkills[0]
    if (weakest) {
      const type = activityTypeForSkillCategory(weakest.skillCode)
      const existing = candidates.find((c) => c.item.type === type)
      if (existing) {
        existing.weight += 0.3
        existing.item.skillCodes = [...new Set([...existing.item.skillCodes, weakest.skillCode])]
      }
    }
  }

  const goalCandidate = buildGoalCandidate(ctx, presentTypes)
  if (goalCandidate) {
    candidates.push(goalCandidate)
    presentTypes.add(goalCandidate.item.type)
  } else {
    const type = ctx.upcomingExam ? "interview" : "scenario"
    const existing = candidates.find((c) => c.item.type === type)
    if (existing) existing.weight += 0.2
  }

  const varietyCandidate = buildVarietyCandidate(ctx, presentTypes)
  if (varietyCandidate) candidates.push(varietyCandidate)

  candidates.sort((a, b) => b.weight - a.weight)

  const items: DailyMissionItemPlan[] = []
  let minutesUsed = 0
  for (const candidate of candidates) {
    if (items.length > 0 && minutesUsed + candidate.item.estimatedMinutes > ctx.availableMinutes) continue
    items.push(candidate.item)
    minutesUsed += candidate.item.estimatedMinutes
  }

  // Always include the daily phrase if it's not learned yet — near-zero cost,
  // high-value daily habit, independent of the weighted buckets above.
  if (!ctx.dailyPhraseLearned) {
    items.push({
      type: "daily_phrase",
      title: "Learn today's phrase",
      reason: "One small, real workplace phrase a day adds up fast.",
      targetCount: 1,
      referenceIds: [],
      skillCodes: [],
      estimatedMinutes: 3,
    })
    minutesUsed += 3
  }

  if (items.length === 0) {
    items.push({
      type: "scenario",
      title: "Free practice",
      reason: "No due reviews today — use the time for open conversation practice.",
      targetCount: 1,
      referenceIds: ctx.availableScenarios.length > 0 ? [ctx.availableScenarios[0].id] : [],
      skillCodes: [],
      estimatedMinutes: 10,
    })
  }

  const focusSkillCodes = [...new Set(items.flatMap((i) => i.skillCodes))].slice(0, 4)
  const primary = items[0]
  const secondaryReason = items[1]?.reason
  const title = items.length > 1 ? `${primary.title} + ${items.length - 1} more` : primary.title
  const reason = secondaryReason ? `${primary.reason} ${secondaryReason}` : primary.reason

  return {
    dateKey: ctx.dateKey,
    title,
    reason,
    estimatedMinutes: items.reduce((sum, i) => sum + i.estimatedMinutes, 0),
    focusSkillCodes,
    items,
  }
}

// Skill-category → activity-type mapping used by weak-skill selection,
// exported for tests and any caller that needs to know how a skill maps to
// a practicable feature (e.g. scenario/listening topic pickers).
export { activityTypeForSkillCategory, skillsForListeningTopic, skillsForScenarioCategory }
