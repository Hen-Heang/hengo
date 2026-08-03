import { requireUserId } from "@/lib/auth-store"
import { createCorrectionFingerprint } from "@/lib/learning/korean-text"
import {
  planCorrectionUpsert,
  type ExistingCorrectionState,
} from "@/lib/learning/corrections"
import {
  koreanCoachPreferencesSchema,
  koreanPhraseSchema,
  koreanSessionSummarySchema,
  koreanTutorFeedbackSchema,
  type CoachMistake,
  type KoreanCoachPreferences,
  type KoreanCoachPracticeMode,
  type KoreanPhrase,
  type KoreanScenario,
  type KoreanScenarioCategory,
  type KoreanSessionSummary,
  type KoreanTutorFeedback,
  type SpeechSpeed,
} from "@/lib/korean-coach/schemas"
import { getKoreanCoachScenario, KOREAN_COACH_SCENARIOS } from "@/lib/korean-coach/scenarios"
import { supabase } from "@/lib/supabase"
import { authHeaders } from "./ai-client"

export type KoreanCoachAiMode = "live" | "mock"

export class KoreanCoachApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message)
    this.name = "KoreanCoachApiError"
  }
}

type CoachEnvelope<T> = {
  data: T
  meta: { mode: KoreanCoachAiMode }
}

type CoachErrorEnvelope = {
  error?: {
    code?: string
    message?: string
    retryable?: boolean
  }
}

async function parseCoachResponse<T>(response: Response): Promise<CoachEnvelope<T>> {
  const payload = (await response.json().catch(() => null)) as
    | CoachEnvelope<T>
    | CoachErrorEnvelope
    | null
  if (!response.ok || !payload || !("data" in payload)) {
    const detail = payload && "error" in payload ? payload.error : undefined
    throw new KoreanCoachApiError(
      detail?.message ?? "Korean Coach could not complete that request.",
      detail?.code ?? "UNKNOWN_ERROR",
      response.status,
      detail?.retryable ?? response.status >= 500,
    )
  }
  return payload
}

