import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import type {
  EvaluationScore,
  InterviewAnalytics,
  CriterionScores,
} from "@/lib/interview"
import type { EnrichedDrillQuestion, SpeakingScores } from "@/lib/interview-drills"
import type { InterviewMode } from "@/lib/interview-modes"
import {
  averageScore,
  computeNextProgress,
  versionsToDeactivate,
  type QuestionBankItem,
  type QuestionCategory,
  type QuestionDifficulty,
  type QuestionPriority,
  type QuestionProgress,
  type QuestionProgressStatus,
} from "@/lib/interview-practice"
import type { SkillCode } from "@/lib/learning/skills"
import { aiPost } from "./ai-client"
import { skillsApi } from "./skills"

const EVALUATION_LABEL_TO_SKILL: Record<string, SkillCode> = {
  Speaking: "interview.speaking",
  Pronunciation: "interview.speaking",
  Vocabulary: "interview.vocabulary",
  Confidence: "interview.confidence",
}

// Mock Interview / Exam Prep
// The examiner Q&A itself runs over the chat layer (chatApi). These helpers
// keep interview-specific persistence — the written script the candidate
// submits before the exam, and finished mock-interview attempts — plus the
// structured end-of-session evaluation route.
export interface InterviewScript {
  topicId: string
  sections: Record<string, string>
  updatedAt: string
}

/** One line of the session transcript sent to the evaluate route. */
export interface TranscriptEntry {
  role: "examiner" | "candidate"
  text: string
}

/** Structured response from POST /api/ai/interview/evaluate. */
export interface EvaluateResponse {
  scores: CriterionScores
  summary: string
  advice: string[]
  analytics: InterviewAnalytics
}

/** Structured response from POST /api/ai/interview/speaking-check. */
export interface SpeakingCheckResponse {
  scores: SpeakingScores
  feedback: string
  correctedAnswer: string
  betterAlternative: string
  tip: string
}

/** A finished mock interview, as stored in kori_interview_attempts. */
export interface InterviewAttempt {
  id: string
  mode: InterviewMode
  topicId: string
  scores: EvaluationScore[]
  overall: number
  summary: string
  advice: string[]
  analytics: InterviewAnalytics | null
  questionCount: number
  durationSeconds: number
  createdAt: string
}

interface AttemptRow {
  id: string
  mode: InterviewMode
  topic_id: string
  scores: EvaluationScore[]
  overall: number
  summary: string
  advice: string[]
  analytics: InterviewAnalytics | null
  question_count: number
  duration_seconds: number
  created_at: string
}

const ATTEMPT_COLUMNS =
  "id, mode, topic_id, scores, overall, summary, advice, analytics, question_count, duration_seconds, created_at"

// ── Question bank (kori_interview_questions) ──────────────────────────────
interface QuestionRow {
  id: string
  created_by_user_id: string | null
  question_ko: string
  question_en: string | null
  sample_answer_ko: string | null
  sample_answer_en: string | null
  category: QuestionCategory
  difficulty: QuestionDifficulty
  priority: QuestionPriority
  keywords: string[]
  display_order: number
}

const QUESTION_COLUMNS =
  "id, created_by_user_id, question_ko, question_en, sample_answer_ko, sample_answer_en, category, difficulty, priority, keywords, display_order"

function mapQuestion(row: QuestionRow): QuestionBankItem {
  return {
    id: row.id,
    questionKo: row.question_ko,
    questionEn: row.question_en,
    sampleAnswerKo: row.sample_answer_ko,
    sampleAnswerEn: row.sample_answer_en,
    category: row.category,
    difficulty: row.difficulty,
    priority: row.priority,
    keywords: row.keywords ?? [],
    displayOrder: row.display_order,
    ownedByUser: row.created_by_user_id !== null,
  }
}

// ── Per-question progress (kori_interview_question_progress) ─────────────
interface QuestionProgressRow {
  question_id: string
  times_practiced: number
  avg_score: number | null
  last_score: number | null
  last_practiced_at: string | null
  status: QuestionProgressStatus
}

function mapProgress(row: QuestionProgressRow): QuestionProgress {
  return {
    questionId: row.question_id,
    timesPracticed: row.times_practiced,
    avgScore: row.avg_score,
    lastScore: row.last_score,
    lastPracticedAt: row.last_practiced_at,
    status: row.status,
  }
}

