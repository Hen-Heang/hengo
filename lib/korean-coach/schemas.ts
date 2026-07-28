import { z } from "zod"

export const koreanCoachLevelSchema = z.enum(["beginner", "lower-intermediate", "intermediate"])
export const koreanScenarioCategorySchema = z.enum(["workplace", "daily"])
export const correctionStrictnessSchema = z.enum(["gentle", "balanced", "detailed"])
export const romanizationModeSchema = z.enum(["always", "on-request", "never"])
export const koreanLearningGoalSchema = z.enum(["workplace", "daily-life", "presentation", "general"])
export const speechSpeedSchema = z.union([z.literal(0.75), z.literal(1), z.literal(1.25)])
export const koreanCoachPracticeModeSchema = z.enum(["speaking", "listening"])

export const koreanPhraseSchema = z.object({
  korean: z.string().trim().min(1).max(300),
  romanization: z.string().trim().max(500).default(""),
  english: z.string().trim().min(1).max(500),
})

export const usefulVocabularySchema = z.object({
  korean: z.string().trim().min(1).max(100),
  meaning: z.string().trim().min(1).max(200),
})

export const koreanScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  koreanTitle: z.string().trim().min(1).max(100),
  englishTitle: z.string().trim().min(1).max(120),
  category: koreanScenarioCategorySchema,
  difficulty: koreanCoachLevelSchema,
  description: z.string().trim().min(1).max(400),
  learningObjectives: z.array(z.string().trim().min(1).max(200)).min(1).max(5),
  usefulVocabulary: z.array(usefulVocabularySchema).min(2).max(8),
  estimatedMinutes: z.number().int().min(3).max(30),
  openingMessage: koreanPhraseSchema,
  hint: z.string().trim().min(1).max(300),
})

export const mistakeTypeSchema = z.enum(["grammar", "vocabulary", "naturalness", "communication"])
export const coachMistakeSchema = z.object({
  type: mistakeTypeSchema,
  original: z.string().trim().min(1).max(500),
  correction: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(600),
  important: z.boolean().default(false),
})

const scoredObservationSchema = z.object({
  score: z.number().int().min(0).max(100),
  explanation: z.string().trim().min(1).max(600),
})

export const koreanTutorFeedbackSchema = z.object({
  transcript: z.string().trim().min(1).max(2000),
  understoodMeaning: z.string().trim().min(1).max(1000),
  taskCompleted: z.boolean(),
  feedback: z.object({
    summary: z.string().trim().min(1).max(600),
    grammar: z.object({
      isCorrect: z.boolean(),
      explanation: z.string().trim().min(1).max(600),
    }),
    naturalness: scoredObservationSchema,
    vocabulary: scoredObservationSchema,
    communication: scoredObservationSchema,
    fluencyObservation: z.string().trim().min(1).max(500),
    wordsToRetry: z.array(z.string().trim().min(1).max(100)).max(8),
  }),
  correctedSentence: koreanPhraseSchema,
  alternativeSentence: koreanPhraseSchema,
  mistakes: z.array(coachMistakeSchema).max(8),
  nextTutorMessage: koreanPhraseSchema,
  strongPoint: z.string().trim().min(1).max(300),
  recommendedImprovement: z.string().trim().min(1).max(300),
  newVocabulary: z.array(usefulVocabularySchema).max(8),
})

export const feedbackRequestSchema = z.object({
  scenarioId: z.string().regex(/^[a-z0-9-]+$/),
  transcript: z.string().trim().min(1).max(2000),
  tutorMessage: koreanPhraseSchema,
  turn: z.number().int().min(1).max(20),
  correctionStrictness: correctionStrictnessSchema.default("balanced"),
})

export const speechRequestSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  speed: speechSpeedSchema.default(1),
})

export const koreanCoachPreferencesSchema = z.object({
  level: koreanCoachLevelSchema.default("beginner"),
  mainGoal: koreanLearningGoalSchema.default("workplace"),
  explanationLanguage: z.literal("English").default("English"),
  romanizationMode: romanizationModeSchema.default("on-request"),
  defaultSpeechSpeed: speechSpeedSchema.default(0.75),
  dailyPracticeGoalMinutes: z.number().int().min(5).max(120).default(10),
  preferredPracticeDurationMinutes: z.number().int().min(5).max(60).default(10),
  correctionStrictness: correctionStrictnessSchema.default("balanced"),
})

export const koreanSessionSummarySchema = z.object({
  durationSeconds: z.number().int().min(0).max(86_400),
  speakingAttempts: z.number().int().min(0).max(100),
  completedTurns: z.number().int().min(0).max(20),
  newVocabulary: z.array(usefulVocabularySchema).max(20),
  mainCorrection: z.string().trim().max(500),
  strongPoint: z.string().trim().max(500),
  recommendedImprovement: z.string().trim().max(500),
  mistakesSaved: z.number().int().min(0).max(100),
  suggestedNextScenarioId: z.string().regex(/^[a-z0-9-]+$/).nullable(),
})

export type KoreanCoachLevel = z.infer<typeof koreanCoachLevelSchema>
export type KoreanScenarioCategory = z.infer<typeof koreanScenarioCategorySchema>
export type CorrectionStrictness = z.infer<typeof correctionStrictnessSchema>
export type RomanizationMode = z.infer<typeof romanizationModeSchema>
export type KoreanLearningGoal = z.infer<typeof koreanLearningGoalSchema>
export type SpeechSpeed = z.infer<typeof speechSpeedSchema>
export type KoreanCoachPracticeMode = z.infer<typeof koreanCoachPracticeModeSchema>
export type KoreanPhrase = z.infer<typeof koreanPhraseSchema>
export type KoreanScenario = z.infer<typeof koreanScenarioSchema>
export type KoreanTutorFeedback = z.infer<typeof koreanTutorFeedbackSchema>
export type CoachMistake = z.infer<typeof coachMistakeSchema>
export type KoreanCoachPreferences = z.infer<typeof koreanCoachPreferencesSchema>
export type KoreanSessionSummary = z.infer<typeof koreanSessionSummarySchema>
