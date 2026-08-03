// Evidence (Goal System v2) — goal_evidence table. Text/URL/numeric only in
// this phase, no file uploads (see docs/goal-system-v2-audit.md).
import type { EvidenceType, EvidenceVerifiedStatus, GoalEvidence } from "@/lib/goal-evidence"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

export interface CreateEvidencePayload {
  goal_id: string
  key_result_id?: string | null
  evidence_type: EvidenceType
  title: string
  description?: string | null
  url?: string | null
  numeric_value?: number | null
  metadata?: Record<string, unknown>
  verified_status?: EvidenceVerifiedStatus
}

export const evidenceApi = {
  listForGoal: async (goalId: string): Promise<GoalEvidence[]> => {
    const { data, error } = await supabase
      .from("goal_evidence")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as GoalEvidence[]
  },

  listForKeyResult: async (keyResultId: string): Promise<GoalEvidence[]> => {
    const { data, error } = await supabase
      .from("goal_evidence")
      .select("*")
      .eq("key_result_id", keyResultId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as GoalEvidence[]
  },

  create: async (data: CreateEvidencePayload): Promise<GoalEvidence> => {
    const { data: row, error } = await supabase
      .from("goal_evidence")
      .insert({ user_id: requireUserId(), ...data })
      .select()
      .single()
    if (error) throw error
    return row as GoalEvidence
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("goal_evidence").delete().eq("id", id)
    if (error) throw error
  },
}
