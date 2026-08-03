"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { useFoundationsLesson } from "@/hooks/useFoundations"
import { containerVariants, itemVariants } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { LessonAttemptResult, LessonExercise } from "@/lib/types"

type Phase = "teach" | "practice" | "result"

// Local correctness check for immediate per-question feedback. The authoritative
// score still comes from `complete()` (server-side when wired) at the end.
function isCorrect(exercise: LessonExercise, answer: number | string | undefined): boolean {
  if (exercise.type === "multiple-choice") return answer === exercise.answerIndex
  return String(answer ?? "").trim().toLowerCase() === (exercise.answer ?? "").trim().toLowerCase()
}

export function LessonRunner({ lessonId }: { lessonId: string }) {
  const { lesson, loading, error, complete } = useFoundationsLesson(lessonId)

  const [phase, setPhase] = useState<Phase>("teach")
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Array<number | string>>([])
  const [revealed, setRevealed] = useState(false)
  const [typed, setTyped] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<LessonAttemptResult | null>(null)
  const [submitError, setSubmitError] = useState("")

  const exercises = lesson?.exercises ?? []
  const current = exercises[step]
  const progressPct = useMemo(
    () => (exercises.length === 0 ? 0 : Math.round((step / exercises.length) * 100)),
    [step, exercises.length]
  )

  function resetRun() {
    setPhase("teach")
    setStep(0)
    setAnswers([])
    setRevealed(false)
    setTyped("")
    setResult(null)
    setSubmitError("")
  }

  function chooseOption(optionIndex: number) {
    if (revealed) return
    setAnswers((prev) => {
      const next = [...prev]
      next[step] = optionIndex
      return next
    })
    setRevealed(true)
  }

  function checkTyped() {
    if (revealed || !typed.trim()) return
    setAnswers((prev) => {
      const next = [...prev]
      next[step] = typed.trim()
      return next
    })
    setRevealed(true)
  }

  async function goNext() {
    if (step < exercises.length - 1) {
      setStep((s) => s + 1)
      setRevealed(false)
      setTyped("")
      return
    }
    // Last question answered — submit the full attempt.
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await complete(answers)
      setResult(res)
      setPhase("result")
    } catch {
      setSubmitError("Could not save your result. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6">
        <ErrorBanner>{error || "Lesson not found."}</ErrorBanner>
        <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft size={16} /> Back to Foundations
        </Link>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-16">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
        <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Foundations
        </Link>
        <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {lesson.track} · {lesson.level}
        </span>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{lesson.title}</h1>
        <p className="mt-1 text-base text-muted-foreground">{lesson.subtitle}</p>
      </motion.div>

      {/* ── Teach phase ── */}
      {phase === "teach" && (
        <>
          <motion.div
            variants={itemVariants}
            className="rounded-3xl border border-blue-500/15 bg-blue-500/5 p-5 text-sm leading-relaxed text-foreground"
          >
            {lesson.intro}
          </motion.div>

          <motion.div variants={containerVariants} className="grid gap-4">
            {lesson.cards.map((card, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-slate-900/40 sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="flex min-w-[96px] flex-col items-center justify-center rounded-2xl bg-accent/60 px-4 py-3 text-center">
                  <span className="text-3xl font-extrabold text-foreground">{card.hangul}</span>
                  {card.romanization && (
                    <span className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{card.romanization}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">{card.meaning}</p>
                  {card.example && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">{card.example}</span>
                      {card.exampleTranslation && <span> — {card.exampleTranslation}</span>}
                    </p>
                  )}
                  {card.note && (
                    <p className="rounded-xl bg-amber-50/70 px-3 py-2 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                      {card.note}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end">
            <Button
              type="button"
              onClick={() => setPhase("practice")}
              disabled={exercises.length === 0}
              className="h-12 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white hover:bg-blue-500 active:scale-95"
            >
              <Sparkles size={16} className="mr-2" strokeWidth={2.5} />
              Start practice
            </Button>
          </motion.div>
        </>
      )}

      {/* ── Practice phase ── */}
      {phase === "practice" && current && (
        <>
          {/* Progress bar */}
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>
                Question {step + 1} of {exercises.length}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </motion.div>

          <motion.div
            key={current.id}
            variants={itemVariants}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:bg-slate-900/40"
          >
            <p className="text-base font-bold text-foreground">{current.prompt}</p>

            {/* Multiple choice */}
            {current.type === "multiple-choice" && (
              <div className="mt-4 space-y-2">
                {current.options?.map((opt, oi) => {
                  const chosen = answers[step] === oi
                  const correctOpt = revealed && oi === current.answerIndex
                  const wrongChoice = revealed && chosen && oi !== current.answerIndex
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={revealed}
                      onClick={() => chooseOption(oi)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
                        correctOpt && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        wrongChoice && "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
                        !revealed && "border-border bg-background text-foreground hover:bg-accent",
                        revealed && !correctOpt && !wrongChoice && "border-border bg-background text-muted-foreground"
                      )}
                    >
                      <span className="text-lg">{opt}</span>
                      {correctOpt && <CheckCircle2 size={18} className="shrink-0" />}
                      {wrongChoice && <XCircle size={18} className="shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Type answer */}
            {current.type === "type-answer" && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={typed}
                  disabled={revealed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") checkTyped()
                  }}
                  placeholder="Type your answer…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-medium text-foreground outline-none focus:border-blue-500 disabled:opacity-70"
                />
                {revealed && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold",
                      isCorrect(current, answers[step])
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-500/10 text-red-700 dark:text-red-300"
                    )}
                  >
                    {isCorrect(current, answers[step]) ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {isCorrect(current, answers[step]) ? "Correct!" : `Answer: ${current.answer}`}
                  </div>
                )}
                {!revealed && (
                  <Button
                    type="button"
                    onClick={checkTyped}
                    disabled={!typed.trim()}
                    className="h-11 rounded-xl bg-foreground px-6 text-sm font-bold text-background hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    Check
                  </Button>
                )}
              </div>
            )}

            {/* Explanation + next */}
            {revealed && (
              <div className="mt-5 space-y-4">
                {current.explanation && (
                  <p className="rounded-xl bg-sky-50/60 px-4 py-3 text-sm leading-6 text-sky-800 dark:bg-sky-400/6 dark:text-sky-200">
                    {current.explanation}
                  </p>
                )}
                {submitError && <ErrorBanner>{submitError}</ErrorBanner>}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 active:scale-95"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : null}
                    {step < exercises.length - 1 ? "Next" : "Finish"}
                    {!submitting && <ArrowRight size={16} className="ml-2" />}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ── Result phase ── */}
      {phase === "result" && result && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div
            className={cn(
              "rounded-3xl border p-8 text-center",
              result.completed
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-amber-500/20 bg-amber-500/5"
            )}
          >
            <div
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
                result.completed ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
              )}
            >
              {result.completed ? <CheckCircle2 size={32} strokeWidth={2.5} /> : <RotateCcw size={30} strokeWidth={2.5} />}
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-foreground">
              {result.score} / {result.total} correct
            </h2>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              {result.accuracy}% · {result.completed ? "Lesson complete!" : "Almost — try once more to pass (60%)."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={resetRun}
              className="h-12 rounded-xl border border-border bg-background px-6 text-sm font-bold text-foreground hover:bg-accent active:scale-95"
            >
              <RotateCcw size={16} className="mr-2" /> Practice again
            </Button>
            <Link href="/learn">
              <Button
                type="button"
                className="h-12 w-full rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 active:scale-95"
              >
                <BookOpen size={16} className="mr-2" /> Back to lessons
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
