import { z } from "zod"
import { FORMALITY_LABELS, jsonAiRoute } from "@/lib/server/ai"

export const POST = jsonAiRoute({
  feature: "daily_phrase_generate",
  inputSchema: z.object({}),
  outputSchema: z.object({
    phrase: z.string(),
    meaning: z.string(),
    romanization: z.string().nullable(),
    whenToUse: z.string().nullable(),
    formality: z.string().nullable(),
    similarExpressions: z.array(z.object({ phrase: z.string(), meaning: z.string() })),
  }),
  buildPrompt: async (_body, { db }) => {
    const { data: profile } = await db.from("kori_profiles").select("korean_level").maybeSingle()
    const { data: recent } = await db
      .from("kori_daily_phrases")
      .select("phrase")
      .order("date", { ascending: false })
      .limit(30)
    const avoid = (recent ?? []).map((r) => r.phrase).join(", ")
    return (
      "You are a Korean workplace communication coach for foreign software engineers working at Korean tech companies.\n" +
      `Generate ONE useful daily Korean workplace phrase for a ${profile?.korean_level ?? "BEGINNER"} learner.\n` +
      "Prefer practical expressions used in standups, code reviews, deployments, reporting, and team chat.\n" +
      `Do NOT repeat any of these recently used phrases: ${avoid || "(none)"}\n\n` +
      "Rules:\n" +
      "- \"phrase\" must be natural Korean a real Korean developer would actually say or write.\n" +
      `- \"formality\" must be exactly one of ${FORMALITY_LABELS}.\n` +
      "- Provide 2-3 similar expressions. If none fit, return an empty array.\n" +
      "- All explanations must be in English.\n\n" +
      "Include meaning, romanization, when to use it, its formality level, and similar expressions."
    )
  },
})
