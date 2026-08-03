"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Languages,
  LifeBuoy,
  SpellCheck2,
  Type,
} from "lucide-react"

import { PageHero } from "@/components/app/page-hero"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { useFoundationsLessons } from "@/hooks/useFoundations"
import { seedLessonsByTrack } from "@/lib/foundations-data"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import { containerVariants, itemVariants } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { LearnTrack } from "@/lib/types"

const TRACKS: Array<{ key: LearnTrack; label: string; icon: typeof Type; blurb: string; count: number }> = [
  { key: "survival", label: "Survival", icon: LifeBuoy, blurb: "Phrases for your first day", count: seedLessonsByTrack("survival").length },
  { key: "alphabet", label: "Alphabet", icon: Type, blurb: "Read & write Hangul from zero", count: seedLessonsByTrack("alphabet").length },
  { key: "grammar", label: "Grammar", icon: SpellCheck2, blurb: "Build basic sentences", count: seedLessonsByTrack("grammar").length },
]

export default function LearnPage() {
  useSessionTimer("foundations")
  const [track, setTrack] = useState<LearnTrack>("survival")
  const { lessons, loading, error } = useFoundationsLessons(track)

  const completedCount = lessons.filter((l) => l.completed).length

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-16"
    >
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Foundations"
          title="Korean Foundations"
          description="Start from the very beginning — learn to read Hangul and build your first Korean sentences, one short lesson at a time."
          stats={[
            { label: "Tracks", value: "Survival · Alphabet · Grammar" },
            { label: "Lessons", value: loading ? "..." : `${lessons.length}` },
            { label: "Completed", value: loading ? "..." : `${completedCount}` },
          ]}
        />
      </motion.div>

      {/* Track toggle */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-3">
        {TRACKS.map(({ key, label, icon: Icon, blurb, count }) => {
          const active = track === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTrack(key)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-4 rounded-3xl border p-5 text-left transition-all active:scale-[0.99]",
                active
                  ? "border-blue-500/40 bg-blue-500/10 shadow-sm"
                  : "border-border bg-card hover:bg-accent/40 dark:bg-slate-900/40"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  active ? "bg-blue-600 text-white" : "bg-accent text-muted-foreground"
                )}
              >
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-base font-extrabold", active ? "text-blue-700 dark:text-blue-300" : "text-foreground")}>
                    {label}
                  </p>
                  <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {count} lessons
                  </span>
                </div>
                <p title={blurb} className="truncate text-sm text-muted-foreground">{blurb}</p>
              </div>
            </button>
          )
        })}
      </motion.div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div variants={containerVariants} className="grid gap-4 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <motion.div key={lesson.id} variants={itemVariants}>
              <Link
                href={`/learn/${lesson.id}`}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-blue-500/30 hover:shadow-md active:scale-[0.99] dark:bg-slate-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold",
                        lesson.completed
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {lesson.completed ? <CheckCircle2 size={20} strokeWidth={2.5} /> : lesson.order}
                    </div>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {lesson.level}
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    className="mt-1 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-foreground">{lesson.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{lesson.subtitle}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Clock size={13} strokeWidth={2.5} /> {lesson.estimatedMinutes} min
                  </span>
                  {lesson.progress > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-bold",
                        lesson.completed ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                      )}
                    >
                      <Languages size={13} strokeWidth={2.5} /> {lesson.progress}%
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}

          {lessons.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center sm:col-span-2"
            >
              <p className="text-sm font-bold text-foreground">No lessons in this track yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back soon — more lessons are on the way.</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
