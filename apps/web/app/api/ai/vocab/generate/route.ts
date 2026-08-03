import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "vocab_generate",
  inputSchema: z.object({
    category: z.string().trim().min(1).max(100),
    count: z.number().int().min(1).max(20).default(10),
  }),
  outputSchema: z.object({
    words: z.array(
      z.object({
        term: z.string(),
        meaning: z.string(),
        pronunciation: z.string().nullable(),
        example: z.string().nullable(),
        exampleTranslation: z.string().nullable(),
        difficultyLevel: z.enum(["Easy", "Medium", "Hard"]).nullable(),
        tags: z.array(z.string()),
      }),
    ),
  }),
  buildPrompt: ({ category, count }) =>
    `You are a Korean vocabulary teacher for foreign software engineers working in Korea.\n` +
    `Generate ${count} Korean vocabulary flashcards for the category "${category}".\n` +
    "Focus on practical, high-frequency words and phrases used in real daily workplace situations.\n" +
    "Rules:\n" +
    "- \"pronunciation\" must use Revised Romanization (e.g. an-nyeong-ha-se-yo).\n" +
    "- \"difficultyLevel\" must be exactly \"Easy\", \"Medium\", or \"Hard\".\n" +
    "- \"example\" must be a realistic sentence a Korean coworker or developer would actually say.\n" +
    "- \"tags\" is 1-3 short lowercase topic tags (e.g. [\"meetings\", \"deadlines\"]).",
})
