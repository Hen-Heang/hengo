"use client"

import { AlertCircle, Keyboard, Mic, Square } from "lucide-react"

import { Textarea } from "@/components/ui/textarea"
import type { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { cn } from "@/lib/utils"

interface SpeakingControlsProps {
  speech: ReturnType<typeof useSpeechRecognition>
  audioPlaying: boolean
  disabled: boolean
  detectedTranscript: string
  onDetectedTranscript: (value: string) => void
  stateLabel: string
}

export function SpeakingControls({
  speech,
  audioPlaying,
  disabled,
  detectedTranscript,
  onDetectedTranscript,
  stateLabel,
}: SpeakingControlsProps) {
  const recording = speech.status === "listening"

  function toggleRecording() {
    if (recording) {
      const detected = speech.stop()
      onDetectedTranscript(detected)
      return
    }
    if (audioPlaying) {
      speech.setError("Wait until the question audio finishes before recording.")
      return
    }
    speech.start()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/20 p-5 text-center">
        <p role="status" aria-live="polite" className="text-sm font-medium text-muted-foreground">
          {stateLabel}
        </p>
        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled || audioPlaying}
          aria-label={recording ? "Stop recording" : "Start recording"}
          aria-pressed={recording}
          className={cn(
            "mt-4 flex size-20 items-center justify-center rounded-full text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            recording ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700",
          )}
        >
          {recording ? <Square className="size-7 fill-current" /> : <Mic className="size-8" />}
        </button>
        <p className="mt-3 text-sm font-semibold text-foreground">
          {recording ? "Tap to stop" : audioPlaying ? "Question audio is playing" : "Tap to answer"}
        </p>
        {recording ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <span className="size-2 rounded-full bg-rose-600" />
            Listening - pauses are okay
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2">
          <Mic className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">What you actually said</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your live voice answer. Audio is not stored; only the confirmed transcript below is
          scored.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2">
          <Keyboard className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Speech recognition detected</h3>
        </div>
        <p className="mt-2 min-h-8 text-sm leading-relaxed text-foreground">
          {detectedTranscript || speech.transcript || "No speech detected yet."}
        </p>
      </div>

      <label className="block rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4">
        <span className="text-sm font-semibold text-foreground">Confirmed transcript</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          Correct recognition mistakes here. This exact text will be scored.
        </span>
        <Textarea
          value={speech.transcript}
          onChange={(event) => speech.setTranscript(event.target.value)}
          onFocus={() => {
            if (!detectedTranscript && speech.transcript) onDetectedTranscript(speech.transcript)
          }}
          disabled={disabled || recording}
          placeholder={
            speech.supported
              ? "Record, then correct the detected Korean if needed."
              : "Speech recognition is unavailable. Type your Korean answer here."
          }
          className="mt-3 min-h-28 rounded-xl bg-background text-base leading-relaxed"
        />
      </label>

      {speech.error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{speech.error}</p>
        </div>
      ) : null}
    </div>
  )
}
