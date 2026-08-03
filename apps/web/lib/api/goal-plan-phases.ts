// Plan phases (Goal Planning & Scheduling) — goal_plan_phases table. RLS
// scopes every row to its owning user_id (see
// supabase/migrations/20260724010000_goal_plan_phases_schedule_rules.sql).
import {
  milestonesToPhaseDrafts,
  movePhase,
  phaseInputSchema,
  sortPhases,
  type GoalPlanPhase,
  type LegacyMilestone,
  type PhaseDraft,
  type PhaseInput,
  type PhaseStatus,
} from "@/lib/goal-plan-phases"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

export type CreatePhasePayload = PhaseInput & { goal_id: string }
export type UpdatePhasePayload = Partial<PhaseInput>

export const planPhasesApi = {
  listForGoal: async (goalId: string): Promise<GoalPlanPhase[]> => {
    const { data, error } = await supabase
      .from("goal_plan_phases")
      .select("*")
      .eq("goal_id", goalId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
    if (error) throw error
    return sortPhases(data as GoalPlanPhase[])
  },

  create: async (payload: CreatePhasePayload): Promise<GoalPlanPhase> => {
    const { goal_id, ...rest } = payload
    const input = phaseInputSchema.parse(rest)
    // Append to the end unless the caller pinned a position explicitly.
    const position =
      input.position ?? (await planPhasesApi.listForGoal(goal_id)).length
    const { data, error } = await supabase
      .from("goal_plan_phases")
      .insert({ user_id: requireUserId(), goal_id, ...input, position })
      .select()
      .single()
    if (error) throw error
    return data as GoalPlanPhase
  },

  update: async (id: string, payload: UpdatePhasePayload): Promise<GoalPlanPhase> => {
    const input = phaseInputSchema.partial().parse(payload)
    const { data, error } = await supabase
      .from("goal_plan_phases")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return data as GoalPlanPhase
  },

  setStatus: async (id: string, status: PhaseStatus): Promise<GoalPlanPhase> =>
    planPhasesApi.update(id, { status }),

  archive: async (id: string): Promise<GoalPlanPhase> => planPhasesApi.setStatus(id, "archived"),

  /** Persist a dense 0..n-1 ordering. No-ops for rows already in place. */
  reorder: async (positions: { id: string; position: number }[]): Promise<void> => {
    for (const { id, position } of positions) {
      const { error } = await supabase
        .from("goal_plan_phases")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    }
  },

  /** Move one phase a single slot and persist the whole normalised order. */
  move: async (phases: GoalPlanPhase[], id: string, direction: "up" | "down"): Promise<void> => {
    const next = movePhase(phases, id, direction)
    const current = new Map(phases.map((p) => [p.id, p.position]))
    await planPhasesApi.reorder(next.filter((p) => current.get(p.id) !== p.position))
  },

  /**
   * Delete a phase. Tasks pointing at it are detached first (the FK is ON
   * DELETE SET NULL, but doing it explicitly keeps the client cache honest and
   * makes the "tasks return to the backlog" behaviour intentional rather than
   * a side effect).
   */
  remove: async (id: string): Promise<void> => {
    const { error: detachError } = await supabase
      .from("tasks")
      .update({ phase_id: null })
      .eq("phase_id", id)
    if (detachError) throw detachError
    const { error } = await supabase.from("goal_plan_phases").delete().eq("id", id)
    if (error) throw error
  },

  /**
   * Preview the conversion of legacy `metadata.milestones` into phases. Pure —
   * reads nothing, writes nothing. The UI shows this before offering
   * `convertMilestones`.
   */
  previewMilestoneConversion: (
    milestones: LegacyMilestone[],
    options: { goalStartDate?: string | null; goalTargetDate?: string | null } = {},
  ): PhaseDraft[] => milestonesToPhaseDrafts(milestones, options),

  /**
   * Create phases from confirmed drafts. Deliberately does **not** touch
   * `goal.metadata.milestones` — the original checklist stays intact until the
   * user separately chooses to clear it, so a failed or regretted conversion
   * never loses data.
   */
  convertMilestones: async (
    goalId: string,
    drafts: PhaseDraft[],
  ): Promise<GoalPlanPhase[]> => {
    if (drafts.length === 0) return []
    const existing = await planPhasesApi.listForGoal(goalId)
    const userId = requireUserId()
    const rows = drafts.map((draft, i) => ({
      user_id: userId,
      goal_id: goalId,
      title: draft.title,
      objective: draft.objective,
      start_date: draft.start_date,
      end_date: draft.end_date,
      status: draft.status,
      position: existing.length + i,
    }))
    const { data, error } = await supabase.from("goal_plan_phases").insert(rows).select()
    if (error) throw error
    return data as GoalPlanPhase[]
  },

  /** Move a task into a phase (or back to the backlog with `null`). */
  assignTask: async (taskId: string, phaseId: string | null): Promise<void> => {
    const { error } = await supabase
      .from("tasks")
      .update({ phase_id: phaseId })
      .eq("id", taskId)
    if (error) throw error
  },
}