// ── Practice-answer history (kori_interview_answers) ──────────────────────
export interface InterviewAnswerRecord {
  id: string
  questionId: string | null
  sessionType: "speaking_drill" | "listening_drill" | "mock_interview"
  sessionId: string | null
  questionKo: string
  answerText: string
  answerDurationSeconds: number | null
  confidenceSelfScore: number | null
  scores: Record<string, number>
  feedback: string | null
  correctedAnswer: string | null
  naturalAlternative: string | null
  tip: string | null
  createdAt: string
}

interface AnswerRow {
  id: string
  question_id: string | null
  session_type: InterviewAnswerRecord["sessionType"]
  session_id: string | null
  question_ko: string
  answer_text: string
  answer_duration_seconds: number | null
  confidence_self_score: number | null
  scores: Record<string, number>
  feedback: string | null
  corrected_answer: string | null
  natural_alternative: string | null
  tip: string | null
  created_at: string
}

const ANSWER_COLUMNS =
  "id, question_id, session_type, session_id, question_ko, answer_text, answer_duration_seconds, confidence_self_score, scores, feedback, corrected_answer, natural_alternative, tip, created_at"

function mapAnswer(row: AnswerRow): InterviewAnswerRecord {
  return {
    id: row.id,
    questionId: row.question_id,
    sessionType: row.session_type,
    sessionId: row.session_id,
    questionKo: row.question_ko,
    answerText: row.answer_text,
    answerDurationSeconds: row.answer_duration_seconds,
    confidenceSelfScore: row.confidence_self_score,
    scores: row.scores ?? {},
    feedback: row.feedback,
    correctedAnswer: row.corrected_answer,
    naturalAlternative: row.natural_alternative,
    tip: row.tip,
    createdAt: row.created_at,
  }
}

// ── Script version snapshots (kori_interview_script_versions) ────────────
export interface ScriptVersion {
  id: string
  versionLabel: string
  sourceType: "user" | "ai" | "mentor"
  sections: Record<string, string>
  isActive: boolean
  createdAt: string
}

interface ScriptVersionRow {
  id: string
  version_label: string
  source_type: ScriptVersion["sourceType"]
  sections: Record<string, string>
  is_active: boolean
  created_at: string
}

const SCRIPT_VERSION_COLUMNS = "id, version_label, source_type, sections, is_active, created_at"

