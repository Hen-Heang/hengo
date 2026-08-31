// Journal — pure domain types + logic. Framework-free so it's covered by
// colocated Vitest tests; Supabase access lives in lib/api/journal.ts.

export interface JournalEntry {
  id: string
  occurredAt: string
  title: string | null
  content: string
  mood: number | null
  energy: number | null
  achievement: string | null
  blocker: string | null
  lesson: string | null
  gratitude: string | null
  tags: string[]
  goalId: string | null
  habitId: string | null
  createdAt: string
  updatedAt: string
}

export interface JournalEntryInput {
  occurredAt?: string
  title?: string | null
  content?: string
  mood?: number | null
  energy?: number | null
  achievement?: string | null
  blocker?: string | null
  lesson?: string | null
  gratitude?: string | null
  tags?: string[]
  goalId?: string | null
  habitId?: string | null
}

export const MOOD_LABELS = ["", "Struggling", "Low", "Okay", "Good", "Great"] as const
export const ENERGY_LABELS = ["", "Drained", "Tired", "Steady", "Energized", "On fire"] as const

/** The mission's "lightweight daily template" — four prompts, none mandatory. */
export const DAILY_TEMPLATE_PROMPTS = [
  { key: "achievement", label: "What did I do today?", placeholder: "Shipped the login redesign…" },
  {
    key: "lesson",
    label: "What did I learn?",
    placeholder: "TIL Postgres generated columns can't be volatile…",
  },
  {
    key: "blocker",
    label: "What was difficult?",
    placeholder: "Got stuck debugging a race condition…",
  },
  {
    key: "tomorrow",
    label: "What should I do tomorrow?",
    placeholder: "Follow up on the PR review…",
  },
] as const

export type DailyTemplateKey = (typeof DAILY_TEMPLATE_PROMPTS)[number]["key"]
export type DailyTemplateAnswers = Partial<Record<DailyTemplateKey, string>>

/**
 * Merges the daily template's answers into a single entry — achievement/
 * lesson/blocker land in their own dedicated columns (so Timeline/Ask Hengo
 * can query them structurally); "tomorrow" has no dedicated column, so it's
 * folded into `content` as a plain narrative line instead of being dropped.
 */
export function buildEntryFromTemplate(answers: DailyTemplateAnswers): Partial<JournalEntryInput> {
  const tomorrow = answers.tomorrow?.trim()
  return {
    achievement: answers.achievement?.trim() || undefined,
    lesson: answers.lesson?.trim() || undefined,
    blocker: answers.blocker?.trim() || undefined,
    content: tomorrow ? `**Tomorrow:** ${tomorrow}` : undefined,
  }
}

const MAX_TITLE_LENGTH = 200
const MAX_TEXT_FIELD_LENGTH = 4000

export interface JournalValidationErrors {
  title?: string
  content?: string
  mood?: string
  energy?: string
  overall?: string
}

function isValidRating(value: number | null | undefined): boolean {
  return value == null || (Number.isInteger(value) && value >= 1 && value <= 5)
}

/** Nothing is individually required, but a completely blank entry isn't meaningful. */
export function validateJournalEntryInput(input: JournalEntryInput): JournalValidationErrors {
  const errors: JournalValidationErrors = {}

  if (input.title && input.title.trim().length > MAX_TITLE_LENGTH) {
    errors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`
  }
  if (input.content && input.content.trim().length > MAX_TEXT_FIELD_LENGTH) {
    errors.content = `Keep it under ${MAX_TEXT_FIELD_LENGTH} characters.`
  }
  if (!isValidRating(input.mood)) errors.mood = "Mood must be between 1 and 5."
  if (!isValidRating(input.energy)) errors.energy = "Energy must be between 1 and 5."

  const hasAnyContent = [
    input.title,
    input.content,
    input.achievement,
    input.blocker,
    input.lesson,
    input.gratitude,
  ].some((field) => field && field.trim().length > 0)
  const hasAnyRating = input.mood != null || input.energy != null

  if (!hasAnyContent && !hasAnyRating) {
    errors.overall = "Write something, or at least log a mood/energy rating."
  }

  return errors
}

export function isJournalEntryInputValid(input: JournalEntryInput): boolean {
  return Object.keys(validateJournalEntryInput(input)).length === 0
}

// ── Filtering / sorting ──────────────────────────────────────────────────────

export interface JournalFilters {
  query?: string
  tag?: string | "all"
  goalId?: string | "all"
}

function matchesQuery(entry: JournalEntry, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true
  const haystack = [
    entry.title,
    entry.content,
    entry.achievement,
    entry.blocker,
    entry.lesson,
    entry.gratitude,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(normalizedQuery)
}

export function filterJournalEntries(
  entries: JournalEntry[],
  filters: JournalFilters,
): JournalEntry[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? ""
  return entries.filter((entry) => {
    if (filters.tag && filters.tag !== "all" && !entry.tags.includes(filters.tag)) return false
    if (filters.goalId && filters.goalId !== "all" && entry.goalId !== filters.goalId) return false
    return matchesQuery(entry, normalizedQuery)
  })
}

export function sortJournalEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

export function collectJournalTags(entries: JournalEntry[]): string[] {
  const tags = new Set<string>()
  for (const entry of entries) for (const tag of entry.tags) tags.add(tag)
  return [...tags].sort()
}
