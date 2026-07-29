"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Ear, Gauge, Languages, Loader2, Play, RotateCcw } from "lucide-react"

import { getCachedAudioUrl } from "@/components/ui/SpeakButton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DrillQuestion } from "@/lib/interview-drills"
import { registerSpeechAudio } from "@/lib/speech-audio"

interface ListeningQuestionCardProps {
  question: DrillQuestion
  questionNumber: number
  total: number
  resetKey: string
  onPlayingChange: (playing: boolean) => void
  onSessionEvent?: (event: { replayCount: number; revealedKorean: boolean }) => void
}

export function ListeningQuestionCard({
  question,
  questionNumber,
  total,
  resetKey,
  onPlayingChange,
  onSessionEvent,
}: ListeningQuestionCardProps) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [replayCount, setReplayCount] = useState(0)
  const [revealedKorean, setRevealedKorean] = useState(false)
  const [revealedEnglish, setRevealedEnglish] = useState(false)
  const [autoPlayed, setAutoPlayed] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setReplayCount(0)
    setRevealedKorean(false)
    setRevealedEnglish(false)
    setAutoPlayed(false)
    stopRef.current?.()
  }, [resetKey])

  useEffect(() => () => stopRef.current?.(), [])

  const play = useCallback(async (rate: number, isReplay = true) => {
    if (loading || playing || !question.ko) return
    setLoading(true)
    try {
      const url = await getCachedAudioUrl(question.ko)
      const audio = new Audio(url)
      audio.playbackRate = rate
      stopRef.current = registerSpeechAudio(audio, () => {
        setPlaying(false)
        onPlayingChange(false)
        stopRef.current = null
      })
      await audio.play()
      setPlaying(true)
      onPlayingChange(true)
      if (isReplay) {
        setReplayCount((count) => {
          const next = count + 1
          onSessionEvent?.({ replayCount: next, revealedKorean })
          return next
        })
      }
    } catch {
      stopRef.current?.()
      setPlaying(false)
      onPlayingChange(false)
    } finally {
      setLoading(false)
    }
  }, [loading, onPlayingChange, onSessionEvent, playing, question.ko, revealedKorean])

  useEffect(() => {
    if (autoPlayed || !question.ko) return
    setAutoPlayed(true)
    void play(1, false)
  }, [autoPlayed, play, question.ko, resetKey])

  function revealKorean() {
    setRevealedKorean(true)
    onSessionEvent?.({ replayCount, revealedKorean: true })
  }

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">Question {questionNumber} of {total}</p>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300" role="status" aria-live="polite">
            <Ear className="size-4" aria-hidden="true" />
            {loading ? "Preparing audio" : playing ? "Playing Korean question" : "Listen before reading"}
          </div>
        </div>

        <div className="mt-5 min-h-24 rounded-2xl border border-dashed border-border bg-muted/20 p-5">
          {revealedKorean ? (
            <p lang="ko" className="break-words text-[22px] font-semibold leading-[1.55] text-foreground sm:text-2xl">
              {question.ko}
            </p>
          ) : (
            <div className="flex min-h-14 items-center justify-center text-center">
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                The Korean text is hidden. Listen for the topic and question ending first; replaying or revealing is a learning tool, not a failure.
              </p>
            </div>
          )}
          {revealedEnglish && question.en ? (
            <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">{question.en}</p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button type="button" variant="outline" onClick={() => play(1)} disabled={loading || playing} aria-label="Play question normally" className="h-11 rounded-xl">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : replayCount ? <RotateCcw className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
            Normal
          </Button>
          <Button type="button" variant="outline" onClick={() => play(0.75)} disabled={loading || playing} aria-label="Play question slowly" className="h-11 rounded-xl">
            <Gauge className="mr-2 size-4" />{"0.75\u00D7 slow"}
          </Button>
          <Button type="button" variant="outline" onClick={revealKorean} disabled={revealedKorean} className="h-11 rounded-xl">
            Reveal Korean
          </Button>
          <Button type="button" variant="ghost" onClick={() => setRevealedEnglish((value) => !value)} disabled={!question.en} className="h-11 rounded-xl">
            <Languages className="mr-2 size-4" />{revealedEnglish ? "Hide English" : "Optional English"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Replays this question: {replayCount}</p>
      </CardContent>
    </Card>
  )
}
