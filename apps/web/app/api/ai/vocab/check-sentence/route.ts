import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "vocab_check_sentence",
  inputSchema: z.object({
    cardId: z.string().max(200),
    challengePrompt: z.string().trim().min(1).max(1000),
    attempt: z.string().trim().max(1000),
  }),
  outputSchema: z.object({
    score: z.number().min(0).max(100),
    correct: z.boolean(),
    feedback: z.string(),
    correctedSentence: z.string(),
    betterAlternative: z.string(),
    grammarNote: z.string(),
  }),
  buildPrompt: ({ challengePrompt, attempt }) =>
    `You are a Korean language coach evaluating a Korean learner's sentence.\n` +
    `Challenge: ${challengePrompt}\nLearner's Korean sentence: ${attempt}\n\n` +
    "Rules:\n" +
    "- Score 0-100: grammar correctness + naturalness + word usage.\n" +
    "- If the attempt is blank or in English only, score 0 and explain why in the feedback.\n" +
    "- All explanations must be in English. betterAlternative must be realistic workplace Korean.\n\n" +
    "Grade the sentence 0–100 (correct = score ≥ 70). Give brief encouraging feedback, the corrected sentence, " +
    "a more natural alternative, and one short grammar note.",
})
