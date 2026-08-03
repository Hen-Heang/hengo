"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, TrendingDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { interviewApi, vocabApi } from "@/lib/api"
import { averageScore, mostDifficultQuestions, type QuestionBankItem } from "@/lib/interview-practice"
import { INTERVIEW_VOCAB_SEED } from "@/lib/interview-vocab-seed"

interface Stats {
  questionsPracticed: number
  totalAnswers: number
  avgScore: number | null
  difficult: QuestionBankItem[]
}

// Reuses existing subsystems rather than a new dashboard: question-bank
// progress (lib/interview-practice.ts) for the practice stats, and the
// existing kori_vocab_cards + /vocab page (lib/api/vocab.ts) for vocabulary —
// this card just shows a summary and a one-tap way to seed the starter list.
export function InterviewProgressCard({ topicId }: { topicId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [vocabLoaded, setVocabLoaded] = useState<number | null>(null)
  const [isSeedingVocab, setIsSeedingVocab] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      interviewApi.listQuestions(topicId),
      interviewApi.listQuestionProgress(),
      interviewApi.listAnswers(200),
    ])
      .then(([questions, progress, answers]) => {
        if (!active) return
        const practicedCount = Object.values(progress).filter((p) => p.timesPracticed > 0).length
        const scored = answers.map((a) => averageScore(a.scores)).filter((n) => n > 0)
        setStats({
          questionsPracticed: practicedCount,
          totalAnswers: answers.length,
          avgScore: scored.length > 0 ? scored.reduce((sum, n) => sum + n, 0) / scored.length : null,
          difficult: mostDifficultQuestions(questions, progress, 3),
        })
      })
      .catch(() => {})

    vocabApi
      .getSavedWords()
      .then((words) => {
        if (!active) return
        const loadedTerms = new Set(words.map((w) => w.term))
        setVocabLoaded(INTERVIEW_VOCAB_SEED.filter((v) => loadedTerms.has(v.term)).length)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [topicId])

  async function loadStarterVocab() {
    setIsSeedingVocab(true)
    try {
      const existing = await vocabApi.getSavedWords()
      const existingTerms = new Set(existing.map((w) => w.term))
      const missing = INTERVIEW_VOCAB_SEED.filter((v) => !existingTerms.has(v.term))
      for (const item of missing) {
        await vocabApi.save({
          category: item.category,
          term: item.term,
          meaning: item.meaning,
          example: item.example,
        })
      }
      setVocabLoaded(INTERVIEW_VOCAB_SEED.length)
    } catch {
      // Best-effort — the button stays visible so the candidate can retry.
    } finally {
      setIsSeedingVocab(false)
    }
  }

  return (
    <Card className="rounded-[1.8rem] border-border bg-card shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
      <CardHeader className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
        <CardTitle className="text-base font-bold">Practice Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5 sm:pt-6">
        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-accent/5 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Questions practiced
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                  {stats.questionsPracticed}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-accent/5 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Answers saved
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{stats.totalAnswers}</p>
              </div>
              <div className="rounded-2xl border border-border bg-accent/5 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Avg. score
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                  {stats.avgScore !== null ? `${stats.avgScore.toFixed(1)} / 5` : "—"}
                </p>
              </div>
            </div>

            {stats.difficult.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <TrendingDown size={13} strokeWidth={2.5} /> Most difficult questions
                </p>
                <div className="space-y-1.5">
                  {stats.difficult.map((q) => (
                    <p
                      key={q.id}
                      className="rounded-xl border border-border bg-accent/5 px-3 py-2 text-sm font-medium text-foreground"
                    >
                      {q.questionKo}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {stats.totalAnswers === 0 && (
              <p className="text-sm font-medium italic text-muted-foreground">
                No practice history yet — start a Speaking Drill or Mock Interview to see your progress
                here.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-medium italic text-muted-foreground">Loading your progress…</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-accent/5 p-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <BookOpen size={15} strokeWidth={2.5} /> Topic vocabulary
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {vocabLoaded ?? 0}/{INTERVIEW_VOCAB_SEED.length} starter words loaded into your vocab deck
            </p>
          </div>
          <div className="flex items-center gap-2">
            {vocabLoaded !== null && vocabLoaded < INTERVIEW_VOCAB_SEED.length && (
              <Button
                size="sm"
                onClick={loadStarterVocab}
                disabled={isSeedingVocab}
                className="h-8 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
              >
                {isSeedingVocab ? "Loading…" : "Load starter vocabulary"}
              </Button>
            )}
            <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold">
              <Link href="/vocab">Open Vocabulary</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
