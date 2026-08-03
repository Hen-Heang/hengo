"use client"

import { useMemo, useState } from "react"
import { ArrowDownUp, LayoutGrid, Layers3, List, Plus, SearchX } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { VocabDeck } from "@/components/vocab/VocabDeck"
import { VocabStats } from "@/components/vocab/VocabStats"
import {
  filterVocab,
  matchesMastery,
  sortVocab,
  type MasteryFilter,
  type SortOrder,
} from "@/lib/vocab-review"
import type { VocabItem } from "@/lib/types"

export type VocabViewMode = "list" | "grid"

type VocabDictionaryProps = {
  words: VocabItem[]
  loading: boolean
  dueCount?: number
  // Driven by the page-level search bar at the top of /vocab — the dictionary
  // has no search input of its own.
  query: string
  onUpdate: (
    id: string,
    data: { term: string; meaning: string; example?: string; pronunciation?: string }
  ) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
  /** Enables the per-deck inline "add word" form; the deck supplies its category. */
  onAdd?: (data: {
    category?: string
    term: string
    meaning: string
    example?: string
  }) => Promise<unknown>
  /** Opens the Add Words dialog — shown as the CTA in the empty state. */
  onStartAdd?: () => void
  /** Clears the page-owned search input from the no-results state. */
  onClearSearch?: () => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const

function groupByCategory(words: VocabItem[]) {
  const groups = words.reduce<Record<string, VocabItem[]>>((acc, word) => {
    ;(acc[word.category] ??= []).push(word)
    return acc
  }, {})
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
}

function DeckSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40">
          {/* top mastery bar */}
          <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-none" />
          <div className="flex items-start justify-between gap-4 pt-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-7 w-12 rounded-2xl" />
          </div>
          <Skeleton className="mt-6 h-20 w-full rounded-2xl" />
          <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

const MASTERY_FILTERS: { value: MasteryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "weak", label: "Weak" },
  { value: "learning", label: "Learning" },
  { value: "mastered", label: "Mastered" },
]

const SORT_ORDERS: { value: SortOrder; label: string }[] = [
  { value: "alpha", label: "A → Z" },
  { value: "mastery-asc", label: "Weakest first" },
  { value: "mastery-desc", label: "Strongest first" },
  { value: "due", label: "Due soonest" },
]

export function VocabDictionary({
  words,
  loading,
  dueCount = 0,
  query,
  onUpdate,
  onDelete,
  onAdd,
  onStartAdd,
  onClearSearch,
}: VocabDictionaryProps) {
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("alpha")
  const [viewMode, setViewMode] = useState<VocabViewMode>("list")
  const isFiltering = query.trim().length > 0 || masteryFilter !== "all"

  const filtered = useMemo(
    () => sortVocab(filterVocab(words, query, masteryFilter), sortOrder),
    [words, query, masteryFilter, sortOrder]
  )
  const decks = useMemo(() => groupByCategory(filtered), [filtered])

  // Per-bucket counts so the filter chips advertise the result before selection.
  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        MASTERY_FILTERS.map(({ value }) => [
          value,
          value === "all"
            ? words.length
            : words.filter((word) => matchesMastery(word.mastery, value)).length,
        ])
      ) as Record<MasteryFilter, number>,
    [words]
  )

  function clearFilters() {
    setMasteryFilter("all")
    onClearSearch?.()
  }

  return (
    <div id="vocab-dictionary" className="scroll-mt-20 space-y-5">
      <VocabStats words={words} dueCount={dueCount} />

      {words.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm dark:bg-slate-900/50">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 px-4 py-3.5 sm:px-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Browse decks</h3>
              <p className="mt-0.5 text-xs text-muted-foreground" aria-live="polite">
                {isFiltering
                  ? `Showing ${filtered.length} of ${words.length} words`
                  : `${words.length} words across ${decks.length} decks`}
              </p>
            </div>
            {isFiltering ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>

          <div className="space-y-3 p-3 sm:p-4" role="group" aria-label="Vocabulary view controls">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {MASTERY_FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                onClick={() => setMasteryFilter(value)}
                variant={masteryFilter === value ? "secondary" : "outline"}
                size="sm"
                aria-pressed={masteryFilter === value}
                className={cn(
                  "shrink-0 rounded-xl px-3 text-xs",
                  masteryFilter === value
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground"
                )}
              >
                {label}
                <span className="font-mono text-[10px] opacity-65">
                  {filterCounts[value]}
                </span>
              </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 sm:max-w-56">
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                <SelectTrigger aria-label="Sort vocabulary words" className="h-10 w-full rounded-xl bg-background shadow-none">
                  <ArrowDownUp className="text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {SORT_ORDERS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
              </div>

            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-background p-1" role="group" aria-label="Deck layout">
              <Button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "rounded-lg",
                  viewMode === "list"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <List size={14} strokeWidth={2.5} />
              </Button>
              <Button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "rounded-lg",
                  viewMode === "grid"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <LayoutGrid size={14} strokeWidth={2.5} />
              </Button>
            </div>
            </div>
          </div>
        </div>
      )}

      {loading && !words.length ? <DeckSkeleton /> : null}

      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3"
            : "space-y-3"
        )}
      >
        {decks.map(([category, items], index) => (
          <motion.div
            key={category}
            variants={itemVariants}
            // An opened deck needs the full row to fit its word list, so it
            // breaks out of the grid via the data-open flag VocabDeck sets.
            className={cn(viewMode === "grid" && "has-[[data-open=true]]:col-span-full")}
          >
            <VocabDeck
              name={category}
              items={items}
              defaultOpen={index === 0}
              forceOpen={isFiltering}
              viewMode={viewMode}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAdd={onAdd}
            />
          </motion.div>
        ))}
      </div>

      {!loading && words.length > 0 && !filtered.length ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-accent/5 p-10 text-center">
          <SearchX size={32} strokeWidth={1.5} className="mb-4 text-muted-foreground/60" />
          <h3 className="text-base font-semibold text-foreground">No matching words</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Try a different spelling, deck, tag, or mastery level.
          </p>
          <Button type="button" variant="outline" onClick={clearFilters} className="mt-4">
            Reset search and filters
          </Button>
        </div>
      ) : null}

      {!loading && !words.length ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-accent/5 p-10 text-center sm:rounded-3xl sm:p-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/10 text-muted-foreground/60 mb-6">
            <Layers3 size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Start Your Collection</h3>
          <p className="mx-auto mt-3 max-w-xs text-[16px] font-medium leading-relaxed text-muted-foreground">
            Save words from chat sessions or use the AI Deck Builder to start mastering Korean vocabulary.
          </p>
          {onStartAdd && (
            <Button
              type="button"
              onClick={onStartAdd}
              size="lg"
              className="mt-6"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add your first words
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
