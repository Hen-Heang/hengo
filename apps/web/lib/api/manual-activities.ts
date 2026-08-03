import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Manually recorded real-life activities over kori_manual_activities — the
// Timeline's "I actually did this" counterpart to kori_activity_log (which
// only ever tracks time spent inside Hengo). See lib/timeline.ts for how the
// two are kept visually and semantically distinct.

export interface ManualActivity {
  id: string
  occurredAt: string
  label: string
  category: string | null
  durationMinutes: number | null
  notes: string | null
  goalId: string | null
  habitId: string | null
  createdAt: string
  updatedAt: string
}

export interface ManualActivityInput {
  occurredAt?: string
  label: string
  category?: string | null
  durationMinutes?: number | null
  notes?: string | null
  goalId?: string | null
  habitId?: string | null
}

type ManualActivityRow = {
  id: string
  occurred_at: string
  label: string
  category: string | null
  duration_minutes: number | null
  notes: string | null
  goal_id: string | null
  habit_id: string | null
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  "id, occurred_at, label, category, duration_minutes, notes, goal_id, habit_id, created_at, updated_at"

function toManualActivity(row: ManualActivityRow): ManualActivity {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    label: row.label,
    category: row.category,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    goalId: row.goal_id,
    habitId: row.habit_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface ManualActivityRangeParams {
  from?: string
  to?: string
  limit?: number
}

export const manualActivitiesApi = {
  list: async (params: ManualActivityRangeParams = {}): Promise<ManualActivity[]> => {
    let query = supabase
      .from("kori_manual_activities")
      .select(SELECT_COLUMNS)
      .order("occurred_at", { ascending: false })
      .limit(params.limit ?? 500)
    if (params.from) query = query.gte("occurred_at", params.from)
    if (params.to) query = query.lte("occurred_at", params.to)
    const { data, error } = await query
    if (error) throw error
    return (data as unknown as ManualActivityRow[]).map(toManualActivity)
  },

  create: async (input: ManualActivityInput): Promise<ManualActivity> => {
    const { data, error } = await supabase
      .from("kori_manual_activities")
      .insert({
        user_id: requireUserId(),
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        label: input.label.trim(),
        category: input.category?.trim() || null,
        duration_minutes: input.durationMinutes ?? null,
        notes: input.notes?.trim() || null,
        goal_id: input.goalId ?? null,
        habit_id: input.habitId ?? null,
      })
      .select(SELECT_COLUMNS)
      .single()
    if (error) throw error
    return toManualActivity(data as unknown as ManualActivityRow)
  },

  update: async (id: string, input: Partial<ManualActivityInput>): Promise<ManualActivity> => {
    const { data, error } = await supabase
      .from("kori_manual_activities")
      .update({
        ...(input.occurredAt !== undefined ? { occurred_at: input.occurredAt } : {}),
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.durationMinutes !== undefined ? { duration_minutes: input.durationMinutes } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.goalId !== undefined ? { goal_id: input.goalId } : {}),
        ...(input.habitId !== undefined ? { habit_id: input.habitId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single()
    if (error) throw error
    return toManualActivity(data as unknown as ManualActivityRow)
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("kori_manual_activities").delete().eq("id", id)
    if (error) throw error
  },
}
