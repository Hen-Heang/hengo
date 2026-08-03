// Types, categories, and reading progress.
// Reading UNITS now live in Postgres (see lib/reading-store.ts), and so does
// per-unit progress (see lib/reading-progress-store.ts) — this file only keeps
// the shapes, the category metadata, and a couple of pure helpers.
// Relative imports only so vitest (no path-alias setup) can resolve this file.
import type { QuizQuestion } from "./types"

export type ReadingCategory = "DAILY_LIFE" | "CULTURE" | "BEGINNER_STORY"

export interface ReadingParagraph {
  korean: string
  english: string
}

export interface ReadingVocab {
  term: string
  meaning: string
  example?: string
}

export interface ReadingUnit {
  id: string
  episode?: string
  title: string
  titleEnglish: string
  category: ReadingCategory
  level: "Beginner" | "Intermediate"
  summary: string
  source: string
  grammarNote?: {
    pattern: string
    explanation: string
  }
  paragraphs: ReadingParagraph[]
  vocab: ReadingVocab[]
  quiz: QuizQuestion[]
}

export const READING_CATEGORIES: Record<
  ReadingCategory,
  { label: string; description: string }
> = {
  DAILY_LIFE: {
    label: "Daily Life",
    description: "Podcast transcripts about everyday life in Korea",
  },
  CULTURE: {
    label: "Culture & Etiquette",
    description: "Short articles about Korean culture and customs",
  },
  BEGINNER_STORY: {
    label: "Beginner Stories",
    description: "Super-simple stories with one grammar point each",
  },
}

// ── Pure helpers (kept for unit tests / id generation) ──

export type StoredUnitMap = Record<string, ReadingUnit | null>

/**
 * Merge built-in units with a stored override map.
 * A stored entry overrides the built-in with the same id; `null` hides a built-in.
 */
export function mergeReadingUnits(
  builtins: ReadingUnit[],
  stored: StoredUnitMap
): ReadingUnit[] {
  const merged: ReadingUnit[] = []
  for (const unit of builtins) {
    const entry = stored[unit.id]
    if (entry === null) continue
    merged.push(entry ?? unit)
  }
  for (const [id, entry] of Object.entries(stored)) {
    if (!entry) continue
    if (builtins.some((u) => u.id === id)) continue
    merged.push(entry)
  }
  return merged
}

export function createReadingUnitId(title: string, existingIds?: Set<string>): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "unit"
  const taken = existingIds ?? new Set<string>()
  if (!taken.has(base)) return base
  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}

// ── Progress (types only — see lib/reading-progress-store.ts for the
// backend-backed store) ──

export type ReadingStatus = "not_started" | "in_progress" | "completed"

export interface ReadingProgressEntry {
  status: ReadingStatus
  quizScore?: number
  quizTotal?: number
  completedAt?: string
  /** Pinned units are sorted to the top of their category on the list page. */
  pinned?: boolean
}
