"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ArrowRight,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Languages,
  Star,
  Trash2,
  Search,
  X,
  Copy,
  Check,
  Flame,
  SortDesc,
  Filter,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SpeakButton } from "@/components/ui/SpeakButton"
import { correctionApi, progressApi } from "@/lib/api"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type CorrectionEntry = {
  id: string
  createdAt: string
  originalText: string
  correctedText: string
  rating?: number | null
  grammarPoints: string[]
  explanation: string
  englishTranslation?: string
}

type SortKey = "newest" | "oldest" | "best" | "worst"
type RatingFilter = "all" | "high" | "low" | "unrated"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating?: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={2.5}
          className={i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/60"}
        />
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function aggregateGrammar(entries: CorrectionEntry[]) {
  const counts: Record<string, number> = {}
  for (const entry of entries) {
    for (const point of entry.grammarPoints ?? []) {
      const key = point.trim()
      if (key) counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
}

function calcStreak(activeDays: Set<number>, today: Date, month: Date): number {
  const isCurrentMonth =
    today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth()
  if (!isCurrentMonth) return 0
  let streak = 0
  let day = today.getDate()
  while (activeDays.has(day) && day > 0) {
    streak++
    day--
  }
  return streak
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy text"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
            <Check size={13} className="text-green-500" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
            <Copy size={13} strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ─── Grammar Tracker ──────────────────────────────────────────────────────────

function GrammarTracker({
  entries,
  activeTag,
  onTagClick,
}: {
  entries: CorrectionEntry[]
  activeTag: string | null
  onTagClick: (tag: string) => void
}) {
  const patterns = aggregateGrammar(entries)
  const max = patterns[0]?.[1] ?? 1

  if (patterns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Brain size={36} className="text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm font-bold text-muted-foreground">No patterns yet — keep correcting!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activeTag && (
        <div className="flex items-center justify-between rounded-xl bg-blue-500/8 px-3 py-2">
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            Filtering by: <span className="italic">{activeTag}</span>
          </p>
          <button
            type="button"
            onClick={() => onTagClick(activeTag)}
            className="rounded-md p-0.5 text-blue-500 hover:bg-blue-500/10"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
      {patterns.map(([point, count], i) => {
        const isActive = activeTag === point
        return (
          <motion.button
            key={point}
            type="button"
            onClick={() => onTagClick(point)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "w-full space-y-1.5 rounded-xl px-2 py-1.5 text-left transition-colors",
              isActive ? "bg-blue-500/8 ring-1 ring-blue-500/20" : "hover:bg-accent/50"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold leading-snug text-foreground/80 line-clamp-2">{point}</span>
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                count >= 4 ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                count >= 2 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                "bg-slate-500/10 text-slate-500"
              )}>
                ×{count}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / max) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 + 0.1 }}
                className={cn(
                  "h-full rounded-full",
                  isActive ? "bg-blue-500" :
                  count >= 4 ? "bg-red-500" :
                  count >= 2 ? "bg-amber-500" :
                  "bg-slate-400"
                )}
              />
            </div>
          </motion.button>
        )
      })}
      <p className="px-2 text-[11px] font-bold text-muted-foreground">
        Tap a pattern to filter corrections
      </p>
    </div>
  )
}

// ─── Practice Calendar ────────────────────────────────────────────────────────

function PracticeCalendar({
  month,
  activeDays,
  streak,
  onPrev,
  onNext,
}: {
  month: Date
  activeDays: Set<number>
  streak: number
  onPrev: () => void
  onNext: () => void
}) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const days = getDaysInMonth(year, m)
  const firstDay = getFirstDayOfMonth(year, m)
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === m

  const monthName = month.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className="space-y-4">
      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-orange-500/8 px-3 py-2.5 ring-1 ring-orange-500/15">
          <Flame size={16} className="text-orange-500" strokeWidth={2.5} />
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
            {streak}-day streak!
          </span>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev} className="h-9 w-9 rounded-xl">
          <ChevronLeft size={18} strokeWidth={2.5} />
        </Button>
        <span className="text-sm font-bold text-foreground">{monthName}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={isCurrentMonth}
          className="h-9 w-9 rounded-xl"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const isActive = activeDays.has(day)
          const isToday = isCurrentMonth && today.getDate() === day

          return (
            <div
              key={day}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-xl text-[13px] font-bold",
                isActive
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : isToday
                    ? "ring-2 ring-blue-500/40 text-blue-600 font-bold"
                    : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs font-bold text-muted-foreground">
        {activeDays.size} {activeDays.size === 1 ? "practice day" : "practice days"} this month
      </p>
    </div>
  )
}

