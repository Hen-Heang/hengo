import { z } from "zod"

export const dailyStudyModeSchema = z.enum(["busy", "normal", "office"])
export const dailyActivityStatusSchema = z.enum(["pending", "active", "completed", "skipped"])
export const dailyActivityTypeSchema = z.enum([
  "review",
  "shadowing",
  "vocabulary",
  "roleplay",
  "correction_retry",
])

export const dailyStudyExpressionSchema = z.object({
  id: z.string(),
  korean: z.string(),
  romanization: z.string(),
  english: z.string(),
  usageNote: z.string(),
  example: z.string(),
  exampleRomanization: z.string(),
  exampleEnglish: z.string(),
  difficulty: z.enum(["beginner", "beginner-plus"]),
  category: z.enum(["workplace", "daily-life"]),
})

export const dailyStudyActivitySchema = z.object({
  id: z.string(),
  type: dailyActivityTypeSchema,
  title: z.string(),
  description: z.string(),
  plannedStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  estimatedMinutes: z.number().int().positive().max(180),
  completedSeconds: z.number().int().nonnegative(),
  status: dailyActivityStatusSchema,
  skipReason: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
})

export const dailySpokenQuestionSchema = z.object({
  id: z.string(),
  korean: z.string(),
  romanization: z.string(),
  english: z.string(),
  hint: z.string(),
  modelAnswer: z.string(),
  category: z.enum(["workplace", "daily-life"]),
  register: z.enum(["해요체", "합니다체"]),
})

export const dailyStudyContentSchema = z.object({
  reviewCards: z.array(dailyStudyExpressionSchema).length(5),
  usefulWords: z.array(dailyStudyExpressionSchema).length(5),
  practicalExpressions: z.array(dailyStudyExpressionSchema).length(3),
  dialogue: z.object({
    title: z.string(),
    situation: z.string(),
    lines: z
      .array(
        z.object({
          speaker: z.string(),
          korean: z.string(),
          romanization: z.string(),
          english: z.string(),
        }),
      )
      .min(1),
  }),
  roleplay: z.object({
    scenario: z.string(),
    learnerRole: z.string(),
    coachRole: z.string(),
  }),
  spokenQuestions: z.array(dailySpokenQuestionSchema).length(5),
  realWorldMission: z.string(),
  reflectionPrompt: z.string(),
})

export const dailySpeakingFeedbackSchema = z.object({
  originalAnswer: z.string(),
  correctedAnswer: z.string(),
  naturalAlternative: z.string(),
  shortExplanation: z.string(),
  errorCategory: z.enum(["grammar", "vocabulary", "politeness", "naturalness", "meaning", "none"]),
  vocabularyToReview: z
    .array(
      z.object({
        korean: z.string(),
        english: z.string(),
      }),
    )
    .max(5),
  retryRequest: z.string(),
  communicationSuccessful: z.boolean(),
})

export const dailySpeakingAttemptSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  transcript: z.string(),
  feedback: dailySpeakingFeedbackSchema,
  retryOf: z.string().nullable(),
  successfulRetry: z.boolean(),
  createdAt: z.string(),
})

export const dailyStudyPlanPatchSchema = z.object({
  mode: dailyStudyModeSchema.optional(),
  topicKey: z.string().min(1).max(100).optional(),
  topicLabel: z.string().min(1).max(300).optional(),
  romanizationVisible: z.boolean().optional(),
  activities: z.array(dailyStudyActivitySchema).min(1).max(8).optional(),
  content: dailyStudyContentSchema.optional(),
  attempts: z.array(dailySpeakingAttemptSchema).max(100).optional(),
  reflection: z.string().max(4000).optional(),
  missionResult: z.string().max(2000).optional(),
  totalFocusSeconds: z.number().int().nonnegative().optional(),
  speakingSeconds: z.number().int().nonnegative().optional(),
})
