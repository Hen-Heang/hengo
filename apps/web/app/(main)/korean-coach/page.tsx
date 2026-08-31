"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Flame,
  Headphones,
  Mic,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react"

import { PageHero } from "@/components/app/page-hero"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage, koreanCoachApi, type KoreanCoachDashboard } from "@/lib/api"
import { getKoreanCoachScenario } from "@/lib/korean-coach/scenarios"
import { useSessionTimer } from "@/hooks/useSessionTimer"

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading Korean Coach">
      <Skeleton className="h-56 rounded-[1.75rem]" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}

export default function KoreanCoachDashboardPage() {
  useSessionTimer("korean_coach")
  const [dashboard, setDashboard] = useState<KoreanCoachDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    koreanCoachApi
      .getDashboard()
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((cause) => {
        if (active) {
          setError(
            getApiErrorMessage(
              cause,
              "Korean Coach could not load. Apply the latest Supabase migration, then try again.",
            ),
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function deleteHistory() {
    setDeleting(true)
    setError("")
    try {
      await koreanCoachApi.deleteAllPracticeHistory()
      setDashboard((current) =>
        current
          ? {
              ...current,
              streak: 0,
              minutesToday: 0,
              completedSessions: 0,
              recentSessions: [],
              frequentMistakes: [],
            }
          : current,
      )
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Practice history could not be deleted."))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  if (!dashboard) {
    return (
      <div className="space-y-4">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-14">
      <PageHero
        eyebrow="AI Korean Voice Coach"
        title="What do you want to practice saying?"
        description="Pick a scenario, answer out loud in Korean, get a short correction, and try the natural sentence again."
        actions={
          <Button asChild size="lg" className="min-h-11 flex-1 sm:flex-none">
            <Link href="/korean-coach/scenarios">
              <Mic aria-hidden="true" />
              Start speaking
            </Link>
          </Button>
        }
        stats={[
          {
            label: "Today’s goal",
            value: `${dashboard.preferences.dailyPracticeGoalMinutes} min`,
            href: "/korean-coach/preferences",
          },
          {
            label: "Practised today",
            value: `${dashboard.minutesToday} min`,
          },
          {
            label: "Current streak",
            value: dashboard.streak > 0 ? `${dashboard.streak} days` : "Not started",
          },
          {
            label: "Sessions",
            value: String(dashboard.completedSessions),
          },
        ]}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <section aria-labelledby="practice-modes">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="practice-modes" className="text-lg font-semibold">
              More ways to practise
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a scenario to speak, sharpen your listening, or review a correction you have seen
              before.
            </p>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label="Korean Coach preferences">
            <Link href="/korean-coach/preferences">
              <Settings2 />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mic aria-hidden="true" />
              </div>
              <CardTitle>Speaking</CardTitle>
              <CardDescription>
                Answer one workplace or daily-life question at a time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/korean-coach/scenarios">
                  Choose scenario <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Headphones aria-hidden="true" />
              </div>
              <CardTitle>Listening</CardTitle>
              <CardDescription>
                Listen to a generated Korean conversation, then check your comprehension with a
                quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/listening">
                  Open listening practice <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpenCheck aria-hidden="true" />
              </div>
              <CardTitle>Review mistakes</CardTitle>
              <CardDescription>
                {dashboard.frequentMistakes.length > 0
                  ? `${dashboard.frequentMistakes.length} repeated pattern${dashboard.frequentMistakes.length === 1 ? "" : "s"} need attention.`
                  : "Saved corrections will appear here for focused review."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/korean-coach/mistakes">
                  Open notebook <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <CardTitle>Recommended next</CardTitle>
            </div>
            <CardDescription>
              Based on your recent correction patterns and learning goal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {dashboard.recommendedScenario.category === "workplace"
                    ? "Workplace Korean"
                    : "Daily Korean"}
                </Badge>
                <Badge variant="secondary">{dashboard.recommendedScenario.difficulty}</Badge>
                <Badge variant="secondary">
                  {dashboard.recommendedScenario.estimatedMinutes} min
                </Badge>
              </div>
              <p className="mt-4 text-xl font-semibold" lang="ko">
                {dashboard.recommendedScenario.koreanTitle}
              </p>
              <p className="mt-1 font-medium">{dashboard.recommendedScenario.englishTitle}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {dashboard.recommendedScenario.description}
              </p>
              <Button asChild className="mt-4 w-full sm:w-auto">
                <Link href={`/korean-coach/practice/${dashboard.recommendedScenario.id}`}>
                  Practise this scenario <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-primary" aria-hidden="true" />
              <CardTitle>Repeated mistakes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {dashboard.frequentMistakes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <BookOpenCheck
                  className="mx-auto size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-medium">No repeated mistakes yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is an honest empty state. Patterns appear only after real practice.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {dashboard.frequentMistakes.map((mistake) => (
                  <li key={mistake.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm text-muted-foreground line-through"
                          lang="ko"
                        >
                          {mistake.original}
                        </p>
                        <p className="mt-1 font-semibold" lang="ko">
                          {mistake.correction}
                        </p>
                      </div>
                      <Badge variant="outline">×{mistake.occurrenceCount}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-primary" aria-hidden="true" />
            <CardTitle>Recent sessions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {dashboard.recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="font-medium">No completed sessions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish your first practice session to see a useful summary here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {dashboard.recentSessions.map((session) => {
                const scenario = session.scenarioId
                  ? getKoreanCoachScenario(session.scenarioId)
                  : undefined
                return (
                  <li key={session.id}>
                    <Link
                      href={`/korean-coach/session/${session.id}`}
                      className="flex min-h-14 items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div>
                        <p className="font-medium">
                          {scenario?.englishTitle ??
                            (session.mode === "listening"
                              ? "Listening challenge"
                              : "Speaking practice")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(session.endedAt ?? session.startedAt).toLocaleDateString()} ·{" "}
                          {Math.max(1, Math.round(session.durationSeconds / 60))} min ·{" "}
                          {session.completedTurns} turns
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <aside className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold">Voice privacy</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Your recording is sent to an AI service for transcription and feedback. Do not record
              sensitive workplace or personal information. Hengo saves the transcript and learning
              feedback, not the raw recording.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive">
              <Trash2 aria-hidden="true" />
              Delete Korean Coach history
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete complete practice history?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes Korean Coach sessions, attempts, and saved coach mistakes.
                Your other Hengo learning history is not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteHistory}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting…" : "Delete history"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
