"use client"

import Link from "next/link"
import { motion, type Variants } from "motion/react"
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Flame,
  GraduationCap,
  Mic,
  MessagesSquare,
  PartyPopper,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { WorkspacePosterCard } from "@/components/home/WorkspacePosterCard"
import { useVocab } from "@/hooks/useVocab"
import { useDailyPhrase } from "@/hooks/useDailyPhrase"
import { useStreak } from "@/hooks/useStreak"
import { computeVocabStats } from "@/lib/vocab-review"
import { getLastVisited } from "@/lib/last-visited"
import { cn } from "@/lib/utils"

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getTodayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

// ─── Secondary shortcut tiles (Practice / Daily Phrase / Coach / Study) ───────

type ShortcutTone = "practice" | "phrase" | "coach" | "study"

type Shortcut = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  tone: ShortcutTone
  badge?: string
}

const shortcutStyles: Record<
  ShortcutTone,
  { icon: string; border: string; glow: string; arrow: string; badge: string }
> = {
  practice: {
    icon: "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/15 dark:text-violet-400",
    border: "hover:border-violet-500/35 focus-visible:border-violet-500/40",
    glow: "bg-gradient-to-br from-violet-500/[0.12] via-fuchsia-500/[0.04] to-transparent",
    arrow: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  phrase: {
    icon: "bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/15 dark:text-sky-400",
    border: "hover:border-sky-500/35 focus-visible:border-sky-500/40",
    glow: "bg-gradient-to-br from-sky-500/[0.12] via-cyan-500/[0.04] to-transparent",
    arrow: "text-sky-500 dark:text-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  coach: {
    icon: "bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/15 dark:text-rose-400",
    border: "hover:border-rose-500/35 focus-visible:border-rose-500/40",
    glow: "bg-gradient-to-br from-rose-500/[0.12] via-pink-500/[0.04] to-transparent",
    arrow: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  study: {
    icon: "bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/15 dark:text-amber-400",
    border: "hover:border-amber-500/35 focus-visible:border-amber-500/40",
    glow: "bg-gradient-to-br from-amber-500/[0.12] via-orange-500/[0.04] to-transparent",
    arrow: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
}

// Secondary daily shortcuts, ordered by priority (Practice first). Same tile
// pattern the old Today page used for its workspace shortcuts — kept as-is,
// just repointed at the four V2 Today destinations.
function TodayShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {shortcuts.map((s) => {
        const style = shortcutStyles[s.tone]

        return (
          <motion.div
            key={s.href}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.018 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.7 }}
            className="h-full"
          >
            <Link
              href={s.href}
              className={cn(
                "group relative flex h-full min-h-[132px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm outline-none backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-200 hover:bg-card hover:shadow-lg hover:shadow-black/[0.06] focus-visible:ring-2 focus-visible:ring-ring/70 dark:bg-slate-900/45 dark:hover:bg-slate-900/70 dark:hover:shadow-black/25 sm:min-h-[144px] sm:p-5",
                style.border
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100",
                  style.glow
                )}
              />

              <div className="relative flex items-start justify-between gap-3">
                <span className={cn("flex size-10 items-center justify-center rounded-xl", style.icon)}>
                  <s.icon size={19} strokeWidth={2.1} />
                </span>
                <span
                  className={cn(
                    "flex size-8 translate-x-1 -translate-y-1 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                    style.arrow
                  )}
                >
                  <ArrowUpRight size={17} strokeWidth={2.2} />
                </span>
              </div>

              <div className="relative mt-4 min-w-0">
                <span className="block text-[15px] font-semibold tracking-[-0.015em] text-foreground sm:text-base">
                  {s.label}
                </span>
                <span className="mt-1 block truncate text-xs leading-5 text-muted-foreground sm:text-[13px]">
                  {s.description}
                </span>
              </div>

              {s.badge && (
                <span
                  className={cn(
                    "relative mt-auto w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    style.badge
                  )}
                >
                  {s.badge}
                </span>
              )}
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Primary vocabulary review card ───────────────────────────────────────────

function VocabReviewCard() {
  const { dueCount, words, loading, error } = useVocab()

  if (loading) return <Skeleton className="h-56 w-full rounded-lg sm:h-52" />

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
        <AlertTriangle size={16} className="shrink-0" />
        Couldn&apos;t load your vocabulary review.
      </div>
    )
  }

  const stats = computeVocabStats(words)
  const hasDue = dueCount > 0

  return (
    <WorkspacePosterCard
      href="/vocab"
      eyebrow="Vocabulary review"
      icon={BookOpen}
      accentColor="emerald"
      title={hasDue ? `${dueCount} word${dueCount === 1 ? "" : "s"} ready to review` : "All caught up!"}
      description={
        hasDue
          ? "Quick spaced-repetition review — a few minutes keeps everything fresh."
          : "No reviews due right now. Add a new word to keep building your deck."
      }
      stats={
        stats.total > 0
          ? [
              { label: "words saved", value: String(stats.total) },
              { label: "mastered", value: String(stats.mastered) },
            ]
          : []
      }
      cta={hasDue ? `Review ${dueCount} word${dueCount === 1 ? "" : "s"}` : "Add a word"}
    />
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { phrase } = useDailyPhrase()
  const { streakDays } = useStreak()

  // "Continue Study" is meant to deep-link into whatever the learner was
  // doing under /learn — but Practice and Coach already have their own
  // dedicated tiles above, so if the last "learn" visit was one of those
  // routes, fall back to the hub instead of duplicating a tile's href.
  const lastLearnHref = getLastVisited("learn", "/learn")
  const continueStudyHref =
    lastLearnHref === "/practice" || lastLearnHref.startsWith("/korean-coach")
      ? "/learn"
      : lastLearnHref

  const shortcuts: Shortcut[] = [
    {
      href: "/practice",
      label: "Today's Practice",
      description: "5–10 min focused Korean practice",
      icon: Sparkles,
      tone: "practice",
    },
    {
      href: "/practice#daily-phrase",
      label: "Daily Phrase",
      description: phrase ? phrase.phrase : "Today's Korean phrase",
      icon: MessagesSquare,
      tone: "phrase",
      badge: phrase?.learned ? "Learned" : undefined,
    },
    {
      href: "/korean-coach",
      label: "Speak & Coach",
      description: "Listening and speaking with AI feedback",
      icon: Mic,
      tone: "coach",
    },
    {
      href: continueStudyHref,
      label: "Continue Study",
      description: "Pick up where you left off",
      icon: GraduationCap,
      tone: "study",
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:space-y-6 sm:px-6 sm:pt-6 lg:px-8"
    >
      {/* ── Greeting ── */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">
          {getGreeting()}{" "}
          <motion.span
            className="inline-block origin-[70%_70%]"
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
          >
            👋
          </motion.span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {getTodayLabel()} · <span className="italic">오늘도 화이팅!</span> Keep it small and steady.
        </p>
      </motion.div>

      {/* ── Primary: vocabulary review ── */}
      <motion.div variants={fadeUp}>
        <VocabReviewCard />
      </motion.div>

      {/* ── Secondary destinations ── */}
      <motion.div variants={fadeUp}>
        <TodayShortcuts shortcuts={shortcuts} />
      </motion.div>

      {/* ── Compact stats row ── */}
      <motion.div variants={fadeUp}>
        <VocabAndStreakStats streakDays={streakDays} />
      </motion.div>
    </motion.div>
  )
}

// Cheap, non-blocking summary line — reuses the same vocab query the primary
// card already fetched (no extra request) plus the app-wide streak cache
// (hooks/useStreak.ts). Deliberately text-only, not a dashboard/chart.
function VocabAndStreakStats({ streakDays }: { streakDays: number | null }) {
  const { dueCount, words, loading } = useVocab()

  if (loading) return null

  const stats = computeVocabStats(words)
  const parts = [
    `${dueCount} due`,
    `${stats.mastered} mastered`,
    streakDays != null ? `${streakDays} day streak` : null,
  ].filter(Boolean)

  if (parts.length === 0) return null

  return (
    <p className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
      {streakDays != null && streakDays > 0 && <Flame size={13} className="shrink-0 text-orange-500" />}
      {parts.join(" · ")}
      {dueCount === 0 && <PartyPopper size={13} className="shrink-0 text-emerald-500" />}
    </p>
  )
}
