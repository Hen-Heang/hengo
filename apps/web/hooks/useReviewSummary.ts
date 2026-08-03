"use client"

import { useQuery } from "@tanstack/react-query"

import { reviewApi, type ReviewType } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

/** One-shot AI summary for a review surface, keyed by the exact context
 * string — a query (not a mutation) so it's cached per day/week's data and
 * doesn't re-hit the model on every re-render or tab revisit. `context` is
 * the already-formatted, bounded text block from lib/review.ts's
 * `format*Context` helpers; empty means the underlying data isn't ready yet. */
export function useReviewSummary(reviewType: ReviewType, context: string) {
  const userId = getUserId()
  const { data, isPending, isError } = useQuery({
    queryKey: ["review-summary", userId, reviewType, context],
    queryFn: () => reviewApi.summarize(reviewType, context),
    enabled: userId != null && context.length > 0,
    staleTime: 30 * 60 * 1000,
  })

  return {
    summary: data?.summary ?? "",
    focusSuggestion: data?.focusSuggestion ?? "",
    loading: isPending && context.length > 0,
    error: isError ? "Couldn't generate a summary right now." : "",
  }
}
