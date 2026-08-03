"use client"

import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Loader2,
  Pin,
  Plus,
} from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"

import { PageHero } from "@/components/app/page-hero"
import { CardGrid } from "@/components/ui/card-grid"
import { getApiErrorMessage } from "@/lib/api"
import {
  READING_CATEGORIES,
  type ReadingCategory,
  type ReadingProgressEntry,
} from "@/lib/reading"
import {
  getReadingProgress,
  getReadingProgressServerSnapshot,
  subscribeReadingProgress,
  toggleUnitPinned,
} from "@/lib/reading-progress-store"
import {
  getAllReadingUnits,
  getReadingUnitsServerSnapshot,
  isReadingUnitsLoaded,
  loadReadingUnits,
  subscribeReadingUnits,
} from "@/lib/reading-store"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
} as const

const CATEGORY_ORDER: ReadingCategory[] = ["DAILY_LIFE", "CULTURE", "BEGINNER_STORY"]

function StatusBadge({ entry }: { entry: ReadingProgressEntry }) {
  if (entry.status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        <CheckCircle2 size={11} strokeWidth={3} /> Completed
      </span>
    )
  }
  if (entry.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
        <Clock3 size={11} strokeWidth={3} /> In progress
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
      <CircleDashed size={11} strokeWidth={3} /> Not started
    </span>
  )
}

export default function ReadingPage() {
  const progress = useSyncExternalStore(
    subscribeReadingProgress,
    getReadingProgress,
    getReadingProgressServerSnapshot
  )
  const units = useSyncExternalStore(
    subscribeReadingUnits,
    getAllReadingUnits,
    getReadingUnitsServerSnapshot
  )

  const [loaded, setLoaded] = useState(isReadingUnitsLoaded())
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let active = true
    loadReadingUnits()
      .then(() => active && setLoadError(""))
      .catch((err) => active && setLoadError(getApiErrorMessage(err, "Could not load reading units.")))
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [])

  const completedCount = units.filter((u) => progress[u.id]?.status === "completed").length
  const [pinningId, setPinningId] = useState<string | null>(null)

  async function handleTogglePin(unitId: string) {
    if (pinningId) return
    setPinningId(unitId)
    try {
      const pinned = await toggleUnitPinned(unitId)
      toast.success(pinned ? "Pinned to the top." : "Unpinned.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update the pin."))
    } finally {
      setPinningId(null)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Reading"
          title="Reading Units"
          description="Real Korean articles, podcast transcripts, and stories — organized into units. Read with tap-to-translate and audio, save the vocabulary, then pass the quiz to complete each unit. Add your own texts too."
          actions={
            <Link
              href="/reading/new"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> New unit
            </Link>
          }
          stats={[
            { label: "Units", value: String(units.length) },
            { label: "Completed", value: `${completedCount}/${units.length}` },
            { label: "Flow", value: "Read · Vocab · Quiz" },
          ]}
        />
      </motion.div>

      {loadError && (
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm font-bold text-destructive"
        >
          {loadError}
        </motion.div>
      )}

      {!loadError && !loaded && units.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-2 py-20 text-muted-foreground"
        >
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-bold">Loading reading units…</span>
        </motion.div>
      )}

      {!loadError && loaded && units.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center"
        >
          <BookOpenText size={28} className="text-muted-foreground/50" strokeWidth={2} />
          <p className="text-sm font-bold text-foreground">No reading units yet.</p>
          <p className="max-w-xs text-xs font-medium text-muted-foreground">
            Add your first text — paste an article, podcast transcript, or message to study.
          </p>
          <Link
            href="/reading/new"
            className="mt-1 inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> New unit
          </Link>
        </motion.div>
      )}

      {CATEGORY_ORDER.map((category) => {
        // Pinned units float to the top of their category; ties keep the
        // original (created_at) order thanks to the stable sort.
        const categoryUnits = units
          .filter((u) => u.category === category)
          .sort(
            (a, b) =>
              Number(Boolean(progress[b.id]?.pinned)) - Number(Boolean(progress[a.id]?.pinned))
          )
        if (categoryUnits.length === 0) return null
        const done = categoryUnits.filter((u) => progress[u.id]?.status === "completed").length

        return (
          <motion.section key={category} variants={itemVariants} className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {READING_CATEGORIES[category].label}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {READING_CATEGORIES[category].description}
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground/70">
                {done}/{categoryUnits.length} done
              </span>
            </div>

            <CardGrid minCardWidth={260} className="gap-3">
              {categoryUnits.map((unit) => {
                const entry = progress[unit.id] ?? { status: "not_started" as const }
                const pinned = Boolean(entry.pinned)
                return (
                  <Link
                    key={unit.id}
                    href={`/reading/${unit.id}`}
                    className={cn(
                      "group relative flex flex-col rounded-3xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg active:scale-[0.99] dark:bg-slate-900/40",
                      entry.status === "completed"
                        ? "border-blue-500/30"
                        : "border-border hover:border-blue-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <BookOpenText size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge entry={entry} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void handleTogglePin(unit.id)
                          }}
                          disabled={pinningId === unit.id}
                          title={pinned ? "Unpin this unit" : "Pin this unit to the top"}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg border transition-all active:scale-90",
                            pinned
                              ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "border-border text-muted-foreground/50 hover:text-foreground"
                          )}
                        >
                          {pinningId === unit.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Pin
                              size={12}
                              strokeWidth={2.5}
                              className={cn(pinned && "fill-current")}
                            />
                          )}
                        </button>
                      </div>
                    </div>

                    <h4 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">
                      {unit.episode ? `${unit.episode} · ` : ""}
                      {unit.title}
                    </h4>
                    <p className="text-sm font-bold text-muted-foreground">{unit.titleEnglish}</p>
                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-muted-foreground/80">
                      {unit.summary}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        <span>{unit.level}</span>
                        <span>·</span>
                        <span>{unit.vocab.length} words</span>
                        <span>·</span>
                        <span>{unit.quiz.length} questions</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {typeof entry.quizScore === "number" && (
                          <span className="text-[11px] font-bold text-muted-foreground/50">
                            Quiz {entry.quizScore}/{entry.quizTotal}
                          </span>
                        )}
                        <ChevronRight
                          size={16}
                          strokeWidth={3}
                          className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500"
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </CardGrid>
          </motion.section>
        )
      })}
    </motion.div>
  )
}
