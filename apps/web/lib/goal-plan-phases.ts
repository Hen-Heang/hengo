// Plan phases (Goal Planning & Scheduling — see docs/goal-planning-scheduling-audit.md).
//
// A Phase is an ordered stage of a goal's plan. It replaces the user-facing
// "Sub-goals" concept, which lived in `goals.metadata.milestones` as an
// un-ordered, un-dated checklist. Legacy milestones are never deleted here —
// `milestonesToPhaseDrafts` produces a *preview* the user confirms before the
// API writes anything (see lib/api/goal-plan-phases.ts).
//
// Row shape mirrors the DB columns (snake_case), same convention as
// Goal/Task/GoalKeyResult.

import { z } from "zod"

export type PhaseStatus = "planned" | "active" | "completed" | "paused" | "archived"

export interface GoalPlanPhase {
  id: string
  goal_id: string
  user_id: string
  title: string
  objective: string | null
  description: string | null
  position: number
  start_date: string | null
  end_date: string | null
  status: PhaseStatus
  created_at: string
  updated_at: string
}

export const PHASE_STATUSES: { value: PhaseStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
]

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  archived: "Archived",
}

const YMD = /^\d{4}-\d{2}-\d{2}$/

// External input validation — every API write goes through one of these.
export const phaseInputSchema = z
  .object({
    title: z.string().trim().min(1, "Give this phase a title").max(200),
    objective: z.string().trim().max(500).nullish(),
    description: z.string().trim().max(2000).nullish(),
    position: z.number().int().min(0).optional(),
    start_date: z.string().regex(YMD, "Use a YYYY-MM-DD date").nullish(),
    end_date: z.string().regex(YMD, "Use a YYYY-MM-DD date").nullish(),
    status: z.enum(["planned", "active", "completed", "paused", "archived"]).optional(),
  })
  .refine(
    (v) => !v.start_date || !v.end_date || v.end_date >= v.start_date,
    { message: "A phase can't end before it starts", path: ["end_date"] },
  )

export type PhaseInput = z.infer<typeof phaseInputSchema>

// ── Ordering ────────────────────────────────────────────────────────────────
// Positions are normalised to a dense 0..n-1 sequence on every reorder, so a
// phase list can never drift into duplicate or sparse positions.

export interface PhasePosition {
  id: string
  position: number
}

/** Sort by position, then created_at, then id — a total order with no ties. */
export function sortPhases<T extends { id: string; position: number; created_at?: string }>(
  phases: T[],
): T[] {
  return [...phases].sort(
    (a, b) =>
      a.position - b.position ||
      (a.created_at ?? "").localeCompare(b.created_at ?? "") ||
      a.id.localeCompare(b.id),
  )
}

/** Dense 0..n-1 positions in the current sort order. */
export function normalizePositions<T extends { id: string; position: number; created_at?: string }>(
  phases: T[],
): PhasePosition[] {
  return sortPhases(phases).map((p, i) => ({ id: p.id, position: i }))
}

/**
 * Move one phase up or down by a single slot. Returns the full normalised
 * position list (unchanged if the move is a no-op at either end), so the
 * caller can persist every affected row in one batch.
 */
export function movePhase<T extends { id: string; position: number; created_at?: string }>(
  phases: T[],
  id: string,
  direction: "up" | "down",
): PhasePosition[] {
  const ordered = sortPhases(phases)
  const index = ordered.findIndex((p) => p.id === id)
  if (index === -1) return normalizePositions(ordered)
  const target = direction === "up" ? index - 1 : index + 1
  if (target < 0 || target >= ordered.length) return normalizePositions(ordered)
  const next = [...ordered]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next.map((p, i) => ({ id: p.id, position: i }))
}

// ── Legacy milestone conversion ─────────────────────────────────────────────

export interface LegacyMilestone {
  title: string
  due_date?: string
  done?: boolean
}

export interface PhaseDraft {
  title: string
  objective: string | null
  start_date: string | null
  end_date: string | null
  status: PhaseStatus
  position: number
}

const toYmd = (raw?: string | null): string | null => {
  if (!raw) return null
  const str = String(raw).trim()
  if (YMD.test(str)) return str
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

/**
 * Preview conversion of `goal.metadata.milestones` into ordered phase drafts.
 * Pure — it never touches the stored metadata. Rules:
 *
 * - Milestones keep their listed order; dated ones are sorted before the
 *   undated tail so the resulting phases run chronologically.
 * - A milestone's due date becomes the phase's `end_date`; the phase starts
 *   the day after the previous phase ends (or at `goalStartDate` for the
 *   first), so converted phases tile the timeline without overlapping.
 * - `done` milestones convert to `completed` phases; everything else is
 *   `planned`.
 */
export function milestonesToPhaseDrafts(
  milestones: LegacyMilestone[],
  options: { goalStartDate?: string | null; goalTargetDate?: string | null } = {},
): PhaseDraft[] {
  const cleaned = milestones
    .filter((m) => typeof m?.title === "string" && m.title.trim().length > 0)
    .map((m, i) => ({ ...m, title: m.title.trim(), due: toYmd(m.due_date), order: i }))

  const dated = cleaned.filter((m) => m.due !== null).sort((a, b) => a.due!.localeCompare(b.due!) || a.order - b.order)
  const undated = cleaned.filter((m) => m.due === null)
  const ordered = [...dated, ...undated]

  const goalStart = toYmd(options.goalStartDate)
  const goalTarget = toYmd(options.goalTargetDate)

  let cursor = goalStart
  return ordered.map((m, i) => {
    const end = m.due ?? (i === ordered.length - 1 ? goalTarget : null)
    // A due date earlier than the running cursor would produce an inverted
    // range; fall back to a start-less phase rather than emitting bad dates.
    const start = cursor && end && end < cursor ? null : cursor
    if (end) cursor = addDaysYmd(end, 1)
    return {
      title: m.title,
      objective: null,
      start_date: start,
      end_date: end,
      status: m.done ? ("completed" as const) : ("planned" as const),
      position: i,
    }
  })
}

/** Add whole days to a YYYY-MM-DD string in UTC (never touches local time). */
export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}
