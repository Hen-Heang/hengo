import { aiPost } from "./ai-client"

export type ReviewType = "morning" | "evening" | "weekly"

export interface ReviewSummary {
  summary: string
  focusSuggestion: string
}

export const reviewApi = {
  summarize: async (reviewType: ReviewType, context: string): Promise<ReviewSummary> =>
    aiPost<ReviewSummary>("/review/summarize", { reviewType, context }),
}
