import { z } from "zod"

export const trackingModeSchema = z.enum([
  "abstinence",
  "frequency_reduction",
  "time_reduction",
  "personal_limit",
  "awareness",
])

export const triggerCategorySchema = z.enum([
  "emotion",
  "time",
  "location",
  "device",
  "content_source",
  "situation",
  "sleep",
  "stress",
  "social_connection",
  "previous_activity",
])

export const recoveryBaselineSchema = z.object({
  approximateFrequency: z.number().int().min(0).max(1000).optional(),
  frequencyPeriod: z.enum(["day", "week", "month"]).optional(),
  commonTime: z.string().trim().max(80).optional(),
  commonLocation: z.string().trim().max(80).optional(),
  commonDevice: z.string().trim().max(80).optional(),
  commonEmotion: z.string().trim().max(80).optional(),
  affectedAreas: z.array(z.string().trim().max(60)).max(10).optional(),
})

export const recoveryTargetInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  replacementBehavior: z.string().trim().max(120).optional(),
  trackingMode: trackingModeSchema,
  recoveryStatement: z.string().trim().min(1).max(300),
  reasons: z.array(z.string().trim().min(1).max(80)).max(10),
  baseline: recoveryBaselineSchema.optional(),
  personalLimit: z.number().min(0).max(10000).optional(),
})

export const recoveryTargetSchema = recoveryTargetInputSchema.extend({
  id: z.uuid(),
  onboardingCompletedAt: z.iso.datetime().optional(),
  startedAt: z.iso.datetime(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
})

export const triggerTagInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  category: triggerCategorySchema.default("situation"),
})

export const triggerTagSchema = triggerTagInputSchema.extend({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
})

export const dailyCheckInInputSchema = z.object({
  date: z.iso.date(),
  period: z.enum(["morning", "evening", "minimal"]),
  mood: z.string().trim().max(60).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(5).optional(),
  riskLevel: z.number().int().min(1).max(5).optional(),
  importantGoal: z.string().trim().max(160).optional(),
  protectionAction: z.string().trim().max(160).optional(),
  intention: z.string().trim().max(300).optional(),
  currentUrge: z.number().int().min(1).max(10).optional(),
  strongestUrge: z.number().int().min(1).max(10).optional(),
  copingStrategy: z.string().trim().max(160).optional(),
  healthyHabitsCompleted: z.array(z.string().trim().max(80)).max(20).default([]),
  targetOccurred: z.boolean().optional(),
  lesson: z.string().trim().max(400).optional(),
  win: z.string().trim().max(300).optional(),
  nextAction: z.string().trim().max(200).optional(),
})

