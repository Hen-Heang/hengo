import type { SupabaseClient } from "@supabase/supabase-js"
import { createCorrectionFingerprint } from "@/lib/learning/korean-text"
import { planCorrectionUpsert, type ExistingCorrectionState } from "@/lib/learning/corrections"
import { calculateUpdatedMastery } from "@/lib/learning/mastery"
import { skillForCorrectionCategory } from "@/lib/learning/skills"
import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

// Server-side (per-request, RLS-scoped `db` client) persistence for mistakes
// detected by chat turn analysis or the manual correction checker. Each
// mistake becomes (or updates) one kori_corrections SRS card, deduped by
// fingerprint, plus one kori_skill_events row recording it as negative
// evidence for the relevant skill. Never throws — a persistence failure here
// must not fail the chat turn that produced the analysis.

type MistakeInput = TurnAnalysis["mistakes"][number]

export interface PersistTurnMistakesParams {
  db: SupabaseClient
  userId: string
  sourceFeature: string
  sourceId: string | null
  mistakes: MistakeInput[]
  naturalVersion?: string | null
}

// Negative-evidence scores for skill mastery: a repeated important mistake
// should hurt more than a minor one, but neither should crater the score in
// one event (the mastery algorithm's weighting already limits single-event
// swings).
const SCORE_FOR_SEVERITY: Record<MistakeInput["severity"], number> = {
  important: 20,
  minor: 55,
}

async function persistOneMistake(params: {
  db: SupabaseClient
  userId: string
  sourceFeature: string
  sourceId: string | null
  mistake: MistakeInput
  naturalVersion: string | null
}): Promise<void> {
  const { db, userId, sourceFeature, sourceId, mistake, naturalVersion } = params
  const fingerprint = createCorrectionFingerprint({
    originalText: mistake.original,
    correctedText: mistake.corrected,
    category: mistake.category,
  })

  const { data: existingRow } = await db
    .from("kori_corrections")
    .select("mastery, ease_factor, interval_days, repetitions, lapses, occurrence_count, next_review_date")
    .eq("user_id", userId)
    .eq("fingerprint", fingerprint)
    .maybeSingle()

  const existing: ExistingCorrectionState | null = existingRow
    ? {
        mastery: existingRow.mastery,
        easeFactor: existingRow.ease_factor,
        intervalDays: existingRow.interval_days,
        repetitions: existingRow.repetitions,
        lapses: existingRow.lapses,
        occurrenceCount: existingRow.occurrence_count,
        nextReviewDate: existingRow.next_review_date,
      }
    : null

  const plan = planCorrectionUpsert(existing, { severity: mistake.severity })

  const row = {
    user_id: userId,
    original_text: mistake.original,
    corrected_text: mistake.corrected,
    explanation: mistake.explanation,
    grammar_points: mistake.grammarPoint ? [mistake.grammarPoint] : [],
    mastery: plan.state.mastery,
    next_review_date: plan.state.nextReviewDate,
    ease_factor: plan.state.easeFactor,
    interval_days: plan.state.intervalDays,
    repetitions: plan.state.repetitions,
    lapses: plan.state.lapses,
    source_feature: sourceFeature,
    source_id: sourceId,
    error_category: mistake.category,
    severity: mistake.severity,
    natural_version: naturalVersion,
    fingerprint,
    occurrence_count: plan.occurrenceCount,
    last_seen_at: new Date().toISOString(),
  }

  if (plan.action === "insert") {
    const { error } = await db.from("kori_corrections").insert(row)
    if (error) throw error
  } else {
    const { error } = await db
      .from("kori_corrections")
      .update(row)
      .eq("user_id", userId)
      .eq("fingerprint", fingerprint)
    if (error) throw error
  }

  const skillCode = skillForCorrectionCategory(mistake.category)
  const { data: masteryRow } = await db
    .from("kori_skill_mastery")
    .select("mastery_score, attempt_count")
    .eq("user_id", userId)
    .eq("skill_code", skillCode)
    .maybeSingle()
  const currentMastery = masteryRow?.mastery_score ?? 0
  const attemptCount = masteryRow?.attempt_count ?? 0
  const score = SCORE_FOR_SEVERITY[mistake.severity]
  const newMastery = calculateUpdatedMastery({ currentMastery, attemptScore: score, attemptCount })

  const { error: rpcError } = await db.rpc("kori_record_skill_event", {
    p_skill_code: skillCode,
    p_source_feature: sourceFeature,
    p_new_mastery: newMastery,
    p_new_attempt_count: attemptCount + 1,
    p_score: score,
    p_source_id: sourceId,
    p_confidence: null,
    p_difficulty: null,
    p_metadata: {},
  })
  if (rpcError) throw rpcError
}

export async function persistTurnMistakes(params: PersistTurnMistakesParams): Promise<void> {
  for (const mistake of params.mistakes) {
    try {
      await persistOneMistake({
        db: params.db,
        userId: params.userId,
        sourceFeature: params.sourceFeature,
        sourceId: params.sourceId,
        mistake,
        naturalVersion: params.naturalVersion ?? null,
      })
    } catch (err) {
      console.error(
        "[turn-analysis] failed to persist mistake:",
        mistake.category,
        err instanceof Error ? err.message : "unknown error",
      )
    }
  }
}
