"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { vocabApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { useLogActivity } from "@/hooks/useLogActivity"
import { isDue, type ReviewRating } from "@/lib/srs"
import type { VocabItem } from "@/lib/types"

function normalizeWord(raw: unknown): VocabItem {
  const source = (raw ?? {}) as Record<string, unknown>
  return {
    id: String(source.id ?? crypto.randomUUID()),
    category: String(source.category ?? "Saved phrases"),
    term: String(source.term ?? ""),
    meaning: String(source.meaning ?? ""),
    example: source.example ? String(source.example) : undefined,
    exampleTranslation: source.exampleTranslation ? String(source.exampleTranslation) : undefined,
    pronunciation: source.pronunciation ? String(source.pronunciation) : undefined,
    difficultyLevel: source.difficultyLevel as VocabItem["difficultyLevel"],
    mastery: Number(source.mastery ?? 0),
    nextReview: String(source.nextReview ?? "-"),
    tags: Array.isArray(source.tags) ? source.tags.map((tag) => String(tag)) : [],
    easeFactor: Number(source.easeFactor ?? 2.5),
    intervalDays: Number(source.intervalDays ?? 0),
    repetitions: Number(source.repetitions ?? 0),
    lapses: Number(source.lapses ?? 0),
  }
}

interface VocabData {
  savedWords: VocabItem[]
  dueWords: VocabItem[]
  dueCount: number
}

async function fetchWords(): Promise<VocabData> {
  const [savedData, dueData, dueCount] = await Promise.all([
    vocabApi.getSavedWords(),
    vocabApi.getDueWords(),
    vocabApi.getDueCount(),
  ])

  const savedWords = Array.isArray(savedData) ? savedData.map(normalizeWord) : []

  // Due is a subset of saved by definition — both are rows of kori_vocab_cards,
  // one filtered by next_review. If the count exceeds the collection we did not
  // over-count the due rows, we under-read the collection (a silently truncated
  // getSavedWords is what did it before). Shout in dev rather than rendering
  // "1,107 due of 1,000 saved" again.
  if (process.env.NODE_ENV !== "production" && dueCount > savedWords.length) {
    console.error(
      `[vocab] impossible stats: ${dueCount} due > ${savedWords.length} saved. ` +
        "getSavedWords is returning an incomplete collection — check its pagination.",
    )
  }

  return {
    savedWords,
    dueWords: Array.isArray(dueData) ? dueData.map(normalizeWord) : [],
    dueCount,
  }
}

export const vocabQueryKey = (userId?: string | null) => ["vocab", userId] as const

// Nested under vocabQueryKey's prefix on purpose: useVocab's invalidate()
// passes ["vocab", userId], which TanStack matches by prefix — so grading a
// card refreshes this count too instead of leaving Study showing a stale one.
export const vocabDueCountQueryKey = (userId?: string | null) =>
  ["vocab", userId, "due-count"] as const

/**
 * Just the backlog size, from the same `vocabApi.getDueCount` the full
 * `useVocab` reads — for surfaces that need to say "N words are still due"
 * without pulling the learner's entire collection (a 1,000-row fetch) to get
 * there. Anything that also renders cards should use `useVocab` instead.
 */
export function useVocabDueCount() {
  const userId = getUserId()
  const { data, isPending } = useQuery({
    queryKey: vocabDueCountQueryKey(userId),
    queryFn: vocabApi.getDueCount,
    enabled: userId != null,
  })
  return { dueCount: data ?? 0, loading: isPending }
}

export function useVocab() {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const { logActivity } = useLogActivity("vocab")
  const key = vocabQueryKey(userId)

  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: fetchWords,
    enabled: userId != null,
  })

  const words = data?.savedWords ?? []
  const dueToday = data?.dueWords ?? []
  const dueCount = data?.dueCount ?? 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key })

  // Manually add a single word, creating its topic/category on the fly if new.
  const addWord = async (data: {
    category?: string
    term: string
    meaning: string
    example?: string
  }) => {
    const saved = await vocabApi.save(data)
    await invalidate()
    void logActivity()
    return saved
  }

  // Patch the cache from the response instead of refetching the whole deck, so
  // grading mid-session is instant. When the batch empties but more cards are
  // still due (dueCount spans the whole backlog, the batch is one slice),
  // refetch to load the next batch.
  const rateWord = async (id: string, rating: ReviewRating) => {
    const updated = normalizeWord(await vocabApi.rate(id, rating))
    let batchDone = false
    queryClient.setQueryData<VocabData>(key, (prev) => {
      if (!prev) return prev
      const savedWords = prev.savedWords.map((w) => (w.id === id ? updated : w))
      const wasDue = prev.dueWords.some((w) => w.id === id)
      const without = prev.dueWords.filter((w) => w.id !== id)
      const stillDue = isDue(updated.nextReview)
      const dueWords = stillDue ? [...without, updated] : without
      const dueCount = Math.max(0, prev.dueCount - (wasDue && !stillDue ? 1 : 0))
      batchDone = dueWords.length === 0 && dueCount > 0
      return { savedWords, dueWords, dueCount }
    })
    if (batchDone) await invalidate()
    void logActivity()
  }

  const generate = async (category: string) => {
    const generated = await vocabApi.generate(category)
    await invalidate()
    return generated
  }

  const updateWord = async (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string },
  ) => {
    await vocabApi.update(id, data)
    await invalidate()
  }

  const deleteWord = async (id: string) => {
    await vocabApi.remove(id)
    await invalidate()
  }

  const importList = async (category: string, text: string) => {
    const imported = await vocabApi.importList(category, text)
    await invalidate()
    return Array.isArray(imported) ? imported.length : 0
  }

  return {
    dueToday,
    dueCount,
    error: isError ? "Failed to load vocabulary data." : "",
    loading: isPending,
    addWord,
    rateWord,
    generate,
    importList,
    updateWord,
    deleteWord,
    words,
  }
}
