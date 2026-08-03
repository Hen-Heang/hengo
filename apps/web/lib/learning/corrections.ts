import { applyRating, type SrsCardState } from "@/lib/srs"

// Pure "what should we write to kori_corrections" decision for a mistake that
// was just detected (chat turn analysis or manual check). Keeps the actual
// Supabase read/write in lib/api so this stays unit-testable.

export interface ExistingCorrectionState extends SrsCardState {
  occurrenceCount: number
  nextReviewDate: string // ISO
}

export interface CorrectionUpsertMistake {
  severity: "minor" | "important"
}

export interface CorrectionUpsertState extends SrsCardState {
  nextReviewDate: string
}

export type CorrectionUpsertPlan =
  | { action: "insert"; occurrenceCount: number; state: CorrectionUpsertState }
  | { action: "update"; occurrenceCount: number; state: CorrectionUpsertState }

// How soon a repeated-but-minor mistake should resurface, so it doesn't wait
// out whatever long interval the card had already earned.
const SOON_DAYS = 3

/**
 * Decides how to persist one detected mistake:
 *  - Brand new mistake → fresh SRS card, due immediately.
 *  - Repeated + important (e.g. a workplace politeness error recurring) →
 *    treated like an SRS "AGAIN": mastery drops, a lapse is recorded, the
 *    card resets toward the front of the queue.
 *  - Repeated + minor → occurrence_count/last_seen_at still update, but the
 *    existing mastery/ease/lapses are preserved (no punishing a mostly-
 *    mastered card over a small repeat); the review date is only pulled
 *    closer if it was going to wait longer than a few days anyway.
 */
export function planCorrectionUpsert(
  existing: ExistingCorrectionState | null,
  mistake: CorrectionUpsertMistake,
  now: Date = new Date(),
): CorrectionUpsertPlan {
  if (!existing) {
    return {
      action: "insert",
      occurrenceCount: 1,
      state: {
        mastery: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        nextReviewDate: now.toISOString(),
      },
    }
  }

  const occurrenceCount = existing.occurrenceCount + 1

  if (mistake.severity === "important") {
    const next = applyRating(existing, "AGAIN")
    return {
      action: "update",
      occurrenceCount,
      state: {
        mastery: next.mastery,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        nextReviewDate: next.nextReview,
      },
    }
  }

  const soonest = new Date(now)
  soonest.setDate(soonest.getDate() + SOON_DAYS)
  const currentNext = new Date(existing.nextReviewDate)
  const nextReviewDate = (currentNext < soonest ? currentNext : soonest).toISOString()

  return {
    action: "update",
    occurrenceCount,
    state: {
      mastery: existing.mastery,
      easeFactor: existing.easeFactor,
      intervalDays: existing.intervalDays,
      repetitions: existing.repetitions,
      lapses: existing.lapses,
      nextReviewDate,
    },
  }
}
