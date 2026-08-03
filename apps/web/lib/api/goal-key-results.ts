// Key results (Goal System v2) — goal_key_results table. RLS scopes every
// row to its owning user_id (see supabase/migrations/20260723020000_goal_outcomes_v2.sql).
import type {
  GoalKeyResult,
  KeyResultDataSource,
  KeyResultMetricType,
  KeyResultStatus,
} from "@/lib/goal-key-results"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

export interface CreateKeyResultPayload {
  goal_id: string
  title: string
  description?: string | null
  metric_type: KeyResultMetricType
  baseline_value?: number | null
  current_value?: number | null
  target_value?: number | null
  unit?: string | null
  weight?: number
  deadline?: string | null
  data_source?: KeyResultDataSource
  source_config?: Record<string, unknown>
  status?: KeyResultStatus
}

export type UpdateKeyResultPayload = Partial<Omit<CreateKeyResultPayload, "goal_id">>

export const keyResultsApi = {
  listForGoal: async (goalId: string): Promise<GoalKeyResult[]> => {
    const { data, error } = await supabase
      .from("goal_key_results")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: true })
    if (error) throw error
    return data as GoalKeyResult[]
  },

  create: async (data: CreateKeyResultPayload): Promise<GoalKeyResult> => {
    const { data: row, error } = await supabase
      .from("goal_key_results")
      .insert({ user_id: requireUserId(), weight: 1, data_source: "manual", status: "active", ...data })
      .select()
      .single()
    if (error) throw error
    return row as GoalKeyResult
  },

  update: async (id: string, data: UpdateKeyResultPayload): Promise<GoalKeyResult> => {
    const { data: row, error } = await supabase
      .from("goal_key_results")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return row as GoalKeyResult
  },

  // Archiving (not deleting) is the default way to retire a key result — it
  // keeps historical evidence/tasks linked and drops out of progress/weight
  // calculations (lib/goal-progress.ts filters out status === "archived").
  archive: async (id: string): Promise<GoalKeyResult> => keyResultsApi.update(id, { status: "archived" }),

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("goal_key_results").delete().eq("id", id)
    if (error) throw error
  },
}
