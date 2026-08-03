import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "vocab_sentence_challenge",
  inputSchema: z.object({
    cardId: z.string().max(200),
    term: z.string().trim().min(1).max(200),
    meaning: z.string().trim().min(1).max(500),
  }),
  outputSchema: z.object({
    cardId: z.string(),
    term: z.string(),
    meaning: z.string(),
    challengePrompt: z.string(),
    contextHint: z.string(),
    exampleAnswer: z.string(),
  }),
  buildPrompt: ({ cardId, term, meaning }) =>
    `You are a Korean language practice coach for foreign software engineers at Korean tech companies.\n` +
    `Create a sentence-writing challenge for the Korean word "${term}" (${meaning}).\n` +
    "Rules:\n" +
    "- challengePrompt must be in English, action-oriented, workplace-focused.\n" +
    "- contextHint must be 1 short English sentence giving the scene (e.g. standup, Slack message, code review).\n" +
    "- exampleAnswer must use the Korean term naturally and be realistic for a Korean tech company.\n\n" +
    "Return the cardId/term/meaning back unchanged, plus: challengePrompt, contextHint, and exampleAnswer. " +
    `cardId: ${cardId}`,
})