// ─── Filter / Sort Bar ────────────────────────────────────────────────────────

const RATING_FILTERS: { key: RatingFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "★ 4–5" },
  { key: "low", label: "★ 1–3" },
  { key: "unrated", label: "Unrated" },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "best", label: "Best" },
  { key: "worst", label: "Worst" },
]

function FilterBar({
  search,
  onSearch,
  ratingFilter,
  onRatingFilter,
  sortKey,
  onSort,
  totalVisible,
  totalAll,
}: {
  search: string
  onSearch: (v: string) => void
  ratingFilter: RatingFilter
  onRatingFilter: (v: RatingFilter) => void
  sortKey: SortKey
  onSort: (v: SortKey) => void
  totalVisible: number
  totalAll: number
}) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" strokeWidth={2.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search corrections…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground/40 hover:text-foreground"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Chips row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <Filter size={13} className="shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
        {RATING_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onRatingFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
              ratingFilter === f.key
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-accent/50 text-muted-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}

        <div className="mx-1 h-4 w-px shrink-0 bg-border" />

        <SortDesc size={13} className="shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSort(s.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
              sortKey === s.key
                ? "bg-violet-500 text-white shadow-sm"
                : "bg-accent/50 text-muted-foreground hover:bg-accent"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(search || ratingFilter !== "all") && (
        <p className="text-[11px] font-bold text-muted-foreground">
          Showing {totalVisible} of {totalAll} corrections
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LOAD_PAGE = 15

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<CorrectionEntry[]>([])
  const [loadingCorrections, setLoadingCorrections] = useState(true)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set())
  const [streak, setStreak] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter / sort state
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("newest")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(LOAD_PAGE)

  // Fetch corrections (load 100 upfront, paginate client-side)
  useEffect(() => {
    correctionApi
      .history(100)
      .then((data) =>
        setCorrections(
          Array.isArray(data)
            ? data.map((c) => ({ ...c, explanation: c.explanation ?? "" }))
            : []
        )
      )
      .catch(() => setCorrections([]))
      .finally(() => setLoadingCorrections(false))
  }, [])

  // Fetch streak
  useEffect(() => {
    progressApi.getStreak().then((s) => setStreak(s.streakDays)).catch(() => {})
  }, [])

  function prevMonth() {
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }

  function nextMonth() {
    const now = new Date()
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    if (next <= now) setCalendarMonth(next)
  }

  useEffect(() => {
    const month = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`
    let cancelled = false
    progressApi
      .getActivityDays(month)
      .then((days) => {
        if (!cancelled) setActiveDays(new Set(days.map((d) => Number(d.slice(8)))))
      })
      .catch(() => { if (!cancelled) setActiveDays(new Set()) })
    return () => { cancelled = true }
  }, [calendarMonth])

  function handleTagClick(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag))
    setVisibleCount(LOAD_PAGE)
  }

  const handleSearch = useCallback((v: string) => {
    setSearch(v)
    setVisibleCount(LOAD_PAGE)
  }, [])

  const handleRatingFilter = useCallback((v: RatingFilter) => {
    setRatingFilter(v)
    setVisibleCount(LOAD_PAGE)
  }, [])

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this correction? This can't be undone.")) return
    setDeletingId(id)
    try {
      await correctionApi.remove(id)
      setCorrections((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // Leave entry in place on failure
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Derived state ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...corrections]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.originalText.toLowerCase().includes(q) ||
          c.correctedText.toLowerCase().includes(q) ||
          c.explanation.toLowerCase().includes(q)
      )
    }

    if (ratingFilter === "high") list = list.filter((c) => c.rating != null && c.rating >= 4)
    else if (ratingFilter === "low") list = list.filter((c) => c.rating != null && c.rating <= 3)
    else if (ratingFilter === "unrated") list = list.filter((c) => c.rating == null)

    if (activeTag) {
      list = list.filter((c) => c.grammarPoints?.some((p) => p.trim() === activeTag))
    }

    switch (sortKey) {
      case "oldest":
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "best":
        list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
      case "worst":
        list.sort((a, b) => (a.rating ?? 99) - (b.rating ?? 99))
        break
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return list
  }, [corrections, search, ratingFilter, activeTag, sortKey])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const grammarPatterns = aggregateGrammar(corrections)
  const calendarStreak = calcStreak(activeDays, new Date(), calendarMonth)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
      className="space-y-6 pb-12 sm:space-y-8 sm:pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Progress Lab"
          title="Your Study History"
          description="Track past corrections, spot recurring grammar patterns, and keep your streak alive."
          stats={[
            { label: "Corrections", value: String(corrections.length) },
            { label: "Patterns Found", value: String(grammarPatterns.length) },
            { label: "Day Streak", value: streak > 0 ? `${streak} 🔥` : String(activeDays.size) },
          ]}
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        {/* ── Left column ── */}
        <div className="space-y-6 min-w-0">

          {/* Grammar Patterns */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem] lg:rounded-3xl">
              <CardHeader className="border-b border-border/60 bg-accent/5 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 shadow-sm ring-1 ring-red-500/20">
                    <Brain size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Recurring Mistakes</h2>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Grammar patterns · tap to filter
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {loadingCorrections ? (
                  <div className="space-y-3">
                    {[70, 55, 90, 40, 65, 50].map((w, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-4" style={{ width: `${w}%` }} />
                          <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <GrammarTracker
                    entries={corrections}
                    activeTag={activeTag}
                    onTagClick={handleTagClick}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Correction History */}
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              <h3 className="px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Correction History
              </h3>

              {!loadingCorrections && corrections.length > 0 && (
                <FilterBar
                  search={search}
                  onSearch={handleSearch}
                  ratingFilter={ratingFilter}
                  onRatingFilter={handleRatingFilter}
                  sortKey={sortKey}
                  onSort={setSortKey}
                  totalVisible={filtered.length}
                  totalAll={corrections.length}
                />
              )}

              {loadingCorrections ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="overflow-hidden rounded-[1.5rem] border border-border bg-card px-5 py-4 shadow-sm dark:bg-slate-900/40 sm:rounded-3xl sm:px-6 sm:py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-4 w-3/5" />
                        </div>
                        <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : corrections.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-border bg-card px-4 py-10 text-center sm:rounded-3xl sm:py-12">
                  <ScrollText size={36} className="text-muted-foreground/60" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-muted-foreground">No corrections yet</p>
                  <p className="text-xs text-muted-foreground">Go to AI Coach and ask it to correct your Korean — it&apos;ll show up here.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-border bg-card px-4 py-8 text-center sm:rounded-3xl">
                  <Search size={28} className="text-muted-foreground/60" strokeWidth={1.5} />
                  <p className="text-sm font-bold text-muted-foreground">No matches</p>
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setRatingFilter("all"); setActiveTag(null) }}
                    className="text-xs font-bold text-blue-500 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {visible.map((entry) => {
                      const isExpanded = expandedId === entry.id
                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm dark:bg-slate-900/40 sm:rounded-3xl"
                        >
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                            <button
                              type="button"
                              className="min-w-0 flex-1 space-y-1.5 text-left"
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            >
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                  {formatDate(entry.createdAt)}
                                </p>
                                <StarRating rating={entry.rating} />
                              </div>
                              <p className="line-clamp-1 text-sm font-bold text-muted-foreground">
                                {entry.originalText}
                              </p>
                              <p className="line-clamp-1 text-sm font-bold text-foreground">
                                {entry.correctedText}
                              </p>
                            </button>
                            <div className="mt-1 flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => void handleDelete(entry.id)}
                                disabled={deletingId === entry.id}
                                aria-label="Delete correction"
                                className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
                              >
                                <Trash2 size={15} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                className={cn(
                                  "rounded-lg p-1.5 text-muted-foreground/40 transition-transform duration-200",
                                  isExpanded ? "rotate-90" : "rotate-0"
                                )}
                              >
                                <ArrowRight size={16} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-5 border-t border-border/60 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
                                  {/* Rating */}
                                  {entry.rating != null && (
                                    <div className="flex items-center gap-2">
                                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                        Sentence Quality
                                      </p>
                                      <StarRating rating={entry.rating} />
                                    </div>
                                  )}

                                  {/* Original vs Corrected */}
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-red-500/5 p-4">
                                      <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[9px] font-bold uppercase tracking-wide text-red-500/60">Original</p>
                                        <CopyButton text={entry.originalText} />
                                      </div>
                                      <p className="text-sm font-medium leading-relaxed text-foreground/70">{entry.originalText}</p>
                                    </div>
                                    <div className="rounded-2xl bg-blue-500/5 p-4">
                                      <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[9px] font-bold uppercase tracking-wide text-blue-600/60">Corrected</p>
                                        <div className="flex items-center gap-1">
                                          <CopyButton text={entry.correctedText} />
                                          <SpeakButton text={entry.correctedText} className="h-7 w-7 rounded-lg" />
                                        </div>
                                      </div>
                                      <p className="text-sm font-bold leading-relaxed text-foreground">{entry.correctedText}</p>
                                    </div>
                                  </div>

                                  {/* English translation */}
                                  {entry.englishTranslation && (
                                    <div className="flex items-start gap-2 rounded-2xl bg-sky-500/5 px-4 py-3">
                                      <Languages size={13} className="mt-0.5 shrink-0 text-sky-500" strokeWidth={2.5} />
                                      <p className="text-[13px] font-bold text-sky-700 dark:text-sky-300">{entry.englishTranslation}</p>
                                    </div>
                                  )}

                                  {/* Grammar points (clickable) */}
                                  {entry.grammarPoints?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {entry.grammarPoints.map((p, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => handleTagClick(p.trim())}
                                          className={cn(
                                            "rounded-full border px-3 py-1 text-[12px] font-bold transition-colors",
                                            activeTag === p.trim()
                                              ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                              : "border-border bg-accent/30 text-foreground/70 hover:bg-accent"
                                          )}
                                        >
                                          {p}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Explanation */}
                                  <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">{entry.explanation}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {/* Load more */}
                  {hasMore && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center pt-2"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount((c) => c + LOAD_PAGE)}
                        className="rounded-2xl px-6 font-bold"
                      >
                        Load more ({filtered.length - visibleCount} remaining)
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Right column: Practice Calendar ── */}
        <div>
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 lg:sticky lg:top-8 sm:rounded-[2.2rem] lg:rounded-3xl">
              <CardHeader className="border-b border-border/60 bg-accent/5 px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 shadow-sm ring-1 ring-violet-500/20">
                    <CalendarDays size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Practice Calendar</h2>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Days you practiced
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {loadingCorrections ? (
                  <div className="space-y-4">
                    <Skeleton className="mx-auto h-9 w-2/3 rounded-xl" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 35 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-xl" />
                      ))}
                    </div>
                    <Skeleton className="mx-auto h-3 w-32" />
                  </div>
                ) : (
                  <PracticeCalendar
                    month={calendarMonth}
                    activeDays={activeDays}
                    streak={calendarStreak}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
