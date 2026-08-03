// Pure logic for the daily drill pages (/interview/speaking and
// /interview/listening): question-queue building over the static pools,
// splice-in of AI-generated questions, speaking-score helpers, and the
// listening difficulty tiers. UI lives in the pages/components; everything
// here is unit-testable with an injectable rng.

import { INTERVIEW_TOPICS, type VocabEntry } from "./interview"
import { UNEXPECTED_QUESTIONS } from "./interview-unexpected"

export const DRILL_SIZE = 5

export interface DrillQuestion {
  ko: string
  en: string
  // Set only for questions sourced from the DB-backed question bank
  // (lib/api/interview.ts listQuestions) — the legacy static pool below has no
  // stable ids, so those questions save full answer history but don't feed
  // per-question progress tracking (see lib/interview-practice.ts).
  id?: string
}

/** A drill question with the listening-reveal extras (from the AI batch). */
export interface EnrichedDrillQuestion extends DrillQuestion {
  glosses: VocabEntry[]
  grammarNote: string
}

/** Every static question available for drills: topic prep + off-topic pool. */
export function staticQuestionPool(): DrillQuestion[] {
  const prepQuestions = (INTERVIEW_TOPICS[0].prep?.sampleQuestions ?? []).map((q) => ({
    ko: q.ko,
    en: q.en,
  }))
  const offTopic = UNEXPECTED_QUESTIONS.map((q) => ({ ko: q.ko, en: q.en }))
  return [...prepQuestions, ...offTopic]
}

/**
 * A shuffled drill queue sampled from the static pool (Fisher–Yates on a
 * copy). Instant and offline-safe; AI-generated questions can replace the
 * unseen tail later. Clamps when `size` exceeds the pool.
 */
export function buildDrillQueue(
  size: number = DRILL_SIZE,
  rng: () => number = Math.random
): DrillQuestion[] {
  const pool = staticQuestionPool()
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, Math.min(size, pool.length)))
}

/** Static fallback for the listening drill: no AI glosses or grammar note. */
export function toFallbackEnriched(q: DrillQuestion): EnrichedDrillQuestion {
  return { ...q, glosses: [], grammarNote: "" }
}

/**
 * Replaces the not-yet-shown tail of a drill queue with freshly generated
 * questions. Items before `nextIndex` (already shown) are never touched; the
 * queue keeps its length cap of nextIndex + fresh (or the original items where
 * fresh runs short).
 */
export function replaceUnseenTail<T>(queue: T[], fresh: T[], nextIndex: number): T[] {
  if (nextIndex >= queue.length || fresh.length === 0) return queue
  const seen = queue.slice(0, nextIndex)
  const tailLength = queue.length - nextIndex
  const tail = fresh.slice(0, tailLength)
  // Fresh batch smaller than the tail — keep the original tail's remainder.
  const remainder = queue.slice(nextIndex + tail.length)
  return [...seen, ...tail, ...remainder]
}

/** 3 random Korean questions used as register/style examples in the AI prompt. */
export function pickStyleExamples(rng: () => number = Math.random): string[] {
  return buildDrillQueue(3, rng).map((q) => q.ko)
}

// ── Speaking drill scores ────────────────────────────────────────────────

export type SpeakingScoreKey =
  | "speaking"
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "confidence"
  | "naturalness"

export const SPEAKING_SCORE_KEYS: SpeakingScoreKey[] = [
  "speaking",
  "grammar",
  "vocabulary",
  "pronunciation",
  "confidence",
  "naturalness",
]

export const SPEAKING_SCORE_LABELS: Record<SpeakingScoreKey, string> = {
  speaking: "Speaking",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  pronunciation: "Pronunciation",
  confidence: "Confidence",
  naturalness: "Naturalness",
}

export type SpeakingScores = Record<SpeakingScoreKey, number>

/** Per-key mean rounded to one decimal; null when there are no results. */
export function averageSpeakingScores(all: SpeakingScores[]): SpeakingScores | null {
  if (all.length === 0) return null
  const sums = {} as SpeakingScores
  for (const key of SPEAKING_SCORE_KEYS) {
    const total = all.reduce((sum, scores) => sum + scores[key], 0)
    sums[key] = Math.round((total / all.length) * 10) / 10
  }
  return sums
}

// ── Listening difficulty tiers ───────────────────────────────────────────
// Same config-object pattern as INTERVIEW_MODES: one flag object drives both
// the generation prompt (complexityHint) and the drill UI.

export type ListeningLevel = "easy" | "medium" | "hard" | "exam"

export interface ListeningLevelConfig {
  id: ListeningLevel
  label: string
  /** One-line pitch shown on the level picker card. */
  description: string
  /** Offer the 0.75× slow replay next to the normal one. */
  allowSlowReplay: boolean
  /** Successful plays allowed per question; null = unlimited. */
  maxPlays: number | null
  /** Include the English translation when the answer is revealed. */
  showEnglishOnReveal: boolean
  /** Injected into the drill-questions prompt to steer difficulty. */
  complexityHint: string
}

export const LISTENING_LEVELS: Record<ListeningLevel, ListeningLevelConfig> = {
  easy: {
    id: "easy",
    label: "Easy",
    description: "Short simple questions — listen as often as you like, slow replay on.",
    allowSlowReplay: true,
    maxPlays: null,
    showEnglishOnReveal: true,
    complexityHint:
      "one short simple sentence (8-12 words), high-frequency everyday vocabulary",
  },
  medium: {
    id: "medium",
    label: "Medium",
    description: "Natural interviewer phrasing, unlimited listens with slow replay.",
    allowSlowReplay: true,
    maxPlays: null,
    showEnglishOnReveal: true,
    complexityHint:
      "natural interviewer phrasing, may include one connective ending (-는데, -지만)",
  },
  hard: {
    id: "hard",
    label: "Hard",
    description: "Longer questions at normal speed only — two listens max.",
    allowSlowReplay: false,
    maxPlays: 2,
    showEnglishOnReveal: true,
    complexityHint:
      "longer question with subordinate clauses and topic-specific vocabulary",
  },
  exam: {
    id: "exam",
    label: "Exam Mode",
    description: "Real conditions: one listen, normal speed, no English anywhere.",
    allowSlowReplay: false,
    maxPlays: 1,
    showEnglishOnReveal: false,
    complexityHint:
      "realistic exam question at natural difficulty, formal interviewer register",
  },
}
