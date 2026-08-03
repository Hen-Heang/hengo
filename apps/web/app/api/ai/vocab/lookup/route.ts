import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "vocab_lookup",
  inputSchema: z.object({
    word: z.string().trim().min(1).max(100),
  }),
  outputSchema: z.object({
    word: z.string(),
    definition: z.string(),
    example: z.string().nullable(),
    exampleTranslation: z.string().nullable(),
    hanja: z.string().nullable(),
  }),
  buildPrompt: ({ word }) =>
    `You are a Korean-English dictionary for Korean learners.\n` +
    `Define the Korean word or phrase "${word}" for a developer learning workplace Korean.\n` +
    "Rules:\n" +
    "- The example must be simple enough for a beginner-intermediate learner.\n" +
    "- Set hanja to null (not the string \"null\") for native Korean or loan words; give the hanja root only if the word is Sino-Korean.\n\n" +
    "Give a concise English definition (1-6 words), one natural workplace example sentence with its translation, " +
    "and the hanja.",
})
