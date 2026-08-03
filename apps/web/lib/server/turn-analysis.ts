import { generateObject } from "ai"
import { AI_PROVIDER_OPTIONS, aiModel } from "@/lib/server/ai"
import { TURN_ANALYSIS_SYSTEM, turnAnalysisSchema, type TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

// Runs after the assistant's streamed reply is already fully sent to the
// client — this never blocks the visible chat response. Swallows its own
// errors (logged without exposing internals) so a flaky analysis call never
// fails the surrounding chat turn.
export async function runTurnAnalysis(params: { level: string; text: string }): Promise<TurnAnalysis | null> {
  try {
    const { object } = await generateObject({
      model: aiModel(),
      providerOptions: AI_PROVIDER_OPTIONS,
      schema: turnAnalysisSchema,
      system: TURN_ANALYSIS_SYSTEM,
      prompt: `Learner's Korean level: ${params.level}\nMessage to review:\n"${params.text}"`,
    })
    return object
  } catch (err) {
    console.error("[turn-analysis] generation failed:", err instanceof Error ? err.message : "unknown error")
    return null
  }
}