export const dailyCheckInSchema = dailyCheckInInputSchema.extend({
  id: z.uuid(),
  habitId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const urgeEventInputSchema = z.object({
  kind: z.enum(["moment", "slip", "win"]),
  intensity: z.number().int().min(1).max(10).optional(),
  triggerId: z.uuid().optional(),
  emotion: z.string().trim().max(60).optional(),
  location: z.string().trim().max(80).optional(),
  device: z.string().trim().max(80).optional(),
  situation: z.string().trim().max(160).optional(),
  previousActivity: z.string().trim().max(120).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  stressLevel: z.number().int().min(1).max(5).optional(),
  actionTaken: z.string().trim().max(160).optional(),
  healthyActionCompleted: z.boolean().optional(),
  rodeOut: z.boolean().optional(),
  note: z.string().trim().max(600).optional(),
  resolvedAt: z.iso.datetime().optional(),
})

export const urgeIntensitySchema = z.number().int().min(1).max(10)

export const urgeEventSchema = urgeEventInputSchema.extend({
  id: z.uuid(),
  habitId: z.uuid(),
  occurredAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export const lapseEventSchema = urgeEventSchema.extend({ kind: z.literal("slip") })

export const copingActionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(160),
  category: z.enum(["environment", "movement", "learning", "focus", "sleep", "connection", "custom"]),
  href: z.string().trim().max(240).optional(),
  preferred: z.boolean().optional(),
})

export const whenThenPlanInputSchema = z.object({
  ifText: z.string().trim().min(1).max(240),
  thenText: z.string().trim().min(1).max(240),
  sourceEventId: z.uuid().optional(),
})

export const whenThenPlanUpdateSchema = whenThenPlanInputSchema
  .pick({ ifText: true, thenText: true })
  .partial()
  .refine((plan) => plan.ifText !== undefined || plan.thenText !== undefined, "At least one plan field is required.")

export const whenThenPlanSchema = whenThenPlanInputSchema.extend({
  id: z.uuid(),
  habitId: z.uuid(),
  mastery: z.number().int().min(0).max(100),
  nextReview: z.iso.datetime(),
  easeFactor: z.number().positive(),
  intervalDays: z.number().int().nonnegative(),
  repetitions: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  active: z.boolean(),
  reminderEnabled: z.boolean(),
  createdAt: z.iso.datetime(),
})

export const protectionItemInputSchema = z.object({
  category: z.enum(["phone", "computer", "daily_environment"]),
  label: z.string().trim().min(1).max(160),
  status: z.enum(["not_set", "planned", "active", "needs_improvement"]),
  preferredAction: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(1000).default(0),
})

export const protectionItemSchema = protectionItemInputSchema.extend({
  id: z.uuid(),
  habitId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const reviewStatisticSchema = z.union([z.number(), z.string(), z.null()])

export const weeklyReviewInputSchema = z.object({
  weekStart: z.iso.date(),
  statistics: z.record(z.string(), reviewStatisticSchema),
  summary: z.string().trim().max(600).optional(),
  experiment: z.string().trim().max(240).optional(),
  aiSummary: z.string().trim().max(1200).optional(),
  aiConsentAt: z.iso.datetime().optional(),
}).refine((review) => !review.aiSummary || Boolean(review.aiConsentAt), {
  message: "AI summaries require an explicit consent timestamp.",
  path: ["aiConsentAt"],
})

export const weeklyReviewSchema = weeklyReviewInputSchema.safeExtend({
  id: z.uuid(),
  habitId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const recoveryPrivacySettingsSchema = z.object({
  lockEnabled: z.boolean(),
  discreetNotifications: z.boolean(),
  customNotificationText: z.string().trim().max(120).optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  morningReminder: z.boolean(),
  eveningReminder: z.boolean(),
  riskTimeReminder: z.boolean(),
  bedtimeReminder: z.boolean(),
  weeklyReviewReminder: z.boolean(),
  aiConsent: z.boolean(),
})

export const recoveryDashboardSummarySchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  recoveryDaysThisMonth: z.number().int().nonnegative(),
  urgesManaged: z.number().int().nonnegative(),
  healthyActionsCompleted: z.number().int().nonnegative(),
  checkInConsistency: z.number().min(0).max(100),
  momentum: z.number().min(0).max(100),
  momentumFactors: z.array(z.object({
    key: z.enum(["check_ins", "managed_urges", "healthy_actions", "honest_reflections", "fast_returns"]),
    label: z.string(),
    points: z.number().nonnegative(),
    maximum: z.number().positive(),
    explanation: z.string(),
  })),
  averageUrgeIntensity: z.number().min(1).max(10).nullable(),
  highestRiskWindow: z.object({ startHour: z.number().int().min(0).max(23), endHour: z.number().int().min(0).max(23), count: z.number().int().positive() }).nullable(),
  averageReturnHours: z.number().nonnegative().nullable(),
})

export const recoveryCoachInputSchema = z.object({
  consent: z.literal(true),
  mode: z.enum(["coach", "urge", "plan", "review"]),
  intensity: z.number().int().min(1).max(10).optional(),
  emotion: z.string().trim().max(60).optional(),
  trigger: z.string().trim().max(100).optional(),
  availableMinutes: z.number().int().min(1).max(60).optional(),
  largerGoal: z.string().trim().max(160).optional(),
  preferredActions: z.array(z.string().trim().max(100)).max(8).default([]),
})

export type RecoveryTargetInput = z.infer<typeof recoveryTargetInputSchema>
export type DailyCheckInInput = z.infer<typeof dailyCheckInInputSchema>
export type UrgeEventInput = z.infer<typeof urgeEventInputSchema>
export type ProtectionItemInput = z.infer<typeof protectionItemInputSchema>
export type TriggerTagInput = z.infer<typeof triggerTagInputSchema>
export type WhenThenPlanInput = z.infer<typeof whenThenPlanInputSchema>
export type WeeklyReviewInput = z.infer<typeof weeklyReviewInputSchema>
