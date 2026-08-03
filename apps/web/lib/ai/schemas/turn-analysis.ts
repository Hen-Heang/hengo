import { z } from "zod"

// Structured grading of one Korean-language chat turn from the learner.
// Used by app/api/ai/chat/stream (inline, after the assistant reply streams)
// to decide what — if anything — gets saved into the correction SRS.

export const TURN_ANALYSIS_MISTAKE_CATEGORIES = [
  "particle",
  "verb_ending",
  "tense",
  "word_order",
  "vocabulary",
  "politeness",
  "spacing",
  "spelling",
  "expression",
] as const

export const turnAnalysisSchema = z.object({
  hasErrors: z.boolean(),
  correctedText: z.string(),
  naturalVersion: z.string(),
  overallExplanation: z.string().nullable(),
  mistakes: z.array(
    z.object({
      category: z.enum(TURN_ANALYSIS_MISTAKE_CATEGORIES),
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
      grammarPoint: z.string().nullable(),
      severity: z.enum(["minor", "important"]),
    }),
  ),
  usefulVocabulary: z.array(
    z.object({
      korean: z.string(),
      english: z.string(),
      example: z.string().nullable(),
    }),
  ),
})

export type TurnAnalysis = z.infer<typeof turnAnalysisSchema>

export const TURN_ANALYSIS_SYSTEM =
  "You are a careful Korean grammar analyst reviewing ONE message a language learner just sent in a tutoring chat.\n" +
  "Rules:\n" +
  "- Preserve the learner's intended meaning — never change what they were trying to say.\n" +
  "- Only flag things that are actually incorrect or would confuse a native speaker. Do not flag acceptable Korean just because a different phrasing exists.\n" +
  "- Distinguish real mistakes (hasErrors: true, listed in mistakes[]) from merely-less-natural phrasing (reflect that only in naturalVersion, not as a mistake).\n" +
  "- Workplace politeness/register mistakes (반말 where 존댓말 is expected, wrong honorifics) are important severity.\n" +
  "- Do not invent an error when the sentence is already acceptable — return hasErrors: false and an empty mistakes array.\n" +
  "- Do not report style preferences as grammar errors.\n" +
  "- Keep every explanation short and in beginner-friendly English.\n" +
  "- correctedText is the minimal grammatical fix; naturalVersion is how a native speaker would actually phrase it (can equal correctedText).\n" +
  "- usefulVocabulary lists only genuinely useful words/expressions from this message worth saving as flashcards (can be empty)."