function mapScriptVersion(row: ScriptVersionRow): ScriptVersion {
  return {
    id: row.id,
    versionLabel: row.version_label,
    sourceType: row.source_type,
    sections: row.sections ?? {},
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

function mapAttempt(row: AttemptRow): InterviewAttempt {
  return {
    id: row.id,
    mode: row.mode,
    topicId: row.topic_id,
    scores: row.scores,
    overall: Number(row.overall),
    summary: row.summary,
    advice: row.advice,
    analytics: row.analytics,
    questionCount: row.question_count,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  }
}

export const interviewApi = {
  getScript: async (topicId: string): Promise<InterviewScript | null> => {
    const { data, error } = await supabase
      .from("kori_interview_scripts")
      .select("topic_id, sections, updated_at")
      .eq("topic_id", topicId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return { topicId: data.topic_id, sections: data.sections, updatedAt: data.updated_at }
  },

  saveScript: async (topicId: string, sections: Record<string, string>): Promise<InterviewScript> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_interview_scripts")
      .upsert({ user_id: userId, topic_id: topicId, sections })
      .select("topic_id, sections, updated_at")
      .single()
    if (error) throw error
    return { topicId: data.topic_id, sections: data.sections, updatedAt: data.updated_at }
  },

  /** One batch of fresh drill questions (with listening glosses) per session. */
  drillQuestions: (payload: {
    kind: "speaking" | "listening"
    count: number
    complexityHint: string
    styleExamples: string[]
    avoid: string[]
  }): Promise<{ questions: EnrichedDrillQuestion[] }> =>
    aiPost<{ questions: EnrichedDrillQuestion[] }>("/interview/drill-questions", payload),

  /** Grades one spoken drill answer (six 1–5 scores + coaching). */
  speakingCheck: (payload: { question: string; answer: string }): Promise<SpeakingCheckResponse> =>
    aiPost<SpeakingCheckResponse>("/interview/speaking-check", payload),

  /** Structured end-of-session scorecard + transcript analytics. */
  evaluate: (payload: {
    topicId: string
    mode: InterviewMode
    transcript: TranscriptEntry[]
    questionCount: number
    durationSeconds: number
  }): Promise<EvaluateResponse> => aiPost<EvaluateResponse>("/interview/evaluate", payload),

  /** Persists a finished mock. The id is client-generated and shared with the
   *  localStorage scorecard so merged reads can dedupe. */
  saveAttempt: async (attempt: Omit<InterviewAttempt, "createdAt">): Promise<InterviewAttempt> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_interview_attempts")
      .insert({
        id: attempt.id,
        user_id: userId,
        mode: attempt.mode,
        topic_id: attempt.topicId,
        scores: attempt.scores,
        overall: attempt.overall,
        summary: attempt.summary,
        advice: attempt.advice,
        analytics: attempt.analytics,
        question_count: attempt.questionCount,
        duration_seconds: attempt.durationSeconds,
      })
      .select(ATTEMPT_COLUMNS)
      .single()
    if (error) throw error

    for (const s of attempt.scores) {
      const skillCode = EVALUATION_LABEL_TO_SKILL[s.label]
      if (!skillCode) continue
      void skillsApi.recordEvent({
        skillCode,
        sourceFeature: "interview_evaluation",
        sourceId: attempt.id,
        score: Math.round((s.score / s.max) * 100),
      })
    }
    void skillsApi.recordEvent({
      skillCode: "interview.task_completion",
      sourceFeature: "interview_evaluation",
      sourceId: attempt.id,
      score: Math.round(attempt.overall * 20),
    })

    return mapAttempt(data as AttemptRow)
  },

  /** Past attempts, oldest first (matches the local trend's ordering). */
  listAttempts: async (limit = 50): Promise<InterviewAttempt[]> => {
    const { data, error } = await supabase
      .from("kori_interview_attempts")
      .select(ATTEMPT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return ((data ?? []) as AttemptRow[]).map(mapAttempt).reverse()
  },

  // ── Question bank ─────────────────────────────────────────────────────────
  listQuestions: async (topicId: string): Promise<QuestionBankItem[]> => {
    const { data, error } = await supabase
      .from("kori_interview_questions")
      .select(QUESTION_COLUMNS)
      .eq("topic_id", topicId)
      .eq("active", true)
      .order("display_order", { ascending: true })
    if (error) throw error
    return ((data ?? []) as QuestionRow[]).map(mapQuestion)
  },

  /** A candidate's own extra question, beyond the seeded bank. */
  addCustomQuestion: async (
    topicId: string,
    data: { questionKo: string; questionEn?: string; category?: QuestionCategory }
  ): Promise<QuestionBankItem> => {
    const userId = requireUserId()
    const { data: row, error } = await supabase
      .from("kori_interview_questions")
      .insert({
        created_by_user_id: userId,
        topic_id: topicId,
        question_ko: data.questionKo,
        question_en: data.questionEn ?? null,
        category: data.category ?? "unexpected_followup",
        display_order: 999,
      })
      .select(QUESTION_COLUMNS)
      .single()
    if (error) throw error
    return mapQuestion(row as QuestionRow)
  },

  removeCustomQuestion: async (id: string) => {
    const { error } = await supabase.from("kori_interview_questions").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // ── Per-question progress, feeds "Focus on weak questions" mode ─────────
  listQuestionProgress: async (): Promise<Record<string, QuestionProgress>> => {
    const { data, error } = await supabase
      .from("kori_interview_question_progress")
      .select("question_id, times_practiced, avg_score, last_score, last_practiced_at, status")
    if (error) throw error
    const map: Record<string, QuestionProgress> = {}
    for (const row of (data ?? []) as QuestionProgressRow[]) {
      map[row.question_id] = mapProgress(row)
    }
    return map
  },

  // ── Practice-answer history ───────────────────────────────────────────────
  /** Persists one graded practice answer, and — if it's linked to a bank
   *  question — bumps that question's aggregate progress (lib/interview-practice.ts
   *  computeNextProgress) so weak-question ranking has something to work with. */
  saveAnswer: async (input: {
    questionId?: string | null
    sessionType: InterviewAnswerRecord["sessionType"]
    sessionId?: string | null
    questionKo: string
    answerText: string
    answerDurationSeconds?: number
    confidenceSelfScore?: number
    scores: Record<string, number>
    feedback?: string
    correctedAnswer?: string
    naturalAlternative?: string
    tip?: string
  }): Promise<InterviewAnswerRecord> => {
    const userId = requireUserId()
    const { data: row, error } = await supabase
      .from("kori_interview_answers")
      .insert({
        user_id: userId,
        question_id: input.questionId ?? null,
        session_type: input.sessionType,
        session_id: input.sessionId ?? null,
        question_ko: input.questionKo,
        answer_text: input.answerText,
        answer_duration_seconds: input.answerDurationSeconds ?? null,
        confidence_self_score: input.confidenceSelfScore ?? null,
        scores: input.scores,
        feedback: input.feedback ?? null,
        corrected_answer: input.correctedAnswer ?? null,
        natural_alternative: input.naturalAlternative ?? null,
        tip: input.tip ?? null,
      })
      .select(ANSWER_COLUMNS)
      .single()
    if (error) throw error

    if (input.questionId) {
      const { data: existingRow } = await supabase
        .from("kori_interview_question_progress")
        .select("times_practiced, avg_score")
        .eq("user_id", userId)
        .eq("question_id", input.questionId)
        .maybeSingle()
      const next = computeNextProgress(
        existingRow
          ? { timesPracticed: existingRow.times_practiced, avgScore: existingRow.avg_score }
          : null,
        averageScore(input.scores)
      )
      const { error: progressError } = await supabase.from("kori_interview_question_progress").upsert(
        {
          user_id: userId,
          question_id: input.questionId,
          times_practiced: next.timesPracticed,
          avg_score: next.avgScore,
          last_score: next.lastScore,
          last_practiced_at: next.lastPracticedAt,
          status: next.status,
        },
        { onConflict: "user_id,question_id" }
      )
      if (progressError) throw progressError
    }

    return mapAnswer(row as AnswerRow)
  },

  listAnswers: async (limit = 50): Promise<InterviewAnswerRecord[]> => {
    const { data, error } = await supabase
      .from("kori_interview_answers")
      .select(ANSWER_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return ((data ?? []) as AnswerRow[]).map(mapAnswer)
  },

  // ── Script version snapshots (layered on the live kori_interview_scripts
  // draft — see the migration's comment for why) ───────────────────────────
  listScriptVersions: async (topicId: string): Promise<ScriptVersion[]> => {
    const { data, error } = await supabase
      .from("kori_interview_script_versions")
      .select(SCRIPT_VERSION_COLUMNS)
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return ((data ?? []) as ScriptVersionRow[]).map(mapScriptVersion)
  },

  saveScriptVersion: async (
    topicId: string,
    data: {
      versionLabel: string
      sourceType?: ScriptVersion["sourceType"]
      sections: Record<string, string>
      makeActive?: boolean
    }
  ): Promise<ScriptVersion> => {
    const userId = requireUserId()
    if (data.makeActive) {
      const existing = await interviewApi.listScriptVersions(topicId)
      const activeIds = existing.filter((v) => v.isActive).map((v) => v.id)
      if (activeIds.length > 0) {
        const { error: deactivateError } = await supabase
          .from("kori_interview_script_versions")
          .update({ is_active: false })
          .in("id", activeIds)
        if (deactivateError) throw deactivateError
      }
    }
    const { data: row, error } = await supabase
      .from("kori_interview_script_versions")
      .insert({
        user_id: userId,
        topic_id: topicId,
        version_label: data.versionLabel,
        source_type: data.sourceType ?? "user",
        sections: data.sections,
        is_active: data.makeActive ?? false,
      })
      .select(SCRIPT_VERSION_COLUMNS)
      .single()
    if (error) throw error
    return mapScriptVersion(row as ScriptVersionRow)
  },

  /** Enforces "only one active version at a time" (lib/interview-practice.ts
   *  versionsToDeactivate) by unsetting every other active version first. */
  setActiveScriptVersion: async (topicId: string, versionId: string): Promise<void> => {
    const existing = await interviewApi.listScriptVersions(topicId)
    const toDeactivate = versionsToDeactivate(
      existing.map((v) => ({ id: v.id, isActive: v.isActive })),
      versionId
    )
    if (toDeactivate.length > 0) {
      const { error: deactivateError } = await supabase
        .from("kori_interview_script_versions")
        .update({ is_active: false })
        .in("id", toDeactivate)
      if (deactivateError) throw deactivateError
    }
    const { error } = await supabase
      .from("kori_interview_script_versions")
      .update({ is_active: true })
      .eq("id", versionId)
    if (error) throw error
  },
}
