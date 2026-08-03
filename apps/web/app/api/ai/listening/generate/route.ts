import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "listening_generate",
  inputSchema: z.object({
    topic: z.string().trim().min(1).max(200),
  }),
  outputSchema: z.object({
    title: z.string(),
    level: z.string(),
    lines: z.array(z.object({ speaker: z.string(), korean: z.string(), english: z.string() })),
    quiz: z.array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).length(4),
        answerIndex: z.number().min(0).max(3),
        explanation: z.string(),
      }),
    ),
  }),
  buildPrompt: async ({ topic }, { db }) => {
    const { data: profile } = await db.from("kori_profiles").select("korean_level").maybeSingle()
    return (
      "You are a Korean listening-comprehension content creator for foreign software engineers at Korean tech companies.\n" +
      `Create a short, natural workplace conversation in Korean about the topic: "${topic}".\n` +
      `Target a ${profile?.korean_level ?? "BEGINNER"} learner. Keep it realistic for a software team (2-3 speakers, 8-12 short turns).\n` +
      "Rules:\n" +
      "- Korean lines must be natural workplace Korean a real Korean developer would say.\n" +
      "- Every line must include an accurate English translation.\n" +
      "- Provide exactly 4 options per question and set answerIndex (0-based) to the correct one.\n\n" +
      "Then write 4 English comprehension questions about the conversation, with 4 options each, " +
      "the correct answerIndex, and a short explanation. Give the lesson a title and level."
    )
  },
})
