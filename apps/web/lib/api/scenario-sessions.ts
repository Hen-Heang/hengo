import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import type { SkillCode } from "@/lib/learning/skills"
import { aiPost } from "./ai-client"
import { missionsApi } from "./missions"
import { skillsApi } from "./skills"

// Scenario-practice sessions over kori_scenario_sessions. A scenario mission
// item only completes once evaluate() judges the goal actually accomplished
// (see app/api/ai/scenario/evaluate) — never just because the learner opened
// the chat, matching the "evidence-based completion" requirement.

export interface ScenarioSession {
  id: string
  scenarioId: string
  conversationId: string | null
  userTurnCount: number
  taskCompleted: boolean
  score: number | null
  strengths: string[]
  improvements: string[]
  startedAt: string
  completedAt: string | null
}

type SessionRow = {
  id: string
  scenario_id: string
  conversation_id: string | null
  mission_item_id: string | null
  user_turn_count: number
  task_completed: boolean
  score: number | null
  strengths: string[]
  improvements: string[]
  started_at: string
  completed_at: string | null
}

function toSession(row: SessionRow): ScenarioSession {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    conversationId: row.conversation_id,
    userTurnCount: row.user_turn_count,
    taskCompleted: row.task_completed,
    score: row.score,
    strengths: row.strengths ?? [],
    improvements: row.improvements ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

export interface ScenarioEvaluateResult {
  taskCompleted: boolean
  score: number
  strengths: string[]
  improvements: string[]
  skillScores: Array<{ skillCode: SkillCode; score: number }>
}

const MIN_TURNS_BEFORE_EVALUATION = 3

export const scenarioSessionsApi = {
  // Starts (or resumes) a session for this scenario+conversation pair.
  start: async (
    scenarioId: string,
    conversationId: string,
    missionItemId?: string | null,
  ): Promise<ScenarioSession> => {
    const userId = requireUserId()
    const { data: existing } = await supabase
      .from("kori_scenario_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("conversation_id", conversationId)
      .maybeSingle()
    if (existing) return toSession(existing as SessionRow)

    const { data, error } = await supabase
      .from("kori_scenario_sessions")
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        conversation_id: conversationId,
        mission_item_id: missionItemId ?? null,
      })
      .select("*")
      .single()
    if (error) throw error
    return toSession(data as SessionRow)
  },

  getByConversation: async (conversationId: string): Promise<ScenarioSession | null> => {
    const { data, error } = await supabase
      .from("kori_scenario_sessions")
      .select("*")
      .eq("conversation_id", conversationId)
      .maybeSingle()
    if (error) throw error
    return data ? toSession(data as SessionRow) : null
  },

  // Called once per real learner message sent in a scenario conversation.
  incrementTurn: async (conversationId: string): Promise<number> => {
    const { data: session, error } = await supabase
      .from("kori_scenario_sessions")
      .select("id, user_turn_count")
      .eq("conversation_id", conversationId)
      .maybeSingle()
    if (error) throw error
    if (!session) return 0
    const nextCount = session.user_turn_count + 1
    await supabase.from("kori_scenario_sessions").update({ user_turn_count: nextCount }).eq("id", session.id)
    return nextCount
  },

  readyToEvaluate: (session: ScenarioSession): boolean =>
    !session.taskCompleted && session.userTurnCount >= MIN_TURNS_BEFORE_EVALUATION,

  // Judges the transcript against the scenario's goal, persists the result,
  // records skill-mastery evidence, and — only if the goal was actually
  // accomplished — completes the linked mission item.
  evaluate: async (
    session: ScenarioSession,
    goal: string,
    transcript: Array<{ role: "assistant" | "user"; text: string }>,
  ): Promise<ScenarioEvaluateResult> => {
    const result = await aiPost<ScenarioEvaluateResult>("/scenario/evaluate", { goal, transcript })

    const { error } = await supabase
      .from("kori_scenario_sessions")
      .update({
        task_completed: result.taskCompleted,
        score: result.score,
        strengths: result.strengths,
        improvements: result.improvements,
        completed_at: result.taskCompleted ? new Date().toISOString() : null,
      })
      .eq("id", session.id)
    if (error) throw error

    for (const s of result.skillScores) {
      void skillsApi.recordEvent({
        skillCode: s.skillCode,
        sourceFeature: "scenario",
        sourceId: session.id,
        score: s.score,
      })
    }

    if (result.taskCompleted) {
      const { data: row } = await supabase
        .from("kori_scenario_sessions")
        .select("mission_item_id")
        .eq("id", session.id)
        .maybeSingle()
      if (row?.mission_item_id) {
        await missionsApi.completeItemWithEvidence(row.mission_item_id, {
          scenarioSessionId: session.id,
          score: result.score,
        })
      }
    }

    return result
  },
}
