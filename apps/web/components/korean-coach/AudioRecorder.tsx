"use client"

import { useEffect, useRef, useState } from "react"
import {
  Ban,
  CircleStop,
  Keyboard,
  LoaderCircle,
  Mic,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"

interface AudioRecorderProps {
  onSubmitAudio: (audio: Blob, durationMs: number) => Promise<void>
  onSubmitText: (text: string) => Promise<void>
  disabled?: boolean
}

function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export function AudioRecorder({
  onSubmitAudio,
  onSubmitText,
  disabled = false,
}: AudioRecorderProps) {
  const recorder = useAudioRecorder()
  const playbackRef = useRef<HTMLAudioElement | null>(null)
  const [showTextInput, setShowTextInput] = useState(!recorder.isSupported)
  const [text, setText] = useState("")
  const [textSubmitting, setTextSubmitting] = useState(false)

  useEffect(() => {
    if (!recorder.isSupported) setShowTextInput(true)
  }, [recorder.isSupported])

  async function submitRecording() {
    if (!recorder.audioBlob || recorder.state.phase === "processing" || disabled) return
    recorder.markProcessing()
    try {
      await onSubmitAudio(recorder.audioBlob, recorder.state.durationMs)
      recorder.markSuccess()
    } catch (cause) {
      recorder.markError(
        cause instanceof Error
          ? cause.message
          : "Your answer could not be processed. Try again or use text input.",
      )
    }
  }

  async function submitText() {
    const answer = text.trim()
    if (!answer || recorder.state.phase === "processing" || disabled || textSubmitting) return
    setTextSubmitting(true)
    try {
      await onSubmitText(answer)
    } catch (cause) {
      recorder.markError(
        cause instanceof Error ? cause.message : "Your answer could not be processed. Try again.",
      )
    } finally {
      setTextSubmitting(false)
    }
  }

  const processing = recorder.state.phase === "processing" || textSubmitting || disabled

  return (
    <section aria-labelledby="your-answer" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="your-answer" className="font-semibold">
            Your answer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer briefly in Korean. You can retry after the correction.
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={showTextInput ? "Use microphone" : "Use text input"}
          onClick={() => setShowTextInput((current) => !current)}
          disabled={processing || (!recorder.isSupported && showTextInput)}
        >
          {showTextInput ? <Mic /> : <Keyboard />}
        </Button>
      </div>

      {showTextInput ? (
        <div className="space-y-3">
          <label htmlFor="korean-text-answer" className="sr-only">
            Korean answer
          </label>
          <Textarea
            id="korean-text-answer"
            lang="ko"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="한국어로 짧게 대답해 보세요…"
            maxLength={2000}
            disabled={processing}
          />
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => void submitText()}
            disabled={!text.trim() || processing}
          >
            {processing ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Send />
            )}
            {processing ? "Preparing feedback…" : "Submit text answer"}
          </Button>
          {recorder.isSupported && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setShowTextInput(false)}
              disabled={processing}
            >
              <Mic aria-hidden="true" />
              Use microphone instead
            </Button>
          )}
        </div>
      ) : (
        <div className="min-h-56 rounded-2xl border border-border/70 bg-muted/25 p-4">
          <div className="flex min-h-40 flex-col items-center justify-center text-center">
            {recorder.state.phase === "requesting-permission" && (
              <>
                <LoaderCircle
                  className="size-9 animate-spin text-primary motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <p className="mt-3 font-semibold">Requesting microphone permission…</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your browser will ask only when you choose to record.
                </p>
              </>
            )}

            {recorder.state.phase === "recording" && (
              <>
                <div className="relative flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <span className="absolute inset-0 animate-ping rounded-full bg-destructive/10 motion-reduce:animate-none" />
                  <Mic className="relative size-8" aria-hidden="true" />
                </div>
                <p
                  className="mt-3 font-mono text-2xl font-semibold tabular-nums"
                  aria-live="polite"
                >
                  {formatDuration(recorder.state.durationMs)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Recording your Korean answer</p>
              </>
            )}

            {(recorder.state.phase === "idle" || recorder.state.phase === "success") && (
              <>
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mic className="size-8" aria-hidden="true" />
                </div>
                <p className="mt-3 font-semibold">Ready when you are</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep the answer short. Raw audio is not saved.
                </p>
              </>
            )}

            {recorder.state.phase === "recorded" && (
              <>
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Play className="size-7" aria-hidden="true" />
                </div>
                <p className="mt-3 font-semibold">Recording ready</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDuration(recorder.state.durationMs)} · replay it before sending if you
                  like.
                </p>
                {recorder.audioUrl && (
                  <audio
                    ref={playbackRef}
                    className="mt-3 h-11 w-full max-w-sm"
                    src={recorder.audioUrl}
                    controls
                    preload="metadata"
                    aria-label="Replay your recorded answer"
                  />
                )}
              </>
            )}

            {recorder.state.phase === "processing" && (
              <>
                <LoaderCircle
                  className="size-9 animate-spin text-primary motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <p className="mt-3 font-semibold">Transcribing and preparing feedback…</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This usually takes a few seconds. Please keep this page open.
                </p>
              </>
            )}

            {recorder.state.phase === "error" && (
              <>
                <TriangleAlert className="size-9 text-destructive" aria-hidden="true" />
                <p className="mt-3 font-semibold">Recording needs attention</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground" role="alert">
                  {recorder.state.error}
                </p>
              </>
            )}
          </div>

          <div className="mt-3 grid gap-2">
            {recorder.state.phase === "recording" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" size="lg" variant="outline" onClick={recorder.cancel}>
                  <X aria-hidden="true" />
                  Cancel
                </Button>
                <Button type="button" size="lg" onClick={recorder.stop}>
                  <CircleStop aria-hidden="true" />
                  Stop
                </Button>
              </div>
            ) : recorder.state.phase === "recorded" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" size="lg" variant="outline" onClick={recorder.reset}>
                  <RotateCcw aria-hidden="true" />
                  Retry
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => void submitRecording()}
                  disabled={!recorder.audioBlob || processing}
                >
                  <Send aria-hidden="true" />
                  Send answer
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => void recorder.start()}
                disabled={processing || recorder.state.phase === "requesting-permission"}
              >
                {recorder.state.phase === "requesting-permission" ? (
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <Mic />
                )}
                {recorder.state.phase === "error" ? "Try microphone again" : "Record answer"}
              </Button>
            )}
          </div>
        </div>
      )}

      {!showTextInput && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setShowTextInput(true)}
          disabled={processing}
        >
          {recorder.isSupported ? <Keyboard aria-hidden="true" /> : <Ban aria-hidden="true" />}
          Continue with text input
        </Button>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        The recording is sent securely for transcription and feedback. Do not record sensitive
        workplace or personal information. Hengo does not permanently store the raw audio.
      </p>
    </section>
  )
}
