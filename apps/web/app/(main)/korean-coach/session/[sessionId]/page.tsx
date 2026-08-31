"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Trash2 } from "lucide-react"

import { SessionSummary } from "@/components/korean-coach/SessionSummary"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorBanner } from "@/components/ui/error-banner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getApiErrorMessage,
  koreanCoachApi,
  type KoreanPracticeSession,
  type KoreanSpeakingAttempt,
} from "@/lib/api"
import { getKoreanCoachScenario } from "@/lib/korean-coach/scenarios"
import { useSessionTimer } from "@/hooks/useSessionTimer"

export default function KoreanCoachSessionPage() {
  useSessionTimer("korean_coach")
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [session, setSession] = useState<KoreanPracticeSession | null>(null)
  const [attempts, setAttempts] = useState<KoreanSpeakingAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    koreanCoachApi
      .getSession(params.sessionId)
      .then((data) => {
        if (!active) return
        setSession(data.session)
        setAttempts(data.attempts)
      })
      .catch((cause) => {
        if (active) setError(getApiErrorMessage(cause, "That session could not be loaded."))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [params.sessionId])

  async function deleteAttempt(id: string) {
    try {
      await koreanCoachApi.deleteAttempt(id)
      setAttempts((current) => current.filter((attempt) => attempt.id !== id))
    } catch (cause) {
      setError(getApiErrorMessage(cause, "The saved attempt could not be deleted."))
    }
  }

  async function deleteSession() {
    try {
      await koreanCoachApi.deleteSession(params.sessionId)
      router.replace("/korean-coach")
    } catch (cause) {
      setError(getApiErrorMessage(cause, "The session could not be deleted."))
    }
  }

  if (loading) return <Skeleton className="mx-auto h-[42rem] max-w-2xl rounded-2xl" />

  if (!session || !session.summary) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link href="/korean-coach">
            <ArrowLeft aria-hidden="true" />
            Korean Coach
          </Link>
        </Button>
        <ErrorBanner>
          {error || "This session has not finished yet, so there is no saved summary."}
        </ErrorBanner>
      </div>
    )
  }

  const scenario = session.scenarioId ? getKoreanCoachScenario(session.scenarioId) : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-7 pb-14">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/korean-coach">
          <ArrowLeft aria-hidden="true" />
          Korean Coach
        </Link>
      </Button>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      <SessionSummary summary={session.summary} scenario={scenario} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Saved attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No speaking attempts were saved for this session.
            </p>
          ) : (
            <ul className="space-y-3">
              {attempts.map((attempt, index) => (
                <li key={attempt.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Attempt {index + 1}</Badge>
                        <Badge variant="secondary">{attempt.inputMethod}</Badge>
                        {attempt.isRetry && <Badge variant="secondary">retry</Badge>}
                      </div>
                      <p className="mt-3" lang="ko">
                        {attempt.transcript}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-primary" lang="ko">
                        {attempt.feedback.correctedSentence.korean}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete attempt ${index + 1}`}
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this saved attempt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The transcript and feedback for this attempt will be permanently
                            removed. No raw audio is stored.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void deleteAttempt(attempt.id)}>
                            Delete attempt
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" className="text-destructive">
              <Trash2 aria-hidden="true" />
              Delete complete session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this complete session?</AlertDialogTitle>
              <AlertDialogDescription>
                The summary and every saved attempt in this session will be permanently removed.
                Mistakes saved to the notebook remain available.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void deleteSession()}>
                Delete session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
