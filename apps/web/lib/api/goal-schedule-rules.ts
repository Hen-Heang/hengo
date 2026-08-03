// Schedule rules (Goal Planning & Scheduling) — goal_schedule_rules table plus
// the task-occurrence materialiser. RLS scopes every row to its owning user_id
// (see supabase/migrations/20260724010000_goal_plan_phases_schedule_rules.sql).
//
// Generation is always user-triggered ("Create next 14 days"). There is no cron
// job — see docs/goal-planning-scheduling-audit.md for why, and what a later
// automated pass would need.
import { z } from "zod"

import {
  endTimeFor,
  generateOccurrences,
  rollingWindow,
  scheduleRuleInputSchema,
  OCCURRENCE_WINDOW_DAYS,
  type GoalScheduleRule,
  type OccurrenceWindow,
  type ScheduleRuleInput,
} from "@/lib/goal-schedule-rules"
import type { Task } from "@/lib/tasks"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

export type CreateScheduleRulePayload = ScheduleRuleInput & { goal_id: string }
export type UpdateScheduleRulePayload = Partial<ScheduleRuleInput>

// Partial patch schema: every field optional, but the field-level rules (and
// the end-after-start pairing when both dates are present) still apply.
// `scheduleRuleInputSchema.partial()` can't be used — Zod drops the
// cross-field refinements when you partial() a refined object.
const scheduleRulePatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullish(),
    phase_id: z.string().uuid().nullish(),
    key_result_id: z.string().uuid().nullish(),
    recurrence_type: z.enum(["daily", "weekly", "monthly"]).optional(),
    recurrence_interval: z.number().int().min(1).max(52).optional(),
    days_of_week: z.array(z.number().int().min(0).max(6)).nullish(),
    day_of_month: z.number().int().min(1).max(31).nullish(),
    start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).nullish(),
    duration_minutes: z.number().int().positive().max(1440).nullish(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    timezone: z.string().min(1).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: "A routine can't end before it starts",
    path: ["end_date"],
  })

export interface GenerateOccurrencesResult {
  /** Dates the rule fires on inside the window (after the goal-window clamp). */
  occurrences: string[]
  /** Dates that already had a task — skipped, never duplicated. */
  skipped: string[]
  created: Task[]
}

const todayYmd = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export const scheduleRulesApi = {
  listForGoal: async (goalId: string): Promise<GoalScheduleRule[]> => {
    const { data, error } = await supabase
      .from("goal_schedule_rules")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: true })
    if (error) throw error
    return data as GoalScheduleRule[]
  },

  create: async (payload: CreateScheduleRulePayload): Promise<GoalScheduleRule> => {
    const { goal_id, ...rest } = payload
    const input = scheduleRuleInputSchema.parse(rest)
    const { data, error } = await supabase
      .from("goal_schedule_rules")
      .insert({ user_id: requireUserId(), goal_id, ...input })
      .select()
      .single()
    if (error) throw error
    return data as GoalScheduleRule
  },

  update: async (id: string, payload: UpdateScheduleRulePayload): Promise<GoalScheduleRule> => {
    const parsed = scheduleRulePatchSchema.parse(payload)
    const { data, error } = await supabase
      .from("goal_schedule_rules")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return data as GoalScheduleRule
  },

  pause: async (id: string): Promise<GoalScheduleRule> =>
    scheduleRulesApi.update(id, { active: false }),

  reactivate: async (id: string): Promise<GoalScheduleRule> =>
    scheduleRulesApi.update(id, { active: true }),

  remove: async (id: string): Promise<void> => {
    // Detach generated tasks rather than cascading — a routine you delete
    // shouldn't silently erase sessions you already did.
    const { error: detachError } = await supabase
      .from("tasks")
      .update({ schedule_rule_id: null })
      .eq("schedule_rule_id", id)
    if (detachError) throw detachError
    const { error } = await supabase.from("goal_schedule_rules").delete().eq("id", id)
    if (error) throw error
  },

  /**
   * Dates this rule would create tasks for, without writing anything.
   * `goalStartDate`/`goalTargetDate` clamp the result to the goal's window.
   */
  previewOccurrences: (
    rule: GoalScheduleRule,
    options: {
      window?: OccurrenceWindow
      goalStartDate?: string | null
      goalTargetDate?: string | null
      days?: number
    } = {},
  ): string[] =>
    generateOccurrences(rule, options.window ?? rollingWindow(todayYmd(), options.days ?? OCCURRENCE_WINDOW_DAYS), {
      goalStartDate: options.goalStartDate,
      goalTargetDate: options.goalTargetDate,
    }),

  /**
   * Materialise the rule's occurrences into `tasks` for the rolling window.
   * Idempotent: existing (schedule_rule_id, occurrence_date) rows are read
   * first and skipped, and the DB carries a matching partial unique index as
   * the real guarantee if two clients race.
   */
  generateOccurrences: async (
    rule: GoalScheduleRule,
    options: {
      window?: OccurrenceWindow
      goalStartDate?: string | null
      goalTargetDate?: string | null
      days?: number
    } = {},
  ): Promise<GenerateOccurrencesResult> => {
    const occurrences = scheduleRulesApi.previewOccurrences(rule, options)
    if (occurrences.length === 0) return { occurrences, skipped: [], created: [] }

    const { data: existingRows, error: existingError } = await supabase
      .from("tasks")
      .select("occurrence_date")
      .eq("schedule_rule_id", rule.id)
      .in("occurrence_date", occurrences)
    if (existingError) throw existingError

    const existing = new Set(
      ((existingRows ?? []) as { occurrence_date: string | null }[])
        .map((r) => r.occurrence_date)
        .filter((d): d is string => !!d),
    )
    const pending = occurrences.filter((d) => !existing.has(d))
    if (pending.length === 0) {
      return { occurrences, skipped: [...existing], created: [] }
    }

    const userId = requireUserId()
    const duration = rule.duration_minutes ?? null
    const startTime = rule.start_time ? rule.start_time.slice(0, 5) : null
    const rows = pending.map((date) => ({
      user_id: userId,
      goal_id: rule.goal_id,
      title: rule.title,
      description: rule.description ?? "",
      start_date: date,
      end_date: date,
      daily_start_time: startTime,
      daily_end_time: startTime && duration ? endTimeFor(startTime, duration) : null,
      is_anytime: !startTime,
      duration_minutes: duration,
      effort_minutes: duration,
      phase_id: rule.phase_id,
      key_result_id: rule.key_result_id,
      schedule_rule_id: rule.id,
      occurrence_date: date,
      scheduling_source: "recurring_rule" as const,
    }))

    const { data, error } = await supabase.from("tasks").insert(rows).select()
    if (error) throw error
    return { occurrences, skipped: [...existing], created: (data ?? []) as Task[] }
  },
}
