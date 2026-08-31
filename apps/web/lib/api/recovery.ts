import type {
  DailyCheckIn,
  ProtectionItem,
  RecoveryBaseline,
  RecoveryEvent,
  RecoveryEventKind,
  RecoveryHabit,
  RecoveryPlan,
  RecoveryPrivacySettings,
  RecoveryTrigger,
  TrackingMode,
  TriggerCategory,
  WeeklyReview,
} from "@/lib/types"
import {
  dailyCheckInInputSchema,
  protectionItemInputSchema,
  recoveryPrivacySettingsSchema,
  recoveryTargetInputSchema,
  triggerCategorySchema,
  triggerTagInputSchema,
  urgeEventInputSchema,
  weeklyReviewInputSchema,
  whenThenPlanInputSchema,
  whenThenPlanUpdateSchema,
  type DailyCheckInInput,
  type ProtectionItemInput,
  type RecoveryTargetInput,
  type UrgeEventInput,
} from "@/lib/recovery-schemas"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Recovery over kori_focus_*. The table names predate the Growth-workspace
// rename (Focus -> Recovery) and hold live user data, so they were left
// alone — only the app-facing names changed. All access goes through this
// file — components and hooks never query Supabase directly.

type HabitRow = {
  id: string
  label: string
  replacement_behavior: string | null
  tracking_mode: TrackingMode | null
  recovery_statement: string | null
  reasons: string[] | null
  baseline: RecoveryBaseline | null
  personal_limit: number | null
  onboarding_completed_at: string | null
  started_at: string
  active: boolean
  created_at: string
}

function toHabit(row: HabitRow): RecoveryHabit {
  return {
    id: row.id,
    label: row.label,
    replacementBehavior: row.replacement_behavior ?? undefined,
    trackingMode: row.tracking_mode ?? "awareness",
    recoveryStatement: row.recovery_statement ?? undefined,
    reasons: row.reasons ?? [],
    baseline: row.baseline ?? undefined,
    personalLimit: row.personal_limit ?? undefined,
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    startedAt: row.started_at,
    active: row.active,
    createdAt: row.created_at,
  }
}

type TriggerRow = {
  id: string
  label: string
  category: TriggerCategory | null
  created_at: string
}

function toTrigger(row: TriggerRow): RecoveryTrigger {
  return {
    id: row.id,
    label: row.label,
    category: row.category ?? "situation",
    createdAt: row.created_at,
  }
}

type EventRow = {
  id: string
  habit_id: string
  occurred_at: string
  kind: RecoveryEventKind
  intensity: number | null
  trigger_id: string | null
  emotion: string | null
  location: string | null
  device: string | null
  situation: string | null
  previous_activity: string | null
  sleep_quality: number | null
  stress_level: number | null
  action_taken: string | null
  healthy_action_completed: boolean | null
  rode_out: boolean | null
  note: string | null
  resolved_at: string | null
  created_at: string
}

function toEvent(row: EventRow): RecoveryEvent {
  return {
    id: row.id,
    habitId: row.habit_id,
    occurredAt: row.occurred_at,
    kind: row.kind,
    intensity: row.intensity ?? undefined,
    triggerId: row.trigger_id ?? undefined,
    emotion: row.emotion ?? undefined,
    location: row.location ?? undefined,
    device: row.device ?? undefined,
    situation: row.situation ?? undefined,
    previousActivity: row.previous_activity ?? undefined,
    sleepQuality: row.sleep_quality ?? undefined,
    stressLevel: row.stress_level ?? undefined,
    actionTaken: row.action_taken ?? undefined,
    healthyActionCompleted: row.healthy_action_completed ?? undefined,
    rodeOut: row.rode_out ?? undefined,
    note: row.note ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    createdAt: row.created_at,
  }
}

type PlanRow = {
  id: string
  habit_id: string
  if_text: string
  then_text: string
  source_event_id: string | null
  mastery: number
  next_review: string
  ease_factor: number
  interval_days: number
  repetitions: number
  lapses: number
  active: boolean | null
  reminder_enabled: boolean | null
  created_at: string
}

