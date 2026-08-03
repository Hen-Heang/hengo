import type { VocabItem } from "./types"

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function normalizeAnswer(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?~…·。、'’"“”()[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Lenient comparison for typed recall answers: Unicode-normalized,
 * case/whitespace/punctuation-insensitive. A term like "출시(하다)" accepts
 * both "출시하다" and "출시". A term listing alternatives with "/" (e.g.
 * "구매하다 / 구입하다 / 사다") accepts any single alternative, not just the
 * full joined string.
 */
export function isCorrectTerm(input: string, term: string): boolean {
  const answer = normalizeAnswer(input)
  if (!answer) return false
  const variants = new Set<string>()
  for (const part of [term, ...term.split("/")]) {
    variants.add(normalizeAnswer(part))
    variants.add(normalizeAnswer(part.replace(/\([^)]*\)/g, "")))
  }
  return variants.has(answer)
}

// All-time best correct-streak in vocab tests (Quiz/Recall) — see
// lib/vocab-best-streak-store.ts for the backend-backed store.

export type MasteryFilter = "all" | "weak" | "learning" | "mastered"

export function matchesMastery(mastery: number, filter: MasteryFilter): boolean {
  switch (filter) {
    case "weak":
      return mastery < 50
    case "learning":
      return mastery >= 50 && mastery < 80
    case "mastered":
      return mastery >= 80
    default:
      return true
  }
}

export function filterVocab(
  words: VocabItem[],
  query: string,
  filter: MasteryFilter
): VocabItem[] {
  const q = query.trim().toLowerCase()
  return words.filter((word) => {
    if (!matchesMastery(word.mastery, filter)) return false
    if (!q) return true
    return [word.term, word.meaning, word.pronunciation ?? "", word.category, ...word.tags].some(
      (field) => field.toLowerCase().includes(q)
    )
  })
}

export type SortOrder = "alpha" | "mastery-asc" | "mastery-desc" | "due"

/**
 * Returns a new array sorted by the chosen order. Ties fall back to the term
 * so the result is stable regardless of the input order.
 */
export function sortVocab(words: VocabItem[], order: SortOrder): VocabItem[] {
  const byTerm = (a: VocabItem, b: VocabItem) => a.term.localeCompare(b.term, "ko")
  return [...words].sort((a, b) => {
    switch (order) {
      case "mastery-asc":
        return a.mastery - b.mastery || byTerm(a, b)
      case "mastery-desc":
        return b.mastery - a.mastery || byTerm(a, b)
      case "due":
        return a.nextReview.localeCompare(b.nextReview) || byTerm(a, b)
      default:
        return byTerm(a, b)
    }
  })
}

export type VocabStats = {
  total: number
  weak: number
  learning: number
  mastered: number
  averageMastery: number
}

/** Aggregates a deck into the mastery buckets used across the dictionary. */
export function computeVocabStats(words: VocabItem[]): VocabStats {
  const stats = words.reduce(
    (acc, word) => {
      acc.sum += word.mastery
      if (word.mastery >= 80) acc.mastered += 1
      else if (word.mastery >= 50) acc.learning += 1
      else acc.weak += 1
      return acc
    },
    { sum: 0, weak: 0, learning: 0, mastered: 0 }
  )

  return {
    total: words.length,
    weak: stats.weak,
    learning: stats.learning,
    mastered: stats.mastered,
    averageMastery: words.length ? Math.round(stats.sum / words.length) : 0,
  }
}
