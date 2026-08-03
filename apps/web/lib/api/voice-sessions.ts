import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import type { CorrectionPolicy } from "@/lib/realtime/correction-policy"
import type { VoiceSessionReport } from "@/lib/realtime/session-report"

// Persistence for completed realtime voice sessions (kori_voice_sessions).
// Every write is best-effort and swallows its own errors: a persistence failure
// (including the table not being migrated yet) must never break the live
// session or hide the in-memory report the learner just earned.

export interface VoiceSessionRecordInput {
  conversationId: string | null
  scenarioId: string | null
  practiceMode: string
  correctionPolicy: CorrectionPolicy
  learnerLevel: string
  model: string | null
  status: "completed" | "failed"
  startedAt: string
  endedAt: string
  report: VoiceSessionReport
}

export const voiceSessionsApi = {
  // Records one finished session. Returns the new row id, or null on any failure.
  record: async (input: VoiceSessionRecordInput): Promise<string | null> => {
    try {
      const userId = requireUserId()
      const { metrics } = input.report
      const { data, error } = await supabase
        .from("kori_voice_sessions")
        .insert({
          user_id: userId,
          conversation_id: input.conversationId,
          scenario_id: input.scenarioId,
          practice_mode: input.practiceMode,
          correction_policy: input.correctionPolicy,
          learner_level: input.learnerLevel,
          model: input.model,
          status: input.status,
          user_turn_count: metrics.userTurnCount,
          assistant_turn_count: metrics.assistantTurnCount,
          approx_word_count: metrics.approxWordCount,
          important_mistake_count: metrics.importantMistakeCount,
          target_expressions: metrics.targetExpressions,
          scenario_completed: input.report.scenarioCompleted,
          summary: input.report,
          started_at: input.startedAt,
          ended_at: input.endedAt,
          duration_seconds: metrics.durationSeconds,
        })
        .select("id")
        .single()
      if (error) throw error
      return (data as { id: string }).id
    } catch {
      return null
    }
  },
}
