import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import { calculateUpdatedMastery, type MasteryDifficulty } from "@/lib/learning/mastery"
import type { SkillCode } from "@/lib/learning/skills"

// Skill mastery over kori_skill_events / kori_skill_mastery. Every feature
// that produces learning evidence (chat corrections, SRS grading, listening
// quizzes, scenario/interview evaluation) calls recordEvent(); it never
// throws so a mastery-logging failure can't break the feature that produced
// the evidence.

export interface SkillMastery {
  skillCode: SkillCode
  masteryScore: number
  recentScore: number | null
  attemptCount: number
  lastPracticedAt: string | null
}

type MasteryRow = {
  skill_code: string
  mastery_score: number
  recent_score: number | null
  attempt_count: number
  last_practiced_at: string | null
}

function toMastery(row: MasteryRow): SkillMastery {
  return {
    skillCode: row.skill_code as SkillCode,
    masteryScore: Number(row.mastery_score),
    recentScore: row.recent_score == null ? null : Number(row.recent_score),
    attemptCount: row.attempt_count,
    lastPracticedAt: row.last_practiced_at,
  }
}

export interface RecordSkillEventInput {
  skillCode: SkillCode
  sourceFeature: string
  sourceId?: string | null
  score: number
  confidence?: number | null
  difficulty?: MasteryDifficulty | null
  metadata?: Record<string, unknown>
}

export const skillsApi = {
  getMastery: async (): Promise<SkillMastery[]> => {
    const { data, error } = await supabase.from("kori_skill_mastery").select("*")
    if (error) throw error
    return (data as MasteryRow[]).map(toMastery)
  },

  // Lowest-mastery skills with at least one attempt — used to target the
  // daily mission at real weaknesses instead of guessing.
  getWeakSkills: async (limit = 5): Promise<SkillMastery[]> => {
    const { data, error } = await supabase
      .from("kori_skill_mastery")
      .select("*")
      .gt("attempt_count", 0)
      .order("mastery_score", { ascending: true })
      .limit(limit)
    if (error) throw error
    return (data as MasteryRow[]).map(toMastery)
  },

  // Records one piece of learning evidence: reads the current mastery row,
  // computes the next value with the pure/tested algorithm, then persists
  // both the event and the updated aggregate atomically via the RPC. Never
  // throws — logs and swallows failures so the calling feature still succeeds.
  recordEvent: async (input: RecordSkillEventInput): Promise<void> => {
    try {
      requireUserId()
      const { data: current } = await supabase
        .from("kori_skill_mastery")
        .select("mastery_score, attempt_count")
        .eq("skill_code", input.skillCode)
        .maybeSingle()

      const currentMastery = current?.mastery_score ?? 0
      const attemptCount = current?.attempt_count ?? 0
      const newMastery = calculateUpdatedMastery({
        currentMastery,
        attemptScore: input.score,
        attemptCount,
        confidence: input.confidence,
        difficulty: input.difficulty,
      })

      const { error } = await supabase.rpc("kori_record_skill_event", {
        p_skill_code: input.skillCode,
        p_source_feature: input.sourceFeature,
        p_new_mastery: newMastery,
        p_new_attempt_count: attemptCount + 1,
        p_score: Math.round(Math.min(100, Math.max(0, input.score))),
        p_source_id: input.sourceId ?? null,
        p_confidence: input.confidence ?? null,
        p_difficulty: input.difficulty ?? null,
        p_metadata: input.metadata ?? {},
      })
      if (error) throw error
    } catch (err) {
      console.warn("[skills] failed to record skill event", input.skillCode, input.sourceFeature, err)
    }
  },
}
