"use client"

import { Sparkles, Target } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

/** Shared AI-summary block for all three review surfaces — a short narrative
 * plus one concrete nudge, both strictly bounded to whatever counts/labels
 * were actually passed to the model (see lib/review.ts's format*Context). */
export function ReviewSummaryCard({
  summary,
  focusSuggestion,
  loading,
  error,
}: {
  summary: string
  focusSuggestion: string
  loading: boolean
  error: string
}) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>
  }

  if (!summary) return null

  return (
    <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Sparkles size={13} />
        Hengo
      </div>
      <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      {focusSuggestion && (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <Target size={14} className="mt-0.5 shrink-0" />
          {focusSuggestion}
        </p>
      )}
    </div>
  )
}
