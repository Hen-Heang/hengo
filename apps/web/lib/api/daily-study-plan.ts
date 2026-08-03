import { z } from "zod"

import { requireUserId } from "@/lib/auth-store"
import {
  buildDailyStudyContent,
  generateModeSchedule,
  topicForDate,
  type DailyStudyPlan,
} from "@/lib/daily-study-plan"
import {
  dailySpeakingAttemptSchema,
  dailyStudyActivitySchema,
  dailyStudyContentSchema,
  dailyStudyModeSchema,
  dailyStudyPlanPatchSchema,
} from "@/lib/daily-study-plan-schemas"
import { dateKeyInTimeZone, DEFAULT_TIME_ZONE } from "@/lib/date-key"
import { supabase } from "@/lib/supabase"

type DailyStudyPlanPatch = z.infer<typeof dailyStudyPlanPatchSchema>

type PlanRow = {
  id: string
  user_id: string
  study_date: string
  mode: string
  topic_key: string
  topic_label: string
  romanization_visible: boolean
  activities: unknown
  content: unknown
  attempts: unknown
  reflection: string
  mission_result: string
  total_focus_seconds: number
  speaking_seconds: number
  created_at: string
  updated_at: string
}

function toPlan(row: PlanRow): DailyStudyPlan {
  return {
    id: row.id,
    userId: row.user_id,
    studyDate: row.study_date,
    mode: dailyStudyModeSchema.parse(row.mode),
    topicKey: row.topic_key,
    topicLabel: row.topic_label,
    romanizationVisible: row.romanization_visible,
    activities: z.array(dailyStudyActivitySchema).parse(row.activities),
    content: dailyStudyContentSchema.parse(row.content),
    attempts: z.array(dailySpeakingAttemptSchema).parse(row.attempts),
    reflection: row.reflection,
    missionResult: row.mission_result,
    totalFocusSeconds: row.total_focus_seconds,
    speakingSeconds: row.speaking_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function profileSettings(): Promise<{ timezone: string; romanizationVisible: boolean }> {
  // Timezone comes from the profile; romanization comes from the Korean Coach
  // preferences, which are the single source of truth for it app-wide (see
  // hooks/useRomanizationPreference.ts).
  const [{ data }, { data: coachPrefs }] = await Promise.all([
    supabase.from("kori_profiles").select("timezone, korean_level").maybeSingle(),
    supabase.from("kori_korean_coach_preferences").select("romanization_mode").maybeSingle(),
  ])
  const beginner = !data?.korean_level || String(data.korean_level).toUpperCase().includes("BEGINNER")
  return {
    timezone: data?.timezone || DEFAULT_TIME_ZONE,
    romanizationVisible: coachPrefs?.romanization_mode === "never" ? false : beginner,
  }
}

async function fetchByDate(userId: string, studyDate: string): Promise<DailyStudyPlan | null> {
  const { data, error } = await supabase
    .from("kori_daily_study_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .maybeSingle()
  if (error) throw error
  return data ? toPlan(data as PlanRow) : null
}

function databasePatch(patch: DailyStudyPlanPatch): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.mode !== undefined) row.mode = patch.mode
  if (patch.topicKey !== undefined) row.topic_key = patch.topicKey
  if (patch.topicLabel !== undefined) row.topic_label = patch.topicLabel
  if (patch.romanizationVisible !== undefined) row.romanization_visible = patch.romanizationVisible
  if (patch.activities !== undefined) row.activities = patch.activities
  if (patch.content !== undefined) row.content = patch.content
  if (patch.attempts !== undefined) row.attempts = patch.attempts
  if (patch.reflection !== undefined) row.reflection = patch.reflection
  if (patch.missionResult !== undefined) row.mission_result = patch.missionResult
  if (patch.totalFocusSeconds !== undefined) row.total_focus_seconds = patch.totalFocusSeconds
  if (patch.speakingSeconds !== undefined) row.speaking_seconds = patch.speakingSeconds
  return row
}

export const dailyStudyPlanApi = {
  getOrCreateToday: async (): Promise<DailyStudyPlan> => {
    const userId = requireUserId()
    const settings = await profileSettings()
    const studyDate = dateKeyInTimeZone(new Date(), settings.timezone)
    const existing = await fetchByDate(userId, studyDate)
    if (existing) return existing

    const { data: latest } = await supabase
      .from("kori_daily_study_plans")
      .select("mode, romanization_visible")
      .eq("user_id", userId)
      .order("study_date", { ascending: false })
      .limit(1)
      .maybeSingle()
    const mode = dailyStudyModeSchema.catch("normal").parse(latest?.mode)
    const topic = topicForDate(new Date(), settings.timezone)

    const { data, error } = await supabase
      .from("kori_daily_study_plans")
      .insert({
        user_id: userId,
        study_date: studyDate,
        mode,
        topic_key: topic.key,
        topic_label: topic.label,
        romanization_visible: latest?.romanization_visible ?? settings.romanizationVisible,
        activities: generateModeSchedule(mode),
        content: buildDailyStudyContent(topic.key, studyDate),
      })
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        const winner = await fetchByDate(userId, studyDate)
        if (winner) return winner
      }
      throw error
    }
    return toPlan(data as PlanRow)
  },

  update: async (planId: string, rawPatch: DailyStudyPlanPatch): Promise<DailyStudyPlan> => {
    const patch = dailyStudyPlanPatchSchema.parse(rawPatch)
    const { data, error } = await supabase
      .from("kori_daily_study_plans")
      .update(databasePatch(patch))
      .eq("id", planId)
      .select("*")
      .single()
    if (error) throw error
    return toPlan(data as PlanRow)
  },

  getWeeklyProgress: async (): Promise<{
    studiedDays: number
    focusedMinutes: number
    completedActivities: number
  }> => {
    const settings = await profileSettings()
    const today = dateKeyInTimeZone(new Date(), settings.timezone)
    const start = new Date(`${today}T12:00:00+09:00`)
    start.setDate(start.getDate() - 6)
    const fromDate = dateKeyInTimeZone(start, settings.timezone)
    const { data, error } = await supabase
      .from("kori_daily_study_plans")
      .select("activities, total_focus_seconds")
      .gte("study_date", fromDate)
      .lte("study_date", today)
    if (error) throw error
    const rows = data ?? []
    return {
      studiedDays: rows.filter((row) => (row.total_focus_seconds ?? 0) > 0).length,
      focusedMinutes: Math.floor(rows.reduce((sum, row) => sum + (row.total_focus_seconds ?? 0), 0) / 60),
      completedActivities: rows.reduce((sum, row) => {
        const activities = z.array(dailyStudyActivitySchema).safeParse(row.activities)
        return sum + (activities.success ? activities.data.filter((item) => item.status === "completed").length : 0)
      }, 0),
    }
  },
}
