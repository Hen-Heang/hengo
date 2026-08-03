import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

// Grades one answer in the rapid speaking drill. Four of the six dimensions
// are the official exam criteria, so drill scores stay comparable with the
// mock-interview scorecards; grammar and naturalness are drill-only extras.
// The answer is a speech-recognition transcript — the model never hears audio,
// so pronunciation and confidence are estimates from text.

export const POST = jsonAiRoute({
  feature: "interview_speaking_check",
  inputSchema: z.object({
    question: z.string().trim().min(1).max(500),
    answer: z.string().trim().max(2000),
  }),
  outputSchema: z.object({
    scores: z.object({
      speaking: z.number().min(1).max(5),
      grammar: z.number().min(1).max(5),
      vocabulary: z.number().min(1).max(5),
      pronunciation: z.number().min(1).max(5),
      confidence: z.number().min(1).max(5),
      naturalness: z.number().min(1).max(5),
    }),
    feedback: z.string(),
    correctedAnswer: z.string(),
    betterAlternative: z.string(),
    tip: z.string(),
  }),
  buildPrompt: ({ question, answer }) =>
    "You are grading ONE answer in a rapid K-Specialist Korean interview drill.\n" +
    `Question (Korean): ${question}\n` +
    `Candidate's answer (speech-recognition transcript): ${answer}\n\n` +
    "Score each dimension 1-5. The transcript comes from speech recognition — pronunciation and " +
    "confidence are ESTIMATES from text only (garbled or misrecognized words hint at unclear " +
    "pronunciation; fragments and repetition hint at hesitation). A good answer is 2-3 complete " +
    "polite-form (-습니다/-아요) sentences; penalize one-word answers under `speaking`. " +
    "correctedAnswer keeps the candidate's own words with minimal fixes; betterAlternative is a " +
    "natural 2-3 sentence model answer an intermediate learner could realistically say. " +
    "feedback (1-2 sentences) and tip (one actionable point) are short, encouraging English.",
})