function toPlan(row: PlanRow): RecoveryPlan {
  return {
    id: row.id,
    habitId: row.habit_id,
    ifText: row.if_text,
    thenText: row.then_text,
    sourceEventId: row.source_event_id ?? undefined,
    mastery: row.mastery,
    nextReview: row.next_review,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
    active: row.active ?? true,
    reminderEnabled: row.reminder_enabled ?? false,
    createdAt: row.created_at,
  }
}

type DailyCheckInRow = {
  id: string
  habit_id: string
  local_date: string
  period: DailyCheckIn["period"]
  mood: string | null
  sleep_quality: number | null
  energy: number | null
  stress: number | null
  risk_level: number | null
  important_goal: string | null
  protection_action: string | null
  intention: string | null
  current_urge: number | null
  strongest_urge: number | null
  coping_strategy: string | null
  healthy_habits_completed: string[] | null
  target_occurred: boolean | null
  lesson: string | null
  win: string | null
  next_action: string | null
  created_at: string
  updated_at: string
}

function toDailyCheckIn(row: DailyCheckInRow): DailyCheckIn {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.local_date,
    period: row.period,
    mood: row.mood ?? undefined,
    sleepQuality: row.sleep_quality ?? undefined,
    energy: row.energy ?? undefined,
    stress: row.stress ?? undefined,
    riskLevel: row.risk_level ?? undefined,
    importantGoal: row.important_goal ?? undefined,
    protectionAction: row.protection_action ?? undefined,
    intention: row.intention ?? undefined,
    currentUrge: row.current_urge ?? undefined,
    strongestUrge: row.strongest_urge ?? undefined,
    copingStrategy: row.coping_strategy ?? undefined,
    healthyHabitsCompleted: row.healthy_habits_completed ?? [],
    targetOccurred: row.target_occurred ?? undefined,
    lesson: row.lesson ?? undefined,
    win: row.win ?? undefined,
    nextAction: row.next_action ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

type ProtectionItemRow = {
  id: string
  habit_id: string
  category: ProtectionItem["category"]
  label: string
  status: ProtectionItem["status"]
  preferred_action: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

function toProtectionItem(row: ProtectionItemRow): ProtectionItem {
  return {
    id: row.id,
    habitId: row.habit_id,
    category: row.category,
    label: row.label,
    status: row.status,
    preferredAction: row.preferred_action,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

type PrivacySettingsRow = {
  lock_enabled: boolean
  discreet_notifications: boolean
  custom_notification_text: string | null
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  morning_reminder: boolean
  evening_reminder: boolean
  risk_time_reminder: boolean
  bedtime_reminder: boolean
  weekly_review_reminder: boolean
  ai_consent: boolean
  updated_at: string
}

const DEFAULT_PRIVACY_SETTINGS: RecoveryPrivacySettings = {
  lockEnabled: false,
  discreetNotifications: true,
  morningReminder: false,
  eveningReminder: false,
  riskTimeReminder: false,
  bedtimeReminder: false,
  weeklyReviewReminder: false,
  aiConsent: false,
}

function toPrivacySettings(row: PrivacySettingsRow | null): RecoveryPrivacySettings {
  if (!row) return { ...DEFAULT_PRIVACY_SETTINGS }
  return {
    lockEnabled: row.lock_enabled,
    discreetNotifications: row.discreet_notifications,
    customNotificationText: row.custom_notification_text ?? undefined,
    quietHoursStart: row.quiet_hours_start?.slice(0, 5) ?? undefined,
    quietHoursEnd: row.quiet_hours_end?.slice(0, 5) ?? undefined,
    morningReminder: row.morning_reminder,
    eveningReminder: row.evening_reminder,
    riskTimeReminder: row.risk_time_reminder,
    bedtimeReminder: row.bedtime_reminder,
    weeklyReviewReminder: row.weekly_review_reminder,
    aiConsent: row.ai_consent,
    updatedAt: row.updated_at,
  }
}

type WeeklyReviewRow = {
  id: string
  habit_id: string
  week_start: string
  statistics: Record<string, number | string | null>
  summary: string | null
  experiment: string | null
  ai_summary: string | null
  ai_consent_at: string | null
  created_at: string
  updated_at: string
}

function toWeeklyReview(row: WeeklyReviewRow): WeeklyReview {
  return {
    id: row.id,
    habitId: row.habit_id,
    weekStart: row.week_start,
    statistics: row.statistics,
    summary: row.summary ?? undefined,
    experiment: row.experiment ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    aiConsentAt: row.ai_consent_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const recoveryApi = {
  getHabits: async (): Promise<RecoveryHabit[]> => {
    const { data, error } = await supabase
      .from("kori_focus_habits")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as HabitRow[]).map(toHabit)
  },

  addHabit: async (data: RecoveryTargetInput): Promise<RecoveryHabit> => {
    const input = recoveryTargetInputSchema.parse(data)
    const { data: row, error } = await supabase
      .from("kori_focus_habits")
      .insert({
        user_id: requireUserId(),
        label: input.label,
        replacement_behavior: input.replacementBehavior ?? null,
        tracking_mode: input.trackingMode,
        recovery_statement: input.recoveryStatement,
        reasons: input.reasons,
        baseline: input.baseline ?? null,
        personal_limit: input.personalLimit ?? null,
        onboarding_completed_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return toHabit(row as HabitRow)
  },

  updateHabit: async (
    id: string,
    data: {
      label?: string
      replacementBehavior?: string | null
      trackingMode?: TrackingMode
      recoveryStatement?: string | null
      reasons?: string[]
      baseline?: RecoveryBaseline | null
      personalLimit?: number | null
      active?: boolean
    },
  ): Promise<RecoveryHabit> => {
    const { data: row, error } = await supabase
      .from("kori_focus_habits")
      .update({
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.replacementBehavior !== undefined
          ? { replacement_behavior: data.replacementBehavior }
          : {}),
        ...(data.trackingMode !== undefined ? { tracking_mode: data.trackingMode } : {}),
        ...(data.recoveryStatement !== undefined
          ? { recovery_statement: data.recoveryStatement }
          : {}),
        ...(data.reasons !== undefined ? { reasons: data.reasons } : {}),
        ...(data.baseline !== undefined ? { baseline: data.baseline } : {}),
        ...(data.personalLimit !== undefined ? { personal_limit: data.personalLimit } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toHabit(row as HabitRow)
  },

  removeHabit: async (id: string) => {
    const { error } = await supabase.from("kori_focus_habits").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  getTriggers: async (): Promise<RecoveryTrigger[]> => {
    const { data, error } = await supabase
      .from("kori_focus_triggers")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as TriggerRow[]).map(toTrigger)
  },

  addTrigger: async (
    label: string,
    category: TriggerCategory = "situation",
  ): Promise<RecoveryTrigger> => {
    const input = triggerTagInputSchema.parse({ label, category })
    const { data: row, error } = await supabase
      .from("kori_focus_triggers")
      .insert({ user_id: requireUserId(), label: input.label, category: input.category })
      .select()
      .single()
    if (error) throw error
    return toTrigger(row as TriggerRow)
  },

  updateTrigger: async (
    id: string,
    label: string,
    category?: TriggerCategory,
  ): Promise<RecoveryTrigger> => {
    const safeLabel = triggerTagInputSchema.shape.label.parse(label)
    const safeCategory = category === undefined ? undefined : triggerCategorySchema.parse(category)
    const { data: row, error } = await supabase
      .from("kori_focus_triggers")
      .update({
        label: safeLabel,
        ...(safeCategory ? { category: safeCategory } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toTrigger(row as TriggerRow)
  },

  removeTrigger: async (id: string) => {
    const { error } = await supabase.from("kori_focus_triggers").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // Most recent events first, for a single habit — daysSinceLastEvent and
  // rodeOutCount (lib/recovery.ts) both take this as input.
  getEvents: async (habitId: string, limit = 200): Promise<RecoveryEvent[]> => {
    const { data, error } = await supabase
      .from("kori_focus_events")
      .select("*")
      .eq("habit_id", habitId)
      .order("occurred_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as EventRow[]).map(toEvent)
  },

  logEvent: async (habitId: string, data: UrgeEventInput): Promise<RecoveryEvent> => {
    const input = urgeEventInputSchema.parse(data)
    const { data: row, error } = await supabase
      .from("kori_focus_events")
      .insert({
        user_id: requireUserId(),
        habit_id: habitId,
        kind: input.kind,
        intensity: input.intensity ?? null,
        trigger_id: input.triggerId ?? null,
        emotion: input.emotion ?? null,
        location: input.location ?? null,
        device: input.device ?? null,
        situation: input.situation ?? null,
        previous_activity: input.previousActivity ?? null,
        sleep_quality: input.sleepQuality ?? null,
        stress_level: input.stressLevel ?? null,
        action_taken: input.actionTaken ?? null,
        healthy_action_completed: input.healthyActionCompleted ?? null,
        rode_out: input.rodeOut ?? null,
        note: input.note ?? null,
        resolved_at: input.resolvedAt ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toEvent(row as EventRow)
  },

  // Attaches the debrief reflection to the slip event it followed, so it
  // isn't lost — the plan (below) is the actionable takeaway, this is context.
  updateEventNote: async (id: string, note: string): Promise<RecoveryEvent> => {
    const { data: row, error } = await supabase
      .from("kori_focus_events")
      .update({ note })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toEvent(row as EventRow)
  },

  // General edit for a logged event — correcting a mis-tapped intensity,
  // wrong emotion chip, etc. after the fact.
  updateEvent: async (
    id: string,
    data: {
      intensity?: number
      triggerId?: string | null
      emotion?: string | null
      location?: string | null
      device?: string | null
      situation?: string | null
      previousActivity?: string | null
      sleepQuality?: number | null
      stressLevel?: number | null
      actionTaken?: string | null
      healthyActionCompleted?: boolean
      rodeOut?: boolean
      note?: string | null
      resolvedAt?: string | null
    },
  ): Promise<RecoveryEvent> => {
    const { data: row, error } = await supabase
      .from("kori_focus_events")
      .update({
        ...(data.intensity !== undefined ? { intensity: data.intensity } : {}),
        ...(data.triggerId !== undefined ? { trigger_id: data.triggerId } : {}),
        ...(data.emotion !== undefined ? { emotion: data.emotion } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.device !== undefined ? { device: data.device } : {}),
        ...(data.situation !== undefined ? { situation: data.situation } : {}),
        ...(data.previousActivity !== undefined
          ? { previous_activity: data.previousActivity }
          : {}),
        ...(data.sleepQuality !== undefined ? { sleep_quality: data.sleepQuality } : {}),
        ...(data.stressLevel !== undefined ? { stress_level: data.stressLevel } : {}),
        ...(data.actionTaken !== undefined ? { action_taken: data.actionTaken } : {}),
        ...(data.healthyActionCompleted !== undefined
          ? { healthy_action_completed: data.healthyActionCompleted }
          : {}),
        ...(data.rodeOut !== undefined ? { rode_out: data.rodeOut } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.resolvedAt !== undefined ? { resolved_at: data.resolvedAt } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toEvent(row as EventRow)
  },

  removeEvent: async (id: string) => {
    const { error } = await supabase.from("kori_focus_events").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  getPlans: async (habitId: string): Promise<RecoveryPlan[]> => {
    const { data, error } = await supabase
      .from("kori_focus_plans")
      .select("*")
      .eq("habit_id", habitId)
      .order("next_review", { ascending: true })
    if (error) throw error
    return (data as PlanRow[]).map(toPlan)
  },

  addPlan: async (
    habitId: string,
    data: { ifText: string; thenText: string; sourceEventId?: string },
  ): Promise<RecoveryPlan> => {
    const input = whenThenPlanInputSchema.parse(data)
    const { data: row, error } = await supabase
      .from("kori_focus_plans")
      .insert({
        user_id: requireUserId(),
        habit_id: habitId,
        if_text: input.ifText,
        then_text: input.thenText,
        source_event_id: input.sourceEventId ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toPlan(row as PlanRow)
  },

  // Edits the plan's own wording — distinct from ratePlan, which only
  // touches SRS scheduling fields after a rehearsal.
  updatePlan: async (
    id: string,
    data: { ifText?: string; thenText?: string },
  ): Promise<RecoveryPlan> => {
    const input = whenThenPlanUpdateSchema.parse(data)
    const { data: row, error } = await supabase
      .from("kori_focus_plans")
      .update({
        ...(input.ifText !== undefined ? { if_text: input.ifText } : {}),
        ...(input.thenText !== undefined ? { then_text: input.thenText } : {}),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toPlan(row as PlanRow)
  },

  removePlan: async (id: string) => {
    const { error } = await supabase.from("kori_focus_plans").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // Applies an SRS grading result (from lib/recovery.ts's rating adapter over
  // lib/srs.ts) to a plan after the user rehearses it.
  ratePlan: async (
    id: string,
    next: {
      easeFactor: number
      intervalDays: number
      repetitions: number
      lapses: number
      mastery: number
      nextReview: string
    },
  ): Promise<RecoveryPlan> => {
    const { data: row, error } = await supabase
      .from("kori_focus_plans")
      .update({
        ease_factor: next.easeFactor,
        interval_days: next.intervalDays,
        repetitions: next.repetitions,
        lapses: next.lapses,
        mastery: next.mastery,
        next_review: next.nextReview,
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toPlan(row as PlanRow)
  },

  getDailyCheckIns: async (habitId: string, limit = 90): Promise<DailyCheckIn[]> => {
    const { data, error } = await supabase
      .from("kori_focus_daily_checkins")
      .select("*")
      .eq("habit_id", habitId)
      .order("local_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as DailyCheckInRow[]).map(toDailyCheckIn)
  },

  // All habits' daily check-ins in a date range — for the Timeline aggregator
  // (lib/timeline.ts), which needs check-ins across every Recovery habit.
  getDailyCheckInsInRange: async (
    params: { from?: string; to?: string } = {},
  ): Promise<DailyCheckIn[]> => {
    let query = supabase
      .from("kori_focus_daily_checkins")
      .select("*")
      .order("local_date", { ascending: false })
    if (params.from) query = query.gte("local_date", params.from)
    if (params.to) query = query.lte("local_date", params.to)
    const { data, error } = await query
    if (error) throw error
    return (data as DailyCheckInRow[]).map(toDailyCheckIn)
  },

  saveDailyCheckIn: async (habitId: string, data: DailyCheckInInput): Promise<DailyCheckIn> => {
    const input = dailyCheckInInputSchema.parse(data)
    const now = new Date().toISOString()
    const { data: row, error } = await supabase
      .from("kori_focus_daily_checkins")
      .upsert(
        {
          user_id: requireUserId(),
          habit_id: habitId,
          local_date: input.date,
          period: input.period,
          mood: input.mood ?? null,
          sleep_quality: input.sleepQuality ?? null,
          energy: input.energy ?? null,
          stress: input.stress ?? null,
          risk_level: input.riskLevel ?? null,
          important_goal: input.importantGoal ?? null,
          protection_action: input.protectionAction ?? null,
          intention: input.intention ?? null,
          current_urge: input.currentUrge ?? null,
          strongest_urge: input.strongestUrge ?? null,
          coping_strategy: input.copingStrategy ?? null,
          healthy_habits_completed: input.healthyHabitsCompleted,
          target_occurred: input.targetOccurred ?? null,
          lesson: input.lesson ?? null,
          win: input.win ?? null,
          next_action: input.nextAction ?? null,
          updated_at: now,
        },
        { onConflict: "habit_id,local_date,period" },
      )
      .select()
      .single()
    if (error) throw error
    return toDailyCheckIn(row as DailyCheckInRow)
  },

  getProtectionItems: async (habitId: string): Promise<ProtectionItem[]> => {
    const { data, error } = await supabase
      .from("kori_focus_protection_items")
      .select("*")
      .eq("habit_id", habitId)
      .order("sort_order", { ascending: true })
    if (error) throw error
    return (data as ProtectionItemRow[]).map(toProtectionItem)
  },

  saveProtectionItem: async (
    habitId: string,
    data: ProtectionItemInput,
  ): Promise<ProtectionItem> => {
    const input = protectionItemInputSchema.parse(data)
    const { data: row, error } = await supabase
      .from("kori_focus_protection_items")
      .upsert(
        {
          user_id: requireUserId(),
          habit_id: habitId,
          category: input.category,
          label: input.label,
          status: input.status,
          preferred_action: input.preferredAction,
          sort_order: input.sortOrder,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "habit_id,category,label" },
      )
      .select()
      .single()
    if (error) throw error
    return toProtectionItem(row as ProtectionItemRow)
  },

  getPrivacySettings: async (): Promise<RecoveryPrivacySettings> => {
    const { data, error } = await supabase
      .from("kori_focus_privacy_settings")
      .select("*")
      .eq("user_id", requireUserId())
      .maybeSingle()
    if (error) throw error
    return toPrivacySettings(data as PrivacySettingsRow | null)
  },

  savePrivacySettings: async (data: RecoveryPrivacySettings): Promise<RecoveryPrivacySettings> => {
    const input = recoveryPrivacySettingsSchema.parse(data)
    const { data: row, error } = await supabase
      .from("kori_focus_privacy_settings")
      .upsert({
        user_id: requireUserId(),
        lock_enabled: input.lockEnabled,
        discreet_notifications: input.discreetNotifications,
        custom_notification_text: input.customNotificationText ?? null,
        quiet_hours_start: input.quietHoursStart ?? null,
        quiet_hours_end: input.quietHoursEnd ?? null,
        morning_reminder: input.morningReminder,
        evening_reminder: input.eveningReminder,
        risk_time_reminder: input.riskTimeReminder,
        bedtime_reminder: input.bedtimeReminder,
        weekly_review_reminder: input.weeklyReviewReminder,
        ai_consent: input.aiConsent,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return toPrivacySettings(row as PrivacySettingsRow)
  },

  getWeeklyReviews: async (habitId: string, limit = 12): Promise<WeeklyReview[]> => {
    const { data, error } = await supabase
      .from("kori_focus_weekly_reviews")
      .select("*")
      .eq("habit_id", habitId)
      .order("week_start", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as WeeklyReviewRow[]).map(toWeeklyReview)
  },

  saveWeeklyReview: async (
    habitId: string,
    input: Pick<
      WeeklyReview,
      "weekStart" | "statistics" | "summary" | "experiment" | "aiSummary" | "aiConsentAt"
    >,
  ): Promise<WeeklyReview> => {
    const review = weeklyReviewInputSchema.parse(input)
    const { data: row, error } = await supabase
      .from("kori_focus_weekly_reviews")
      .upsert(
        {
          user_id: requireUserId(),
          habit_id: habitId,
          week_start: review.weekStart,
          statistics: review.statistics,
          summary: review.summary ?? null,
          experiment: review.experiment ?? null,
          ai_summary: review.aiSummary ?? null,
          ai_consent_at: review.aiConsentAt ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "habit_id,week_start" },
      )
      .select()
      .single()
    if (error) throw error
    return toWeeklyReview(row as WeeklyReviewRow)
  },

  exportRecoveryData: async () => {
    const tables = [
      "kori_focus_habits",
      "kori_focus_triggers",
      "kori_focus_events",
      "kori_focus_plans",
      "kori_focus_daily_checkins",
      "kori_focus_protection_items",
      "kori_focus_weekly_reviews",
      "kori_focus_support_contacts",
      "kori_focus_privacy_settings",
    ] as const
    const results = await Promise.all(tables.map((table) => supabase.from(table).select("*")))
    const exportData: Record<string, unknown[]> = {}
    results.forEach((result, index) => {
      if (result.error) throw result.error
      exportData[tables[index]] = result.data ?? []
    })
    return { exportedAt: new Date().toISOString(), data: exportData }
  },

  deleteAllRecoveryData: async () => {
    const userId = requireUserId()
    const directTables = [
      "kori_focus_daily_checkins",
      "kori_focus_protection_items",
      "kori_focus_weekly_reviews",
      "kori_focus_plans",
      "kori_focus_events",
      "kori_focus_habits",
      "kori_focus_triggers",
      "kori_focus_support_contacts",
      "kori_focus_privacy_settings",
    ] as const
    for (const table of directTables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId)
      if (error) throw error
    }
    return { deleted: true }
  },
}
