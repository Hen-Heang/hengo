import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "daily_phrase_practice",
  inputSchema: z.object({
    phrase: z.string().trim().min(1).max(200),
    meaning: z.string().trim().min(1).max(500),
  }),
  outputSchema: z.object({
    challengePrompt: z.string(),
    contextHint: z.string(),
    exampleAnswer: z.string(),
  }),
  buildPrompt: ({ phrase, meaning }) =>
    `You are a Korean language practice coach for foreign software engineers at Korean tech companies.\n` +
    `Create a practice challenge for the Korean phrase "${phrase}" (${meaning}).\n` +
    "Rules:\n" +
    "- challengePrompt must be in English, action-oriented, workplace-focused.\n" +
    "- contextHint must be 1 short English sentence giving the scene.\n" +
    "- exampleAnswer must use the phrase naturally and be realistic for a Korean tech company.",
})
