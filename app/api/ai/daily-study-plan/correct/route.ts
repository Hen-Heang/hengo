import { z } from "zod"

import { dailySpeakingFeedbackSchema } from "@/lib/daily-study-plan-schemas"
import { jsonAiRoute } from "@/lib/server/ai"

const inputSchema = z.object({
  question: z.string().trim().min(1).max(500),
  questionMeaning: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(1000),
  topic: z.string().trim().min(1).max(300),
  register: z.enum(["해요체", "합니다체"]),
  retryOf: z.string().trim().max(1000).nullable().default(null),
})

export const POST = jsonAiRoute({
  feature: "daily_study_coach",
  inputSchema,
  outputSchema: dailySpeakingFeedbackSchema,
  system:
    "You are Hengo's Korean speaking coach for an adult Cambodian software engineer who is a Korean beginner living in South Korea. " +
    "Use short, simple English. Be calm and practical. Teach 60% workplace Korean and 40% daily-life Korean. " +
    "Prefer polite 해요체 in daily life and formal 합니다체 for workplace communication. " +
    "Correct only meaningful grammar, vocabulary, politeness, meaning, or naturalness problems. " +
    "Never claim to score pronunciation, accent, fluency, or speech-to-text accuracy because you receive only a text transcript.",
  buildPrompt: ({ question, questionMeaning, answer, topic, register, retryOf }) =>
    `Topic: ${topic}\n` +
    `Coach question: ${question}\n` +
    `Simple English meaning: ${questionMeaning}\n` +
    `Expected register: ${register}\n` +
    `Learner transcript: ${answer}\n` +
    (retryOf ? `This is a retry of the earlier answer: ${retryOf}\n` : "") +
    "\nReturn structured feedback with these rules:\n" +
    "- originalAnswer must exactly preserve the learner transcript.\n" +
    "- correctedAnswer is the smallest meaningful correction. If acceptable, keep it unchanged.\n" +
    "- naturalAlternative is one short natural Korean alternative with the same meaning.\n" +
    "- shortExplanation is at most two short sentences in simple English.\n" +
    "- errorCategory is the single most important issue, or none.\n" +
    "- vocabularyToReview contains at most five practical items.\n" +
    "- retryRequest asks the learner to repeat the complete corrected answer, not isolated words.\n" +
    "- communicationSuccessful is true when the answer meaningfully answers the question, even with a small correctable error.\n" +
    "- Give feedback only; do not ask a new question.",
})
