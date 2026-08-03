"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Turtle, Volume2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getCachedAudioUrl } from "@/components/ui/SpeakButton"
import { registerSpeechAudio } from "@/lib/speech-audio"
import { cn } from "@/lib/utils"

/**
 * The listening drill's audio player: play at normal or 0.75× speed with an
 * optional play-count budget (hard/exam levels). A play is only counted once
 * `audio.play()` resolves, so a blocked iOS autoplay never burns the one exam
 * listen. Audio URLs come from SpeakButton's session cache — no revoking here.
 */
export function QuestionAudioBar({
  text,
  allowSlow,
  maxPlays,
  playsUsed,
  onPlayed,
  onPlaybackEnded,
  autoPlayOnMount = false,
}: {
  text: string
  allowSlow: boolean
  /** null = unlimited. */
  maxPlays: number | null
  playsUsed: number
  /** Fired after a play actually starts (counts toward maxPlays). */
  onPlayed: () => void
  /** Fired only when the question finishes naturally, not when mic capture stops it. */
  onPlaybackEnded?: () => void
  autoPlayOnMount?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopAudioRef = useRef<(() => void) | null>(null)

  const playsLeft = maxPlays === null ? null : Math.max(0, maxPlays - playsUsed)
  const exhausted = playsLeft !== null && playsLeft <= 0

  async function play(rate: number) {
    if (loading || playing || exhausted || !text) return
    setLoading(true)
    try {
      const url = await getCachedAudioUrl(text)
      stopAudioRef.current?.()
      const audio = new Audio(url)
      audio.playbackRate = rate
      audioRef.current = audio
      stopAudioRef.current = registerSpeechAudio(audio, () => {
        setPlaying(false)
        if (audio.ended) onPlaybackEnded?.()
        if (audioRef.current === audio) {
          audioRef.current = null
          stopAudioRef.current = null
        }
      })
      await audio.play()
      // play() resolved — the listen actually started, so it counts.
      setPlaying(true)
      onPlayed()
    } catch {
      // TTS failed or autoplay blocked — nothing consumed, button stays usable.
      stopAudioRef.current?.()
    } finally {
      setLoading(false)
    }
  }

  // Auto-speak each new question once (best-effort; a blocked autoplay is not
  // counted and the candidate just presses Play). Keyed on `text` so the
  // effect's closure always matches the question it plays; old audio stops on
  // question change/unmount.
  useEffect(() => {
    if (autoPlayOnMount) void play(1)
    return () => {
      stopAudioRef.current?.()
      stopAudioRef.current = null
      audioRef.current = null
    }
    // play is recreated per render; running on text change is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-background p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => void play(1)}
          disabled={loading || playing || exhausted}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors hover:bg-accent disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Volume2 size={18} className={playing ? "text-violet-500" : ""} />
          )}
          <span className="text-sm">Play</span>
        </button>
        {allowSlow && (
          <>
            <div className="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              onClick={() => void play(0.75)}
              disabled={loading || playing || exhausted}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors hover:bg-accent disabled:opacity-40"
            >
              <Turtle size={18} />
              <span className="text-sm">Slow</span>
            </button>
          </>
        )}
      </div>
      {playsLeft !== null && (
        <Badge
          className={cn(
            "rounded-lg border-none px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
            exhausted
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-accent/30 text-foreground"
          )}
        >
          {exhausted
            ? "No listens left"
            : `${playsLeft} listen${playsLeft === 1 ? "" : "s"} left`}
        </Badge>
      )}
    </div>
  )
}
