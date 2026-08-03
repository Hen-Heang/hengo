// Types for goal_key_results (Goal System v2 — see docs/goal-system-v2-audit.md).
// Row shape mirrors the DB columns directly (snake_case), same convention as
// Goal/Task in lib/goals.ts / lib/tasks.ts — no camelCase mapping layer.

export type KeyResultMetricType =
  | "number"
  | "percentage"
  | "score"
  | "boolean"
  | "count"
  | "duration"
  | "external"
  | "manual_evidence"

export type KeyResultDataSource =
  | "manual"
  | "task_completion"
  | "hengo_learning_metric"
  | "interview_score"
  | "skill_mastery"
  | "activity_session"
  | "external_integration"

export type KeyResultStatus = "active" | "achieved" | "missed" | "archived"

export interface GoalKeyResult {
  id: string
  goal_id: string
  user_id: string
  title: string
  description: string | null
  metric_type: KeyResultMetricType
  baseline_value: number | null
  current_value: number | null
  target_value: number | null
  unit: string | null
  weight: number
  deadline: string | null
  data_source: KeyResultDataSource
  source_config: Record<string, unknown>
  status: KeyResultStatus
  created_at: string
  updated_at: string
}

export const KEY_RESULT_METRIC_TYPES: { value: KeyResultMetricType; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "percentage", label: "Percentage" },
  { value: "score", label: "Score" },
  { value: "boolean", label: "Yes / No" },
  { value: "count", label: "Count" },
  { value: "duration", label: "Duration (minutes)" },
  { value: "external", label: "External value" },
  { value: "manual_evidence", label: "Manual evidence only" },
]

export const KEY_RESULT_DATA_SOURCES: { value: KeyResultDataSource; label: string }[] = [
  { value: "manual", label: "Manual update" },
  { value: "task_completion", label: "Task completion" },
  { value: "hengo_learning_metric", label: "Hengo learning metric" },
  { value: "interview_score", label: "Interview score" },
  { value: "skill_mastery", label: "Skill mastery" },
  { value: "activity_session", label: "Activity session" },
  { value: "external_integration", label: "External integration" },
]