async function coachJsonPost<T>(path: string, body: unknown): Promise<CoachEnvelope<T>> {
  const response = await fetch(`/api/ai/korean${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  })
  return parseCoachResponse<T>(response)
}

export const koreanCoachAiApi = {
  scenarios: async (): Promise<KoreanScenario[]> => {
    const response = await fetch("/api/ai/korean/scenarios", {
      headers: await authHeaders(),
      signal: AbortSignal.timeout(15_000),
    })
    return (await parseCoachResponse<KoreanScenario[]>(response)).data
  },

  transcribe: async (
    audio: Blob,
    durationMs: number,
  ): Promise<{ transcript: string; mode: KoreanCoachAiMode }> => {
    const formData = new FormData()
    const extension = audio.type.includes("mp4") ? "m4a" : audio.type.includes("wav") ? "wav" : "webm"
    formData.set("audio", audio, `answer.${extension}`)
    formData.set("durationMs", String(Math.round(durationMs)))
    const response = await fetch("/api/ai/korean/transcribe", {
      method: "POST",
      headers: await authHeaders(),
      body: formData,
      signal: AbortSignal.timeout(40_000),
    })
    const result = await parseCoachResponse<{ transcript: string }>(response)
    return { transcript: result.data.transcript, mode: result.meta.mode }
  },

  feedback: async (input: {
    scenarioId: string
    transcript: string
    tutorMessage: KoreanPhrase
    turn: number
    correctionStrictness: KoreanCoachPreferences["correctionStrictness"]
  }): Promise<{ feedback: KoreanTutorFeedback; mode: KoreanCoachAiMode }> => {
    const result = await coachJsonPost<KoreanTutorFeedback>("/feedback", input)
    return {
      feedback: koreanTutorFeedbackSchema.parse(result.data),
      mode: result.meta.mode,
    }
  },

  speech: async (
    text: string,
    speed: SpeechSpeed,
  ): Promise<{ audio: Blob | null; mode: KoreanCoachAiMode }> => {
    const response = await fetch("/api/ai/korean/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      body: JSON.stringify({ text, speed }),
      signal: AbortSignal.timeout(30_000),
    })
    if (response.status === 204) return { audio: null, mode: "mock" }
    if (!response.ok) {
      await parseCoachResponse<never>(response)
    }
    return {
      audio: await response.blob(),
      mode: response.headers.get("X-Hengo-AI-Mode") === "mock" ? "mock" : "live",
    }
  },
}

export interface KoreanPracticeSession {
  id: string
  scenarioId: string | null
  mode: KoreanCoachPracticeMode
  status: "active" | "completed" | "failed"
  startedAt: string
  endedAt: string | null
  durationSeconds: number
  completedTurns: number
  speakingAttempts: number
  summary: KoreanSessionSummary | null
}

type VoiceSessionRow = {
  id: string
  scenario_id: string | null
  practice_mode: string
  status: "active" | "completed" | "failed"
  started_at: string
  ended_at: string | null
  duration_seconds: number
  user_turn_count: number
  summary: unknown
}

function toPracticeSession(row: VoiceSessionRow): KoreanPracticeSession {
  const parsedSummary = koreanSessionSummarySchema.safeParse(row.summary)
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    mode: row.practice_mode === "korean_coach_listening" ? "listening" : "speaking",
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    completedTurns: parsedSummary.success ? parsedSummary.data.completedTurns : row.user_turn_count,
    speakingAttempts: parsedSummary.success ? parsedSummary.data.speakingAttempts : 0,
    summary: parsedSummary.success ? parsedSummary.data : null,
  }
}

export interface KoreanPracticeTurn {
  id: string
  sessionId: string
  turnNumber: number
  tutorMessage: KoreanPhrase
  transcriptRevealed: boolean
  hintUsed: boolean
  taskCompleted: boolean
  createdAt: string
}

type TurnRow = {
  id: string
  session_id: string
  turn_number: number
  tutor_message: unknown
  transcript_revealed: boolean
  hint_used: boolean
  task_completed: boolean
  created_at: string
}

function toPracticeTurn(row: TurnRow): KoreanPracticeTurn {
  return {
    id: row.id,
    sessionId: row.session_id,
    turnNumber: row.turn_number,
    tutorMessage: koreanPhraseSchema.parse(row.tutor_message),
    transcriptRevealed: row.transcript_revealed,
    hintUsed: row.hint_used,
    taskCompleted: row.task_completed,
    createdAt: row.created_at,
  }
}

export interface KoreanSpeakingAttempt {
  id: string
  sessionId: string
  turnId: string
  inputMethod: "audio" | "text"
  transcript: string
  feedback: KoreanTutorFeedback
  recordingDurationMs: number | null
  isRetry: boolean
  createdAt: string
}

type AttemptRow = {
  id: string
  session_id: string
  turn_id: string
  input_method: "audio" | "text"
  transcript: string
  feedback: unknown
  recording_duration_ms: number | null
  is_retry: boolean
  created_at: string
}

function toSpeakingAttempt(row: AttemptRow): KoreanSpeakingAttempt {
  return {
    id: row.id,
    sessionId: row.session_id,
    turnId: row.turn_id,
    inputMethod: row.input_method,
    transcript: row.transcript,
    feedback: koreanTutorFeedbackSchema.parse(row.feedback),
    recordingDurationMs: row.recording_duration_ms,
    isRetry: row.is_retry,
    createdAt: row.created_at,
  }
}

export interface KoreanCoachMistake {
  id: string
  original: string
  correction: string
  naturalAlternative: string
  englishMeaning: string
  explanation: string
  type: CoachMistake["type"]
  scenarioId: string | null
  scenarioCategory: KoreanScenarioCategory | null
  createdAt: string
  reviewCount: number
  occurrenceCount: number
  mastered: boolean
}

type CorrectionRow = {
  id: string
  original_text: string
  corrected_text: string
  natural_version: string | null
  english_meaning: string | null
  explanation: string | null
  error_category: string | null
  scenario_id: string | null
  scenario_category: string | null
  created_at: string
  coach_review_count: number
  occurrence_count: number
  coach_mastered: boolean
}

function normalizeMistakeType(value: string | null): CoachMistake["type"] {
  return value === "grammar" ||
    value === "vocabulary" ||
    value === "naturalness" ||
    value === "communication"
    ? value
    : "communication"
}

function toCoachMistake(row: CorrectionRow): KoreanCoachMistake {
  return {
    id: row.id,
    original: row.original_text,
    correction: row.corrected_text,
    naturalAlternative: row.natural_version ?? row.corrected_text,
    englishMeaning: row.english_meaning ?? "",
    explanation: row.explanation ?? "",
    type: normalizeMistakeType(row.error_category),
    scenarioId: row.scenario_id,
    scenarioCategory:
      row.scenario_category === "workplace" || row.scenario_category === "daily"
        ? row.scenario_category
        : null,
    createdAt: row.created_at,
    reviewCount: row.coach_review_count,
    occurrenceCount: row.occurrence_count,
    mastered: row.coach_mastered,
  }
}

function koreaDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

function calculatePracticeStreak(sessions: KoreanPracticeSession[]): number {
  const practiced = new Set(
    sessions
      .filter((session) => session.status === "completed")
      .map((session) => koreaDateKey(new Date(session.endedAt ?? session.startedAt))),
  )
  const cursor = new Date()
  if (!practiced.has(koreaDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (practiced.has(koreaDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export interface KoreanCoachDashboard {
  preferences: KoreanCoachPreferences
  streak: number
  minutesToday: number
  completedSessions: number
  recentSessions: KoreanPracticeSession[]
  frequentMistakes: KoreanCoachMistake[]
  recommendedScenario: KoreanScenario
}

const DEFAULT_PREFERENCES = koreanCoachPreferencesSchema.parse({})

export const koreanCoachApi = {
  getPreferences: async (): Promise<KoreanCoachPreferences> => {
    const { data, error } = await supabase
      .from("kori_korean_coach_preferences")
      .select("*")
      .maybeSingle()
    if (error) throw error
    if (!data) return DEFAULT_PREFERENCES
    return koreanCoachPreferencesSchema.parse({
      level: data.level,
      mainGoal: data.main_goal,
      explanationLanguage: data.explanation_language,
      romanizationMode: data.romanization_mode,
      defaultSpeechSpeed: Number(data.default_speech_speed),
      dailyPracticeGoalMinutes: data.daily_practice_goal_minutes,
      preferredPracticeDurationMinutes: data.preferred_practice_duration_minutes,
      correctionStrictness: data.correction_strictness,
    })
  },

  savePreferences: async (
    rawPreferences: KoreanCoachPreferences,
  ): Promise<KoreanCoachPreferences> => {
    const preferences = koreanCoachPreferencesSchema.parse(rawPreferences)
    const { error } = await supabase.from("kori_korean_coach_preferences").upsert({
      user_id: requireUserId(),
      level: preferences.level,
      main_goal: preferences.mainGoal,
      explanation_language: preferences.explanationLanguage,
      romanization_mode: preferences.romanizationMode,
      default_speech_speed: preferences.defaultSpeechSpeed,
      daily_practice_goal_minutes: preferences.dailyPracticeGoalMinutes,
      preferred_practice_duration_minutes: preferences.preferredPracticeDurationMinutes,
      correction_strictness: preferences.correctionStrictness,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    return preferences
  },

  startSession: async (
    scenarioId: string | null,
    mode: KoreanCoachPracticeMode,
    preferences: KoreanCoachPreferences,
  ): Promise<KoreanPracticeSession> => {
    if (scenarioId && !getKoreanCoachScenario(scenarioId)) throw new Error("Unknown Korean scenario")
    const { data, error } = await supabase
      .from("kori_voice_sessions")
      .insert({
        user_id: requireUserId(),
        scenario_id: scenarioId,
        practice_mode: `korean_coach_${mode}`,
        correction_policy: preferences.correctionStrictness,
        learner_level: preferences.level,
        status: "active",
        summary: {},
        model: null,
      })
      .select("*")
      .single()
    if (error) throw error
    return toPracticeSession(data as VoiceSessionRow)
  },

  createTurn: async (
    sessionId: string,
    turnNumber: number,
    tutorMessage: KoreanPhrase,
  ): Promise<KoreanPracticeTurn> => {
    const { data, error } = await supabase
      .from("kori_korean_practice_turns")
      .insert({
        user_id: requireUserId(),
        session_id: sessionId,
        turn_number: turnNumber,
        tutor_message: koreanPhraseSchema.parse(tutorMessage),
      })
      .select("*")
      .single()
    if (error) throw error
    return toPracticeTurn(data as TurnRow)
  },

  updateTurnLearningAids: async (
    turnId: string,
    changes: { transcriptRevealed?: boolean; hintUsed?: boolean },
  ): Promise<void> => {
    const update: Record<string, boolean> = {}
    if (changes.transcriptRevealed !== undefined) {
      update.transcript_revealed = changes.transcriptRevealed
    }
    if (changes.hintUsed !== undefined) update.hint_used = changes.hintUsed
    if (Object.keys(update).length === 0) return
    const { error } = await supabase
      .from("kori_korean_practice_turns")
      .update(update)
      .eq("id", turnId)
    if (error) throw error
  },

  saveAttempt: async (input: {
    sessionId: string
    turnId: string
    inputMethod: "audio" | "text"
    transcript: string
    feedback: KoreanTutorFeedback
    recordingDurationMs: number | null
    isRetry: boolean
  }): Promise<KoreanSpeakingAttempt> => {
    const feedback = koreanTutorFeedbackSchema.parse(input.feedback)
    const { data, error } = await supabase
      .from("kori_korean_speaking_attempts")
      .insert({
        user_id: requireUserId(),
        session_id: input.sessionId,
        turn_id: input.turnId,
        input_method: input.inputMethod,
        transcript: input.transcript.trim(),
        feedback,
        recording_duration_ms: input.recordingDurationMs,
        is_retry: input.isRetry,
      })
      .select("*")
      .single()
    if (error) throw error
    return toSpeakingAttempt(data as AttemptRow)
  },

  completeTurn: async (turnId: string, taskCompleted: boolean): Promise<void> => {
    const { error } = await supabase
      .from("kori_korean_practice_turns")
      .update({ task_completed: taskCompleted })
      .eq("id", turnId)
    if (error) throw error
  },

  completeSession: async (
    sessionId: string,
    summaryInput: KoreanSessionSummary,
  ): Promise<KoreanSessionSummary> => {
    const summary = koreanSessionSummarySchema.parse(summaryInput)
    const { error } = await supabase
      .from("kori_voice_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: summary.durationSeconds,
        user_turn_count: summary.completedTurns,
        assistant_turn_count: summary.completedTurns,
        important_mistake_count: summary.mistakesSaved,
        target_expressions: summary.newVocabulary.map((word) => word.korean),
        scenario_completed: summary.completedTurns > 0,
        summary,
      })
      .eq("id", sessionId)
    if (error) throw error
    return summary
  },

  getSession: async (
    sessionId: string,
  ): Promise<{
    session: KoreanPracticeSession
    turns: KoreanPracticeTurn[]
    attempts: KoreanSpeakingAttempt[]
  }> => {
    const [sessionResult, turnsResult, attemptsResult] = await Promise.all([
      supabase.from("kori_voice_sessions").select("*").eq("id", sessionId).single(),
      supabase
        .from("kori_korean_practice_turns")
        .select("*")
        .eq("session_id", sessionId)
        .order("turn_number"),
      supabase
        .from("kori_korean_speaking_attempts")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at"),
    ])
    if (sessionResult.error) throw sessionResult.error
    if (turnsResult.error) throw turnsResult.error
    if (attemptsResult.error) throw attemptsResult.error
    return {
      session: toPracticeSession(sessionResult.data as VoiceSessionRow),
      turns: (turnsResult.data as TurnRow[]).map(toPracticeTurn),
      attempts: (attemptsResult.data as AttemptRow[]).map(toSpeakingAttempt),
    }
  },

  deleteAttempt: async (attemptId: string): Promise<void> => {
    const { error } = await supabase
      .from("kori_korean_speaking_attempts")
      .delete()
      .eq("id", attemptId)
    if (error) throw error
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const { error } = await supabase.from("kori_voice_sessions").delete().eq("id", sessionId)
    if (error) throw error
  },

  listMistakes: async (): Promise<KoreanCoachMistake[]> => {
    const { data, error } = await supabase
      .from("kori_corrections")
      .select("*")
      .eq("source_feature", "korean_coach")
      .order("last_seen_at", { ascending: false })
    if (error) throw error
    return (data as CorrectionRow[]).map(toCoachMistake)
  },

  saveMistakes: async (input: {
    mistakes: CoachMistake[]
    feedback: KoreanTutorFeedback
    scenarioId: string
    sourceId: string
  }): Promise<number> => {
    const scenario = getKoreanCoachScenario(input.scenarioId)
    if (!scenario) throw new Error("Unknown Korean scenario")
    const userId = requireUserId()
    let saved = 0

    for (const mistake of input.mistakes) {
      const fingerprint = createCorrectionFingerprint({
        originalText: mistake.original,
        correctedText: mistake.correction,
        category: mistake.type,
      })
      const { data: existingRow, error: readError } = await supabase
        .from("kori_corrections")
        .select(
          "mastery, ease_factor, interval_days, repetitions, lapses, occurrence_count, next_review_date",
        )
        .eq("user_id", userId)
        .eq("fingerprint", fingerprint)
        .maybeSingle()
      if (readError) throw readError
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
      const plan = planCorrectionUpsert(existing, {
        severity: mistake.important ? "important" : "minor",
      })
      const row = {
        user_id: userId,
        original_text: mistake.original,
        corrected_text: mistake.correction,
        explanation: mistake.explanation,
        grammar_points: mistake.type === "grammar" ? [mistake.explanation] : [],
        mastery: plan.state.mastery,
        next_review_date: plan.state.nextReviewDate,
        ease_factor: plan.state.easeFactor,
        interval_days: plan.state.intervalDays,
        repetitions: plan.state.repetitions,
        lapses: plan.state.lapses,
        source_feature: "korean_coach",
        source_id: input.sourceId,
        error_category: mistake.type,
        severity: mistake.important ? "important" : "minor",
        natural_version: input.feedback.alternativeSentence.korean,
        fingerprint,
        occurrence_count: plan.occurrenceCount,
        last_seen_at: new Date().toISOString(),
        scenario_id: scenario.id,
        scenario_category: scenario.category,
        english_meaning: input.feedback.correctedSentence.english,
      }
      const query =
        plan.action === "insert"
          ? supabase.from("kori_corrections").insert(row)
          : supabase
              .from("kori_corrections")
              .update(row)
              .eq("user_id", userId)
              .eq("fingerprint", fingerprint)
      const { error } = await query
      if (error) throw error
      saved += 1
    }
    return saved
  },

  updateMistake: async (
    mistakeId: string,
    changes: { mastered?: boolean; incrementReview?: boolean },
  ): Promise<void> => {
    const update: Record<string, boolean | number> = {}
    if (changes.mastered !== undefined) update.coach_mastered = changes.mastered
    if (changes.incrementReview) {
      const { data, error } = await supabase
        .from("kori_corrections")
        .select("coach_review_count")
        .eq("id", mistakeId)
        .single()
      if (error) throw error
      update.coach_review_count = Number(data.coach_review_count ?? 0) + 1
    }
    if (Object.keys(update).length === 0) return
    const { error } = await supabase.from("kori_corrections").update(update).eq("id", mistakeId)
    if (error) throw error
  },

  deleteMistake: async (mistakeId: string): Promise<void> => {
    const { error } = await supabase.from("kori_corrections").delete().eq("id", mistakeId)
    if (error) throw error
  },

  getDashboard: async (): Promise<KoreanCoachDashboard> => {
    const [preferences, sessionsResult, mistakes] = await Promise.all([
      koreanCoachApi.getPreferences(),
      supabase
        .from("kori_voice_sessions")
        .select("*")
        .like("practice_mode", "korean_coach_%")
        .order("started_at", { ascending: false })
        .limit(100),
      koreanCoachApi.listMistakes(),
    ])
    if (sessionsResult.error) throw sessionsResult.error
    const sessions = (sessionsResult.data as VoiceSessionRow[]).map(toPracticeSession)
    const today = koreaDateKey(new Date())
    const minutesToday = Math.round(
      sessions
        .filter(
          (session) =>
            session.status === "completed" &&
            koreaDateKey(new Date(session.endedAt ?? session.startedAt)) === today,
        )
        .reduce((total, session) => total + session.durationSeconds, 0) / 60,
    )
    const frequentMistakes = [...mistakes]
      .filter((mistake) => mistake.occurrenceCount > 1)
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 3)
    const recommendedId =
      frequentMistakes.find((mistake) => mistake.scenarioId)?.scenarioId ??
      (preferences.mainGoal === "daily-life"
        ? KOREAN_COACH_SCENARIOS.find((scenario) => scenario.category === "daily")?.id
        : KOREAN_COACH_SCENARIOS.find((scenario) => scenario.category === "workplace")?.id)
    return {
      preferences,
      streak: calculatePracticeStreak(sessions),
      minutesToday,
      completedSessions: sessions.filter((session) => session.status === "completed").length,
      recentSessions: sessions.filter((session) => session.status === "completed").slice(0, 5),
      frequentMistakes,
      recommendedScenario:
        (recommendedId ? getKoreanCoachScenario(recommendedId) : undefined) ??
        KOREAN_COACH_SCENARIOS[0],
    }
  },

  deleteAllPracticeHistory: async (): Promise<void> => {
    const userId = requireUserId()
    const correctionDelete = await supabase
      .from("kori_corrections")
      .delete()
      .eq("user_id", userId)
      .eq("source_feature", "korean_coach")
    if (correctionDelete.error) throw correctionDelete.error
    const sessionDelete = await supabase
      .from("kori_voice_sessions")
      .delete()
      .eq("user_id", userId)
      .like("practice_mode", "korean_coach_%")
    if (sessionDelete.error) throw sessionDelete.error
  },
}
