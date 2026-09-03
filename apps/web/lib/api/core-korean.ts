import { romanize } from "es-hangul"

import { requireUserId } from "@/lib/auth-store"
import { normalizeCoreKoreanTerm, type CoreKoreanEntry } from "@/lib/core-korean-vocab"
import { supabase } from "@/lib/supabase"

function autoPronunciation(term: string): string | null {
  if (!/[가-힣]/.test(term)) return null
  try {
    return romanize(term)
  } catch {
    return null
  }
}

/**
 * Adds a learner-requested Core Korean batch without touching existing cards.
 * Coverage is term-based, so an older card already carrying the same Korean
 * term counts even if it predates the Core 300 taxonomy tags.
 */
export const coreKoreanApi = {
  addBatch: async (entries: CoreKoreanEntry[]): Promise<number> => {
    if (entries.length === 0) return 0

    const userId = requireUserId()
    const { data: existingRows, error: existingError } = await supabase
      .from("kori_vocab_cards")
      .select("term")
    if (existingError) throw existingError

    const existingTerms = new Set(
      (existingRows ?? []).map((row) => normalizeCoreKoreanTerm(row.term)),
    )
    const seen = new Set(existingTerms)
    const missing = entries.filter((entry) => {
      const key = normalizeCoreKoreanTerm(entry.term)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (missing.length === 0) return 0

    const { data, error } = await supabase
      .from("kori_vocab_cards")
      .insert(
        missing.map((entry) => ({
          user_id: userId,
          category: entry.category,
          term: entry.term,
          meaning: entry.meaning,
          pronunciation: autoPronunciation(entry.term),
          difficulty_level: entry.tags.includes("level:a2") ? "Medium" : "Easy",
          tags: entry.tags,
        })),
      )
      .select("id")
    if (error) throw error

    return data?.length ?? 0
  },
}
