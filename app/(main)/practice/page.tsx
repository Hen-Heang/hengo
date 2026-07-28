"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Drama,
  Flame,
  MessageCircle,
  MessagesSquare,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react"
import { motion } from "motion/react"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { BestQuizStreakCard } from "@/components/dashboard/BestQuizStreakCard"
import { DailyPhraseCard } from "@/components/practice/DailyPhraseCard"
import { LearningSnapshot } from "@/components/practice/LearningSnapshot"
import { ExamCountdownBanner } from "@/components/interview/ExamCountdownBanner"
import {
  chatApi,
  levelApi,
  missionsApi,
  practiceApi,
  progressApi,
  scenarioSessionsApi,
  getApiErrorMessage,
  type DailyMission,
  type MissionItem,
} from "@/lib/api"
import { containerVariants, itemVariants } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { useSessionTimer } from "@/hooks/useSessionTimer"
import type { LevelSuggestion } from "@/lib/api/user"
import type { PracticeToday } from "@/lib/types"

export default function PracticePage() {
  useSessionTimer("practice")
  const router = useRouter()
  const [data, setData] = useState<PracticeToday | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [mission, setMission] = useState<DailyMission | null>(null)
  const [missionLoading, setMissionLoading] = useState(true)
  const [startingScenario, setStartingScenario] = useState(false)

  const [suggestion, setSuggestion] = useState<LevelSuggestion | null>(null)
  const [applying, setApplying] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [activityToday, setActivityToday] = useState(false)

  useEffect(() => {
    let active = true
    practiceApi
      .getToday()
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, "Could not load today's practice."))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Today's mission is generated once and persists all day — refreshProgress
    // re-checks each item against real evidence (graded cards, learned phrase,
    // evaluated scenarios/listening/interview attempts) rather than trusting
    // that opening this page means anything was actually practiced.
    missionsApi
      .getOrCreateToday()
      .then((created) => missionsApi.refreshProgress().then((refreshed) => refreshed ?? created))
      .then((res) => {
        if (active) setMission(res)
      })
      .catch((err) => {
        if (active) setError((prev) => prev || getApiErrorMessage(err, "Could not load today's mission."))
      })
      .finally(() => {
        if (active) setMissionLoading(false)
      })

    levelApi
      .getSuggestion()
      .then((res) => {
        if (active) setSuggestion(res)
      })
      .catch(() => {
        /* level suggestion is a bonus banner — fail silently */
      })
    progressApi
      .getStreak()
      .then((res) => {
        if (active) {
          setStreakDays(res.streakDays)
          setActivityToday(res.activityToday)
        }
      })
      .catch(() => { /* streak is decorative — fail silently */ })
    return () => {
      active = false
    }
  }, [])

  async function handleApplyLevel() {
    if (!suggestion?.suggestedLevel) return
    setApplying(true)
    try {
      await levelApi.apply(suggestion.suggestedLevel)
      setSuggestion({ ...suggestion, currentLevel: suggestion.suggestedLevel, upgradeAvailable: false, suggestedLevel: null })
      setData((prev) => (prev ? { ...prev, userLevel: suggestion.suggestedLevel! } : prev))
    } catch {
      /* leave the banner up so the user can retry */
    } finally {
      setApplying(false)
    }
  }

  // Creates a real scenario-tagged conversation + session, then hands off to
  // /chat to practice it. The mission item only completes once the learner
  // has exchanged at least 3 turns and the AI judges the goal accomplished
  // (see useChat's evaluateScenario / app/api/ai/scenario/evaluate) — not
  // the moment this button is clicked.
  async function goToScenario(item?: MissionItem) {
    if (!data) return
    const scenario = data.suggestedScenario
    setStartingScenario(true)
    try {
      const conversation = await chatApi.createConversation(`Scenario: ${scenario.title}`, "SCENARIO", scenario.id)
      await scenarioSessionsApi.start(scenario.id, conversation.id, item?.id ?? null)
      router.push(`/chat?conversationId=${conversation.id}`)
    } catch {
      // Fall back to the old prompt-prefill behavior if session setup fails.
      router.push(`/chat?prompt=${encodeURIComponent(scenario.introMessage || scenario.goal)}`)
    } finally {
      setStartingScenario(false)
    }
  }

  function scrollToPhrase() {
    document.getElementById("daily-phrase")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function hrefForItem(item: MissionItem): string | null {
    switch (item.type) {
      case "vocab_review":
        return "/vocab"
      case "correction_review":
        return "/chat?mode=corrections"
      case "listening":
        return `/listening${item.referenceIds[0] ? `?topic=${encodeURIComponent(item.referenceIds[0])}` : ""}`
      case "interview":
        return "/interview"
      case "phrase_review":
        return "/phrasebook/practice?mode=review"
      default:
        return null
    }
  }

  const missionItems = mission?.items ?? []
  const completedCount = missionItems.filter((i) => i.status === "completed").length

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-12">
      <motion.div variants={itemVariants}>
        <PageHero
          eyebrow="Today"
          title="Today's Mission"
          description="One focused, personalized checklist for today — built from what you actually have due and where you're weakest."
          stats={
            data
              ? [
                  { label: "Level", value: data.userLevel, href: "/settings" },
                  {
                    label: "Progress",
                    value: `${completedCount}/${missionItems.length || 0}`,
                    onClick: () =>
                      document.getElementById("todays-mission")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  },
                  { label: "Streak", value: streakDays > 0 ? `${streakDays} days` : "—", href: "/history" },
                ]
              : undefined
          }
        />
      </motion.div>

      {/* Exam countdown reminder — Learning-workspace specific, moved here from
          the old Dashboard (now the Productivity workspace) */}
      <motion.div variants={itemVariants}>
        <ExamCountdownBanner />
      </motion.div>

      {/* Streak banner — shown only when streak is active */}
      {streakDays > 0 && (
        <motion.div variants={itemVariants}>
          {activityToday ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Flame size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {streakDays}-day streak · already practiced today
                </p>
                <p className="text-xs font-medium text-muted-foreground/60">
                  Great work — your streak is safe. Come back tomorrow to keep it going.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Flame size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                  {streakDays}-day streak — don&apos;t break it!
                </p>
                <p className="text-xs font-medium text-muted-foreground/60">
                  Complete at least one mission below to keep your streak alive today.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {suggestion?.upgradeAvailable && suggestion.suggestedLevel && (
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Ready for {suggestion.suggestedLevel}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{suggestion.reason}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleApplyLevel}
            disabled={applying}
            className="h-10 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95"
          >
            {applying ? "Updating..." : `Move up to ${suggestion.suggestedLevel}`}
          </Button>
        </motion.div>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {(loading || missionLoading) && (
        <motion.div variants={itemVariants} className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </motion.div>
      )}

      {data && !loading && !missionLoading && (
        <>
          {/* Today's Mission checklist — driven by kori_daily_missions, built
              once per Korea-calendar day by lib/learning/mission-engine.ts */}
          <motion.div
            id="todays-mission"
            variants={itemVariants}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40 scroll-mt-20"
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Today&apos;s Mission
              </h3>
              <span className="text-xs font-bold text-foreground">
                {completedCount}/{missionItems.length}
              </span>
            </div>
            {mission?.reason && (
              <p className="mb-4 text-xs font-medium leading-relaxed text-muted-foreground">{mission.reason}</p>
            )}
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent/40">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${missionItems.length ? (completedCount / missionItems.length) * 100 : 0}%` }}
              />
            </div>
            <ul className="mt-5 space-y-4">
              {missionItems.map((item) => {
                const done = item.status === "completed"
                const href = !done ? hrefForItem(item) : null
                const isScenario = item.type === "scenario"
                const inner = (
                  <>
                    {done ? (
                      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                    ) : (
                      <Circle size={20} className="mt-0.5 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
                    )}
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "block text-sm font-bold",
                          done ? "text-muted-foreground/60 line-through" : "text-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium leading-snug text-muted-foreground">
                        {item.reason}
                      </span>
                    </div>
                  </>
                )
                return (
                  <li key={item.id}>
                    {href && !done ? (
                      <Link href={href} className="flex items-start gap-3 hover:opacity-80 transition-opacity">
                        {inner}
                      </Link>
                    ) : isScenario && !done ? (
                      <button
                        type="button"
                        disabled={startingScenario}
                        onClick={() => goToScenario(item)}
                        className="flex w-full items-start gap-3 text-left hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {inner}
                      </button>
                    ) : item.type === "daily_phrase" && !done ? (
                      <button
                        type="button"
                        onClick={scrollToPhrase}
                        className="flex w-full items-start gap-3 text-left hover:opacity-80 transition-opacity"
                      >
                        {inner}
                      </button>
                    ) : (
                      <div className="flex items-start gap-3">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </motion.div>

          {/* Learning workspace snapshot — reading/listening/exam-prep progress
              and the latest achievement, so nothing requires a separate visit */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Learning Snapshot
            </h2>
            <LearningSnapshot />
            <BestQuizStreakCard />
          </motion.div>

          {/* Daily phrase — merged in full from the old standalone page */}
          <motion.div id="daily-phrase" variants={itemVariants} className="scroll-mt-20">
            <DailyPhraseCard
              phrase={data.dailyPhrase}
              onChange={(next) => setData((prev) => (prev ? { ...prev, dailyPhrase: next } : prev))}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2">
            {/* Vocab review */}
            <Card
              icon={<BookOpen size={20} strokeWidth={2.5} />}
              iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              eyebrow="Vocabulary"
              title={data.dueVocabCount > 0 ? `${data.dueVocabCount} cards due` : "All caught up"}
            >
              {data.dueVocabSample.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {data.dueVocabSample.map((card) => (
                    <li key={card.id} className="flex items-center justify-between text-foreground">
                      <span className="font-bold">{card.term}</span>
                      <span className="text-muted-foreground">{card.meaning}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews due — nice work.</p>
              )}
              <ActionButton onClick={() => router.push("/vocab")} className="bg-emerald-600 hover:bg-emerald-500">
                {data.dueVocabCount > 0 ? "Review vocab" : "Add more words"}
              </ActionButton>
            </Card>

            {/* Mistake review */}
            <Card
              icon={<RotateCcw size={20} strokeWidth={2.5} />}
              iconClass="bg-red-500/10 text-red-600 dark:text-red-400"
              eyebrow="Mistake Review"
              title={data.dueCorrectionsCount > 0 ? `${data.dueCorrectionsCount} mistakes due` : "All caught up"}
            >
              {data.dueCorrectionsSample.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {data.dueCorrectionsSample.map((c) => (
                    <li key={c.id} className="text-foreground">
                      <span className="text-red-600/70 line-through dark:text-red-400/70">{c.originalText}</span>
                      <span className="ml-2 font-bold">{c.correctedText}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No repeated mistakes due — keep it up.</p>
              )}
              <ActionButton onClick={() => router.push("/chat?mode=corrections")} className="bg-red-600 hover:bg-red-500">
                {data.dueCorrectionsCount > 0 ? "Review mistakes" : "Go to AI Coach"}
              </ActionButton>
            </Card>

            {/* Scenario */}
            <Card
              icon={<Drama size={20} strokeWidth={2.5} />}
              iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              eyebrow={`Scenario · ${data.suggestedScenario.category}`}
              title={data.suggestedScenario.title}
            >
              <p className="text-sm text-muted-foreground">{data.suggestedScenario.summary}</p>
              <ActionButton
                onClick={() => goToScenario()}
                className="bg-blue-600 hover:bg-blue-500"
                icon={<MessageCircle size={14} className="mr-2" />}
              >
                {startingScenario ? "Starting…" : "Practice with AI Coach"}
              </ActionButton>
            </Card>

            {/* Message generator */}
            <Card
              icon={<Wand2 size={20} strokeWidth={2.5} />}
              iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              eyebrow="Message Generator"
              title={data.suggestedMessageCategory}
            >
              <p className="text-sm text-muted-foreground">
                Try phrasing a message for this situation across formality levels.
              </p>
              <ActionButton
                onClick={() => router.push(`/chat?mode=generate&category=${encodeURIComponent(data.suggestedMessageCategory)}`)}
                className="bg-violet-600 hover:bg-violet-500"
                icon={<Sparkles size={14} className="mr-2" />}
              >
                Generate a message
              </ActionButton>
            </Card>

            {/* Phrasebook */}
            <Card
              icon={<MessagesSquare size={20} strokeWidth={2.5} />}
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              eyebrow="Phrasebook"
              title="Workplace & daily-life Q&A"
            >
              <p className="text-sm text-muted-foreground">
                Listen to real questions, answer aloud, get feedback, and review with spaced repetition.
              </p>
              <ActionButton
                onClick={() => router.push("/phrasebook")}
                className="bg-amber-600 hover:bg-amber-500"
                icon={<MessagesSquare size={14} className="mr-2" />}
              >
                Open Phrasebook
              </ActionButton>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

function Card({
  icon,
  iconClass,
  eyebrow,
  title,
  children,
}: {
  icon: React.ReactNode
  iconClass: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">{eyebrow}</p>
          <h3 className="text-base font-extrabold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="mt-4 flex-1 space-y-2">{children}</div>
    </div>
  )
}

function ActionButton({
  onClick,
  className,
  icon,
  children,
}: {
  onClick: () => void
  className?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`mt-4 h-10 w-full rounded-xl px-5 text-xs font-bold text-white active:scale-95 ${className ?? ""}`}
    >
      {icon}
      {children}
    </Button>
  )
}
