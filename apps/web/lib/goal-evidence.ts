// Types for goal_evidence (Goal System v2 — see docs/goal-system-v2-audit.md).
// Text/URL/numeric evidence only in this phase — no file uploads.

export type EvidenceType =
  | "note"
  | "link"
  | "git_commit"
  | "pull_request"
  | "deployment"
  | "score"
  | "transcript"
  | "recording_reference"
  | "screenshot_reference"
  | "completed_project_output"

export type EvidenceVerifiedStatus = "unverified" | "self_confirmed" | "verified"

export interface GoalEvidence {
  id: string
  goal_id: string
  key_result_id: string | null
  user_id: string
  evidence_type: EvidenceType
  title: string
  description: string | null
  url: string | null
  numeric_value: number | null
  metadata: Record<string, unknown>
  verified_status: EvidenceVerifiedStatus
  created_at: string
  updated_at: string
}

export const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "git_commit", label: "Git commit" },
  { value: "pull_request", label: "Pull request" },
  { value: "deployment", label: "Deployment" },
  { value: "score", label: "Score" },
  { value: "transcript", label: "Transcript" },
  { value: "recording_reference", label: "Recording reference" },
  { value: "screenshot_reference", label: "Screenshot reference" },
  { value: "completed_project_output", label: "Completed project output" },
]
