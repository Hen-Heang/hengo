// Second Brain, Phase 5: Ask Hengo — pure types/validation for the memory-
// candidate approval system. The AI never writes directly into "trusted"
// memory; every fact it notices lands here with status "proposed" and only
// counts as known context once the user approves it (see
// docs/second-brain-implementation.md for the full retrieval/approval design).

export type MemoryStatus = "proposed" | "approved" | "rejected" | "archived"

export type MemorySourceType = "note" | "inbox_item" | "journal" | "conversation" | "manual"

export interface MemoryCandidate {
  id: string
  fact: string
  category: string
  sourceType: MemorySourceType
  sourceId: string | null
  confidence: number
  status: MemoryStatus
  createdAt: string
  updatedAt: string
}

export interface MemoryCandidateInput {
  fact: string
  category: string
  sourceType: MemorySourceType
  sourceId?: string | null
  confidence: number
}

export const MEMORY_CATEGORY_SUGGESTIONS = [
  "preference",
  "skill",
  "routine",
  "goal",
  "fact",
  "other",
] as const

export const MEMORY_SOURCE_LABELS: Record<MemorySourceType, string> = {
  note: "Note",
  inbox_item: "Inbox",
  journal: "Journal",
  conversation: "Ask Hengo",
  manual: "Added by you",
}

export function validateMemoryCandidateInput(input: { fact: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  const trimmed = input.fact.trim()
  if (!trimmed) errors.fact = "This can't be empty."
  else if (trimmed.length > 500) errors.fact = "Keep it under 500 characters."
  return errors
}

export function filterMemoryCandidatesByStatus(
  candidates: MemoryCandidate[],
  status: MemoryStatus | "all",
): MemoryCandidate[] {
  if (status === "all") return candidates
  return candidates.filter((c) => c.status === status)
}

export function sortMemoryCandidates(candidates: MemoryCandidate[]): MemoryCandidate[] {
  return [...candidates].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Shared snake_case row shape for kori_memory_candidates — used by both
 * lib/api/memory.ts (browser client) and the Ask Hengo AI route (per-request
 * server client) so the mapping only lives in one, framework-free place. */
export interface MemoryCandidateRow {
  id: string
  fact: string
  category: string
  source_type: MemorySourceType
  source_id: string | null
  confidence: number
  status: MemoryStatus
  created_at: string
  updated_at: string
}

export function memoryCandidateFromRow(row: MemoryCandidateRow): MemoryCandidate {
  return {
    id: row.id,
    fact: row.fact,
    category: row.category,
    sourceType: row.source_type,
    sourceId: row.source_id,
    confidence: row.confidence,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Characters with special meaning to Postgres's websearch_to_tsquery (mainly
// quotes, since an unmatched one changes phrase-search parsing) — stripped so
// a raw user question can never produce a tsquery syntax error. Everything
// else websearch_to_tsquery already tolerates as plain words.
const TSQUERY_UNSAFE_CHARS = /["'()]/g

/** Turns a free-form question into a safe `.textSearch(..., { type: "websearch" })`
 * query string: strips characters that could break parsing and caps length so
 * one long rambling question can't blow up the query. */
export function sanitizeSearchQuery(question: string): string {
  return question.replace(TSQUERY_UNSAFE_CHARS, " ").trim().slice(0, 200)
}
