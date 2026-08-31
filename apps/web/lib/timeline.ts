// Unified Timeline — pure, read-side aggregation over already-fetched arrays
// from six independent sources. No Supabase calls here; hooks/useTimeline.ts
// fetches each source (bounded by date range) and hands the raw rows to
// buildTimeline(). Framework-free so the merge/filter/group logic is tested.
//
// Four kinds a user could otherwise confuse, each labeled distinctly so the
// difference stays visible in the UI rather than only in this comment:
//   - "task"            → a PLANNED task that got COMPLETED (not upcoming/incomplete ones)
//   - "habit_checkin"    → a recurring habit, completed for the day
//   - "hengo_session"    → automatically tracked TIME SPENT INSIDE HENGO — never
//                          real-life activity, just app usage
//   - "manual_activity"  → something the user explicitly logged as having
//                          happened in real life
//   - "journal"          → a journal entry
//   - "recovery_checkin" → a Recovery daily check-in (careful, private wording —
//                          never surface habitId→label lookups here; only the
//                          user-authored free-text fields already on the row)

import { toLocalDateString } from "./date-utils"

export type TimelineKind =
  "task" | "habit_checkin" | "hengo_session" | "manual_activity" | "journal" | "recovery_checkin"

export interface TimelineEntry {
  id: string
  kind: TimelineKind
  occurredAt: string
  title: string
  description?: string
  href?: string
  durationMinutes?: number
  tags?: string[]
}

export const TIMELINE_KIND_META: Record<TimelineKind, { label: string; groupLabel: string }> = {
  task: { label: "Task completed", groupLabel: "Planned tasks, completed" },
  habit_checkin: { label: "Habit check-in", groupLabel: "Completed activities" },
  hengo_session: { label: "Time in Hengo", groupLabel: "Time spent inside Hengo" },
  manual_activity: { label: "Activity logged", groupLabel: "Manually recorded real-life activity" },
  journal: { label: "Journal entry", groupLabel: "Journal" },
  recovery_checkin: { label: "Check-in", groupLabel: "Recovery" },
}

// ── Normalizers — one per source, matching only the fields each needs ──────

export interface TimelineTaskSource {
  id: string
  title?: string | null
  description: string
  completed: boolean
  start_date: string
  end_date: string
  goal_id?: string | null
}

export function fromTask(task: TimelineTaskSource): TimelineEntry | null {
  if (!task.completed) return null
  return {
    id: `task:${task.id}`,
    kind: "task",
    occurredAt: task.end_date || task.start_date,
    title: task.title?.trim() || task.description.slice(0, 80) || "Task",
    description: task.title ? task.description : undefined,
    href: task.goal_id ? `/goals/${task.goal_id}/tasks` : "/goals/tasks",
  }
}

export interface TimelineHabitCheckinSource {
  id: string
  habitId: string
  habitLabel: string
  date: string
  completed: boolean
}

export function fromHabitCheckin(checkin: TimelineHabitCheckinSource): TimelineEntry | null {
  if (!checkin.completed) return null
  return {
    id: `habit_checkin:${checkin.id}`,
    kind: "habit_checkin",
    occurredAt: `${checkin.date}T12:00:00`,
    title: `${checkin.habitLabel} — checked in`,
    href: `/growth/habits`,
  }
}

export interface TimelineActivityLogSource {
  feature: string
  durationMs: number
  createdAt: string
}

/**
 * kori_activity_log has many rows per feature per day (every action logs a
 * zero-duration row; useSessionTimer adds time-on-page rows) — merged into
 * one entry per (local day, feature) so the timeline shows "12 min in Vocab",
 * not dozens of near-empty rows for the same session.
 */
export function buildHengoSessionEntries(rows: TimelineActivityLogSource[]): TimelineEntry[] {
  const groups = new Map<
    string,
    { feature: string; date: string; totalMs: number; latest: string }
  >()
  for (const row of rows) {
    const date = toLocalDateString(new Date(row.createdAt))
    const key = `${date}:${row.feature}`
    const existing = groups.get(key)
    if (existing) {
      existing.totalMs += row.durationMs
      if (row.createdAt > existing.latest) existing.latest = row.createdAt
    } else {
      groups.set(key, {
        feature: row.feature,
        date,
        totalMs: row.durationMs,
        latest: row.createdAt,
      })
    }
  }
  return [...groups.values()].map((g) => ({
    id: `hengo_session:${g.date}:${g.feature}`,
    kind: "hengo_session" as const,
    occurredAt: g.latest,
    title: `${Math.round(g.totalMs / 60000)} min in ${featureLabel(g.feature)}`,
    durationMinutes: Math.round(g.totalMs / 60000),
  }))
}

