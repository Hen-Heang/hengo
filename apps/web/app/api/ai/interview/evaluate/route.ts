import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

// End-of-interview scorecard for the K-Specialist mock. The client sends the
// full session transcript (it already holds it in state); the model judges the
// candidate's answers against the four official criteria and adds transcript-
// level analytics. Everything is inferred from speech-recognition TEXT — the
// model never hears audio, so pronunciation and delivery are estimates.

const transcriptEntry = z.object({
  role: z.enum(["examiner", "candidate"]),
  text: z.string().max(2000),
})

export const POST = jsonAiRoute({
  feature: "interview_evaluate",
  inputSchema: z.object({
    topicId: z.string().max(200).optional(),
    mode: z.string().max(50).default("practice"),
    transcript: z.array(transcriptEntry).max(120),
    questionCount: z.number().int().min(0).max(200).optional(),
    durationSeconds: z.number().int().min(0).max(36000).optional(),
  }),
  outputSchema: z.object({
    scores: z.object({
      speaking: z.number().min(1).max(5),
      pronunciation: z.number().min(1).max(5),
      vocabulary: z.number().min(1).max(5),
      confidence: z.number().min(1).max(5),
    }),
    summary: z.string(),
    advice: z.array(z.string()).min(2).max(5),
    analytics: z.object({
      fillerNotes: z.string(),
      avgSentenceLengthWords: z.number(),
      vocabRangeNotes: z.string(),
      grammarIssues: z
        .array(z.object({ issue: z.string(), example: z.string(), fix: z.string() }))
        .max(6),
      wordsToPractice: z.array(z.string()).max(10),
    }),
  }),
  buildPrompt: ({ mode, transcript, questionCount }) => {
    const lines = transcript.map((t) => `${t.role === "examiner" ? "Q" : "A"}: ${t.text}`).join("\n")
    return (
      "You are scoring a K-Specialist Korean speaking mock interview from its transcript. " +
      "Judge ONLY the candidate's answers (the A lines). Score each of the four official criteria " +
      "(speaking, pronunciation, vocabulary, confidence) from 1 to 5. " +
      "The candidate's lines come from speech recognition, so all analytics are ESTIMATES from text: " +
      "judge pronunciation only indirectly (misrecognized or garbled words hint at unclear pronunciation), " +
      "and note fillers/hesitation from repeated or fragmented phrasing. " +
      "Write the summary and advice in encouraging, honest English suitable for an intermediate learner.\n\n" +
      `Interview mode: ${mode} · Questions answered: ${questionCount ?? transcript.filter((t) => t.role === "candidate").length}\n` +
      `Transcript:\n${lines}\n\n` +
      "Fill every field. wordsToPractice = Korean words or expressions the candidate avoided, misused, " +
      "or should add to sound more natural on this topic."
    )
  },
})
