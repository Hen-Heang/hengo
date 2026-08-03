// Weekly/periodic reviews (Goal System v2) — goal_reviews table.
// ai_summary is only ever set by an explicit, separate user action — never
// as a side effect of saving the review itself (no AI route calls this yet;
// see docs/goal-system-v2-audit.md's phased plan for the AI Weekly Coach).
import type { CreateGoalReviewPayload, GoalReview } from "@/lib/goal-reviews"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

export const goalReviewsApi = {
  listForGoal: async (goalId: string): Promise<GoalReview[]> => {
    const { data, error } = await supabase
      .from("goal_reviews")
      .select("*")
      .eq("goal_id", goalId)
      .order("review_period_start", { ascending: false })
    if (error) throw error
    return data as GoalReview[]
  },

  create: async (data: CreateGoalReviewPayload): Promise<GoalReview> => {
    const { data: row, error } = await supabase
      .from("goal_reviews")
      .insert({ user_id: requireUserId(), ...data })
      .select()
      .single()
    if (error) throw error
    return row as GoalReview
  },

  setAiSummary: async (id: string, aiSummary: string): Promise<GoalReview> => {
    const { data: row, error } = await supabase
      .from("goal_reviews")
      .update({ ai_summary: aiSummary })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return row as GoalReview
  },
}
