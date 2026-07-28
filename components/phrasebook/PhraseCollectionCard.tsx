"use client"

import Link from "next/link"
import { Pin, PinOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { PhraseCollection } from "@/lib/types"

interface PhraseCollectionCardProps {
  collection: PhraseCollection
  cardCount: number
  masteredCount: number
  dueCount: number
  onTogglePin?: () => void
}

export function PhraseCollectionCard({ collection, cardCount, masteredCount, dueCount, onTogglePin }: PhraseCollectionCardProps) {
  const progress = cardCount > 0 ? Math.round((masteredCount / cardCount) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40">
      {onTogglePin && (
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={collection.pinned ? "Unpin collection" : "Pin collection"}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collection.pinned ? <Pin size={14} strokeWidth={2.5} className="fill-current" /> : <PinOff size={14} strokeWidth={2.5} />}
        </button>
      )}
      <Badge variant="outline" className="mb-2 uppercase">
        {collection.category}
      </Badge>
      <Link href={`/phrasebook/${collection.id}`} className="block">
        <h3 className="pr-8 text-lg font-bold leading-snug text-foreground hover:underline">{collection.titleEn}</h3>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">{collection.titleKo}</p>
      </Link>
      {collection.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{collection.description}</p>}

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent/40">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-xs font-bold text-muted-foreground">{masteredCount}/{cardCount}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{dueCount > 0 ? `${dueCount} due` : "All caught up"}</span>
        <Link href={`/phrasebook/${collection.id}`} className="text-primary hover:underline">
          Open →
        </Link>
      </div>
    </div>
  )
}