function featureLabel(feature: string): string {
  return feature
    .split(/[_-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export interface TimelineManualActivitySource {
  id: string
  occurredAt: string
  label: string
  category?: string | null
  durationMinutes?: number | null
  notes?: string | null
}

export function fromManualActivity(activity: TimelineManualActivitySource): TimelineEntry {
  return {
    id: `manual_activity:${activity.id}`,
    kind: "manual_activity",
    occurredAt: activity.occurredAt,
    title: activity.label,
    description: activity.notes ?? undefined,
    durationMinutes: activity.durationMinutes ?? undefined,
    tags: activity.category ? [activity.category] : undefined,
    href: "/timeline",
  }
}

export interface TimelineJournalSource {
  id: string
  occurredAt: string
  title?: string | null
  content: string
  achievement?: string | null
  tags?: string[]
}

/**
 * Falls back through title -> content -> achievement -> generic label, since
 * a daily-template entry (the common case) often leaves `content` empty and
 * puts the actual narrative in `achievement` instead.
 */
export function fromJournalEntry(entry: TimelineJournalSource): TimelineEntry {
  const title =
    entry.title?.trim() ||
    entry.content.slice(0, 80).trim() ||
    entry.achievement?.slice(0, 80).trim() ||
    "Journal entry"
  return {
    id: `journal:${entry.id}`,
    kind: "journal",
    occurredAt: entry.occurredAt,
    title,
    description: entry.title ? entry.content.slice(0, 140) : undefined,
    tags: entry.tags,
    href: "/growth/journal",
  }
}

export interface TimelineRecoveryCheckinSource {
  id: string
  date: string
  mood?: string
  win?: string
  intention?: string
}

/**
 * Domain-neutral by design — only ever surfaces the user's own free-text
 * (mood/win/intention), never a habit label or anything behavior-specific.
 */
export function fromRecoveryCheckin(checkin: TimelineRecoveryCheckinSource): TimelineEntry {
  const summary = checkin.win || checkin.intention || checkin.mood
  return {
    id: `recovery_checkin:${checkin.id}`,
    kind: "recovery_checkin",
    occurredAt: `${checkin.date}T12:00:00`,
    title: summary ? `Check-in — ${summary}` : "Check-in",
    href: "/growth/recovery",
  }
}

// ── Aggregation ──────────────────────────────────────────────────────────────

export interface TimelineSources {
  tasks?: TimelineTaskSource[]
  habitCheckins?: TimelineHabitCheckinSource[]
  activityLog?: TimelineActivityLogSource[]
  manualActivities?: TimelineManualActivitySource[]
  journalEntries?: TimelineJournalSource[]
  recoveryCheckins?: TimelineRecoveryCheckinSource[]
}

export function buildTimeline(sources: TimelineSources): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  for (const task of sources.tasks ?? []) {
    const entry = fromTask(task)
    if (entry) entries.push(entry)
  }
  for (const checkin of sources.habitCheckins ?? []) {
    const entry = fromHabitCheckin(checkin)
    if (entry) entries.push(entry)
  }
  entries.push(...buildHengoSessionEntries(sources.activityLog ?? []))
  for (const activity of sources.manualActivities ?? []) entries.push(fromManualActivity(activity))
  for (const entry of sources.journalEntries ?? []) entries.push(fromJournalEntry(entry))
  for (const checkin of sources.recoveryCheckins ?? []) entries.push(fromRecoveryCheckin(checkin))

  return entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

// ── Filtering / grouping ─────────────────────────────────────────────────────

export interface TimelineFilters {
  kind?: TimelineKind | "all"
  query?: string
}

export function filterTimelineEntries(
  entries: TimelineEntry[],
  filters: TimelineFilters,
): TimelineEntry[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? ""
  return entries.filter((entry) => {
    if (filters.kind && filters.kind !== "all" && entry.kind !== filters.kind) return false
    if (!normalizedQuery) return true
    return `${entry.title} ${entry.description ?? ""}`.toLowerCase().includes(normalizedQuery)
  })
}

export interface DailySummary {
  date: string
  entries: TimelineEntry[]
  hengoMinutes: number
  completedCount: number
  manualActivityCount: number
  journalCount: number
}

/** Groups already-sorted (newest-first) entries into per-local-day summaries, newest day first. */
export function groupTimelineByDay(entries: TimelineEntry[]): DailySummary[] {
  const byDate = new Map<string, TimelineEntry[]>()
  for (const entry of entries) {
    const date = toLocalDateString(new Date(entry.occurredAt))
    const list = byDate.get(date) ?? []
    list.push(entry)
    byDate.set(date, list)
  }
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dayEntries]) => ({
      date,
      entries: dayEntries,
      hengoMinutes: dayEntries
        .filter((e) => e.kind === "hengo_session")
        .reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0),
      completedCount: dayEntries.filter((e) => e.kind === "task" || e.kind === "habit_checkin")
        .length,
      manualActivityCount: dayEntries.filter((e) => e.kind === "manual_activity").length,
      journalCount: dayEntries.filter((e) => e.kind === "journal").length,
    }))
}
