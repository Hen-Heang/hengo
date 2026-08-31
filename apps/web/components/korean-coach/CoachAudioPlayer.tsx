"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AudioLines, LoaderCircle, Pause, Play, RotateCcw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { koreanCoachAiApi, type KoreanCoachAiMode } from "@/lib/api"
import type { SpeechSpeed } from "@/lib/korean-coach/schemas"
import { cn } from "@/lib/utils"

interface CoachAudioPlayerProps {
  text: string
  speed: SpeechSpeed
  onSpeedChange: (speed: SpeechSpeed) => void
  className?: string
  label?: string
  onReplay?: () => boolean
  replayDisabled?: boolean
}

function speakBrowserPreview(text: string, speed: SpeechSpeed, onEnd: () => void) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "ko-KR"
  utterance.rate = speed
  const koreanVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith("ko"))
  if (koreanVoice) utterance.voice = koreanVoice
  utterance.onend = onEnd
  utterance.onerror = onEnd
  window.speechSynthesis.speak(utterance)
}

export function CoachAudioPlayer({
  text,
  speed,
  onSpeedChange,
  className,
  label = "Tutor question",
  onReplay,
  replayDisabled = false,
}: CoachAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const cachedKeyRef = useRef("")
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState<KoreanCoachAiMode | null>(null)
  const [error, setError] = useState("")

  const clearAudio = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = null
    cachedKeyRef.current = ""
  }, [])

  useEffect(() => {
    clearAudio()
    setPlaying(false)
    setError("")
    window.speechSynthesis?.cancel()
  }, [clearAudio, speed, text])

  useEffect(
    () => () => {
      clearAudio()
      window.speechSynthesis?.cancel()
    },
    [clearAudio],
  )

  async function loadAndPlay(restart = false) {
    if (!text || loading) return
    setError("")

    if (mode === "mock" && cachedKeyRef.current === `${text}:${speed}`) {
      speakBrowserPreview(text, speed, () => setPlaying(false))
      setPlaying(true)
      return
    }

    if (audioRef.current && cachedKeyRef.current === `${text}:${speed}`) {
      if (restart) audioRef.current.currentTime = 0
      await audioRef.current.play()
      setPlaying(true)
      return
    }

    setLoading(true)
    try {
      const result = await koreanCoachAiApi.speech(text, speed)
      setMode(result.mode)
      cachedKeyRef.current = `${text}:${speed}`
      if (!result.audio) {
        speakBrowserPreview(text, speed, () => setPlaying(false))
        setPlaying(true)
        return
      }
      clearAudio()
      const url = URL.createObjectURL(result.audio)
      objectUrlRef.current = url
      cachedKeyRef.current = `${text}:${speed}`
      const audio = new Audio(url)
      audio.preload = "auto"
      audio.onended = () => setPlaying(false)
      audio.onpause = () => setPlaying(false)
      audio.onerror = () => {
        setPlaying(false)
        setError("The generated voice could not be played. Continue with the transcript.")
      }
      audioRef.current = audio
      await audio.play()
      setPlaying(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Voice generation failed.")
    } finally {
      setLoading(false)
    }
  }

  function pause() {
    if (mode === "mock") {
      window.speechSynthesis.pause()
    } else {
      audioRef.current?.pause()
    }
    setPlaying(false)
  }

  function resume() {
    if (mode === "mock" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setPlaying(true)
      return
    }
    void loadAndPlay()
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AudioLines className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">
              {mode === "mock" ? "Mock browser preview · not AI-generated" : "AI-generated voice"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={playing ? "Pause Korean audio" : "Play Korean audio"}
            onClick={playing ? pause : resume}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : playing ? (
              <Pause />
            ) : (
              <Play />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Replay Korean audio"
            onClick={() => {
              if (!onReplay || onReplay()) void loadAndPlay(true)
            }}
            disabled={loading || replayDisabled}
          >
            <RotateCcw />
          </Button>
        </div>
      </div>

      <div role="group" aria-label="Audio speed" className="grid grid-cols-3 gap-2">
        {([0.75, 1, 1.25] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={speed === option}
            onClick={() => onSpeedChange(option)}
            className={cn(
              "min-h-11 rounded-xl border px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              speed === option
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {option}×
          </button>
        ))}
      </div>

      {error && (
        <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
