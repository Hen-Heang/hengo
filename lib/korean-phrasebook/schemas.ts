import { z } from "zod"

// Shared Zod schemas for the Phrasebook domain — used by the create/edit
// form, JSON/CSV import validation, and the speaking-evaluation AI route's
// input/output. Kept separate from lib/types.ts (plain TS interfaces) so
// runtime validation lives in one place instead of duplicated ad hoc.

// 해요체 is polite, not casual — the brief is explicit that this must never
// be mislabeled. Only two registers are supported for Phrasebook content.
export const phraseRegisterSchema = z.enum(["formal", "polite"])

export const phraseDifficultySchema = z.enum(["easy", "medium", "hard"])

export const phraseCategorySchema = z.string().trim().min(1).max(40)

export const phraseSituationSchema = z.string().trim().min(1).max(60)

export const phraseQuestionSchema = z.object({
  korean: z.string().trim().min(1).max(300),
  romanization: z.string().trim().min(1).max(300),
  english: z.string().trim().min(1).max(300),
  register: phraseRegisterSchema,
})

export const phraseAnswerSchema = z.object({
  korean: z.string().trim().min(1).max(300),
  romanization: z.string().trim().min(1).max(300),
  english: z.string().trim().min(1).max(300),
  register: phraseRegisterSchema,
  usageNote: z.string().trim().max(500).optional(),
  isRecommended: z.boolean(),
})

export const phraseVocabularyItemSchema = z.object({
  korean: z.string().trim().min(1).max(80),
  english: z.string().trim().min(1).max(120),
})

// Full card content — shared by the create/edit form, seed data validation,
// and import row validation. `answers` requires at least one recommended
// answer so review/learn mode always has something to show as "the" answer.
export const phraseCardContentSchema = z.object({
  category: phraseCategorySchema,
  situation: phraseSituationSchema,
  difficulty: phraseDifficultySchema.default("medium"),
  question: phraseQuestionSchema,
  questionVariants: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
  answers: z
    .array(phraseAnswerSchema)
    .min(1)
    .max(6)
    .refine((answers) => answers.some((a) => a.isRecommended), {
      message: "At least one answer must be marked recommended",
    }),
  usageNote: z.string().trim().max(1000).optional(),
  vocabulary: z.array(phraseVocabularyItemSchema).max(20).default([]),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
})

export type PhraseCardContentInput = z.infer<typeof phraseCardContentSchema>

export const phraseCollectionInputSchema = z.object({
  titleKo: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  category: phraseCategorySchema,
})

// ── Import (JSON / CSV) ─────────────────────────────────────────────────────

// A flattened row shape for CSV/JSON import — one answer per row (the
// importer groups rows sharing the same question into one card when
// question fields match exactly). Every teaching field beyond the question/
// answer pair is optional so a minimal import still works.
export const phraseImportRowSchema = z.object({
  category: phraseCategorySchema,
  situation: phraseSituationSchema,
  difficulty: phraseDifficultySchema.optional(),
  questionKorean: z.string().trim().min(1).max(300),
  questionRomanization: z.string().trim().max(300).optional(),
  questionEnglish: z.string().trim().max(300).optional(),
  questionRegister: phraseRegisterSchema.optional(),
  answerKorean: z.string().trim().min(1).max(300),
  answerRomanization: z.string().trim().max(300).optional(),
  answerEnglish: z.string().trim().max(300).optional(),
  answerRegister: phraseRegisterSchema.optional(),
  usageNote: z.string().trim().max(1000).optional(),
  // Raw CSV/JSON carries tags as a pipe-separated string or a JSON array;
  // lib/korean-phrasebook/import.ts's coerceTags() normalizes either into
  // string[] before this schema runs.
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
})

export type PhraseImportRow = z.infer<typeof phraseImportRowSchema>

// ── Speaking-evaluation AI route ────────────────────────────────────────────

// Client -> server. Deliberately just an id + transcript: the expected
// question/answers are never accepted from the client, only looked up
// server-side by phraseId through the caller's RLS-scoped client.
export const phraseEvaluateInputSchema = z.object({
  phraseId: z.string().uuid(),
  transcript: z.string().trim().min(1).max(1000),
})

// Server -> client (also the AI's structured output schema).
export const phraseEvaluateOutputSchema = z.object({
  communicationSuccess: z.boolean(),
  correctedSentence: z.string(),
  naturalAlternative: z.string(),
  explanation: z.string(),
  vocabulary: z.array(phraseVocabularyItemSchema).max(10),
  retryWords: z.array(z.string()).max(10),
  // Mirrors correctionApi.check's severity split — only "important" mistakes
  // get saved to kori_corrections, so a merely-informal phrasing doesn't
  // clutter the correction notebook.
  mistakeSeverity: z.enum(["none", "minor", "important"]),
})

export type PhraseEvaluateOutput = z.infer<typeof phraseEvaluateOutputSchema>
