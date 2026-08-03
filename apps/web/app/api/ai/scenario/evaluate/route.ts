import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"
import { SKILL_CODES } from "@/lib/learning/skills"

// End-of-scenario evaluation. Scenario mission items only complete once this
// judges the learner actually accomplished the scenario's stated goal — not
// just because they opened the chat and clicked a button (see
// lib/api/scenario-sessions.ts).

const transcriptEntry = z.object({
  role: z.enum(["assistant", "user"]),
  text: z.string().max(2000),
})

export const POST = jsonAiRoute({
  feature: "scenario_evaluate",
  inputSchema: z.object({
    goal: z.string().trim().min(1).max(500),
    transcript: z.array(transcriptEntry).max(60),
  }),
  outputSchema: z.object({
    taskCompleted: z.boolean(),
    score: z.number().int().min(0).max(100),
    strengths: z.array(z.string()).max(5),
    improvements: z.array(z.string()).max(5),
    skillScores: z
      .array(
        z.object({
          skillCode: z.enum(SKILL_CODES),
          score: z.number().int().min(0).max(100),
        }),
      )
      .max(6),
  }),
  buildPrompt: ({ goal, transcript }) => {
    const lines = transcript.map((t) => `${t.role === "assistant" ? "Coach" : "Learner"}: ${t.text}`).join("\n")
    const userTurns = transcript.filter((t) => t.role === "user").length

    return (
      "You are judging whether a Korean learner accomplished a workplace roleplay scenario's goal during a " +
      "practice conversation with an AI coach. Judge ONLY the learner's turns against the stated goal — being " +
      "friendly or willing isn't enough, the goal must actually be accomplished in Korean.\n" +
      `Scenario goal: "${goal}"\n` +
      `Learner turns so far: ${userTurns}\n` +
      `Transcript:\n${lines}\n\n` +
      "Rules:\n" +
      "- taskCompleted is true only if the transcript shows the learner actually accomplishing the goal in Korean " +
      "(not just attempting it, and not if the coach did the work for them).\n" +
      "- If there are fewer than 3 learner turns, taskCompleted should almost always be false unless the goal was " +
      "unusually simple and clearly met.\n" +
      "- score (0-100) reflects overall task performance: goal completion, Korean accuracy, and naturalness.\n" +
      "- strengths/improvements: short, concrete, encouraging English notes.\n" +
      "- skillScores: 1-4 relevant skill codes from the provided taxonomy with a 0-100 score each, reflecting " +
      "performance on that specific skill in this scenario."
    )
  },
})
