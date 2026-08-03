// History of mock-interview scorecards, so the candidate can see their
// trajectory across the four exam criteria over time. localStorage is the
// always-available write-through store; finished attempts are ALSO persisted
// to Supabase (kori_interview_attempts, see lib/api/interview.ts) under the
// same client-generated id, and reads merge the two deduped by id — so old
// local-only records keep displaying and remote history syncs across devices.

import type { EvaluationScore, InterviewEvaluation } from "./interview"
import type { InterviewAttempt } from "./api/interview"

const STORAGE_KEY = "koriai-interview-scorecards"
const MAX_RECORDS = 50

export interface ScorecardRecord {
  id: string
  /** ISO timestamp of when the mock was scored. */
  date: string
  /** Average of the criteria, normalised to a 0–5 scale. */
  overall: number
  scores: EvaluationScore[]
  /** Interview mode; absent on records from before modes existed. */
  mode?: string
}

/** Average of the scores normalised to 0–5, rounded to one decimal. */
export function computeOverall(scores: EvaluationScore[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, s) => acc + (s.score / s.max) * 5, 0)
  return Math.round((sum / scores.length) * 10) / 10
}

/**
 * Pure: append a scorecard for `evaluation` to `history`, capping to the most
 * recent MAX_RECORDS. Returns `history` unchanged when there are no scores.
 * Pass `id` to share the record id with the Supabase attempt row (dedupe key).
 */
export function appendScorecard(
  history: ScorecardRecord[],
  evaluation: InterviewEvaluation,
  now: Date = new Date(),
  id?: string,
  mode?: string
): ScorecardRecord[] {
  if (evaluation.scores.length === 0) return history
  const record: ScorecardRecord = {
    id:
      id ??
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sc-${now.getTime()}`),
    date: now.toISOString(),
    overall: computeOverall(evaluation.scores),
    scores: evaluation.scores,
    ...(mode ? { mode } : {}),
  }
  return [...history, record].slice(-MAX_RECORDS)
}

export function loadScorecards(): ScorecardRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ScorecardRecord[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Append the evaluation to the stored history and persist it. Returns the
 * updated list so callers can update state without a re-read.
 */
export function saveScorecard(
  evaluation: InterviewEvaluation,
  now: Date = new Date(),
  id?: string,
  mode?: string
): ScorecardRecord[] {
  const next = appendScorecard(loadScorecards(), evaluation, now, id, mode)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore quota / private-mode failures — the in-memory list still updates.
  }
  return next
}

/** Maps a Supabase attempt row into the scorecard shape the trend consumes. */
export function toScorecardRecord(attempt: InterviewAttempt): ScorecardRecord {
  return {
    id: attempt.id,
    date: attempt.createdAt,
    overall: attempt.overall,
    scores: attempt.scores,
    mode: attempt.mode,
  }
}

/**
 * Pure: merge local and remote scorecards, deduped by id (remote wins — it's
 * the durable copy), sorted oldest-first, capped to MAX_RECORDS. Local-only
 * records (from before Supabase persistence) always survive.
 */
export function mergeScorecards(
  local: ScorecardRecord[],
  remote: ScorecardRecord[]
): ScorecardRecord[] {
  const byId = new Map<string, ScorecardRecord>()
  for (const record of local) byId.set(record.id, record)
  for (const record of remote) byId.set(record.id, record)
  return [...byId.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_RECORDS)
}
