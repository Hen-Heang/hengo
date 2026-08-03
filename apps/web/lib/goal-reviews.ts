// Types for goal_reviews (Goal System v2 — see docs/goal-system-v2-audit.md).
// ai_summary is only ever populated after an explicit user action (a
// dedicated "Summarize with AI" call) — never written as a side effect of
// saving the review itself.

export interface GoalReview {
  id: string
  goal_id: string
  user_id: string
  review_period_start: string
  review_period_end: string
  outcome_progress_before: number | null
  outcome_progress_after: number | null
  wins: string | null
  blockers: string | null
  lessons: string | null
  next_focus: string | null
  ai_summary: string | null
  created_at: string
}

export interface CreateGoalReviewPayload {
  goal_id: string
  review_period_start: string
  review_period_end: string
  outcome_progress_before?: number | null
  outcome_progress_after?: number | null
  wins?: string | null
  blockers?: string | null
  lessons?: string | null
  next_focus?: string | null
}
