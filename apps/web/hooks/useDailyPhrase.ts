"use client"

import { useQuery } from "@tanstack/react-query"

import { dailyPhraseApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

// Query key factory, same pattern as useStreak/useVocab — lets any future
// caller (e.g. the /practice page) share this cache instead of refetching.
export const dailyPhraseQueryKey = (userId?: string | null) => ["daily-phrase", userId] as const

/**
 * Today's phrase (generated once per day server-side, see
 * lib/api/learning.ts's dailyPhraseApi.getToday). Read-only wrapper for
 * surfaces — like the Today page's compact phrase card — that only need to
 * display it, not the mark-learned/save-to-flashcards mutations DailyPhraseCard
 * owns.
 */
export function useDailyPhrase() {
  const userId = getUserId()

  const { data, isPending, isError } = useQuery({
    queryKey: dailyPhraseQueryKey(userId),
    queryFn: () => dailyPhraseApi.getToday(),
    enabled: userId != null,
  })

  return {
    phrase: data ?? null,
    loading: isPending,
    error: isError,
  }
}
