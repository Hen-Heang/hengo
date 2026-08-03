import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"
import { TURN_ANALYSIS_MISTAKE_CATEGORIES } from "@/lib/ai/schemas/turn-analysis"

export const POST = jsonAiRoute({
  feature: "corrections_check",
  inputSchema: z.object({
    text: z.string().trim().min(1).max(2000),
  }),
  outputSchema: z.object({
    originalText: z.string(),
    correctedText: z.string(),
    hasErrors: z.boolean(),
    rating: z.number().int().min(1).max(5),
    explanation: z.string().nullable(),
    grammarPoints: z.array(z.string()),
    changes: z.array(
      z.object({
        original: z.string(),
        corrected: z.string(),
        englishMeaning: z.string(),
        reason: z.string(),
        category: z.enum(TURN_ANALYSIS_MISTAKE_CATEGORIES).nullable(),
      }),
    ),
  }),
  buildPrompt: ({ text }) =>
    "You are a Korean grammar and spelling correction assistant helping Korean learners improve their writing.\n" +
    "Rules:\n" +
    "- \"changes\" must list EVERY individual correction made. If nothing was changed, return an empty array.\n" +
    "- \"original\" and \"corrected\" in each change should be short fragments (the specific part that changed), not the whole sentence.\n" +
    "- \"reason\" should teach the learner so they understand the rule, not just what changed.\n" +
    "- \"category\" classifies each change as one of: particle, verb_ending, tense, word_order, vocabulary, politeness, spacing, spelling, expression. Use null only if truly none fit.\n" +
    "- \"rating\" reflects how close the ORIGINAL (uncorrected) sentence was to native-like Korean: 5 means no or only trivial issues, 1 means major grammar/spelling problems throughout.\n" +
    "- All explanations must be in English.\n\n" +
    `Correct and explain this Korean text written by a learner:\n"${text}"\n\n` +
    "Return the original text, the corrected version (identical if already natural), whether it had errors, " +
    "the rating, a short English explanation of the main fixes, the grammar points involved, and the changes array.",
})
