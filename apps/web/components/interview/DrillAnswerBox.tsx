"use client"

import { useState } from "react"
import { AlertCircle, Mic, PencilLine, Waves } from "lucide-react"
import { motion } from "motion/react"

import { BorderBeam } from "@/components/ui/border-beam"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { cn } from "@/lib/utils"

/**
 * The record/edit/transcript answer block used by both drill pages — the same
 * interaction as the mock interview's answer area: mic capture with a manual
 * textarea fallback (toggled, or automatic when speech isn't supported).
 */
export function DrillAnswerBox({
  speech,
  disabled = false,
  placeholder = "Type your Korean answer if voice capture was weak…",
}: {
  speech: ReturnType<typeof useSpeechRecognition>
  disabled?: boolean
  placeholder?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const recording = speech.status === "listening"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full rounded-2xl sm:w-fit">
          {recording ? (
            <BorderBeam
              size={56}
              duration={1.8}
              colorFrom="#fb7185"
              colorTo="#fbbf24"
              borderWidth={2}
            />
          ) : null}
          <Button
            onClick={() => (recording ? speech.stop() : speech.start())}
            disabled={disabled}
            aria-pressed={recording}
            className={cn(
              "h-12 w-full rounded-2xl px-6 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 sm:w-auto sm:px-8",
              recording
                ? "bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700"
                : "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700"
            )}
          >
            {recording ? (
              <>
                <Waves size={18} className="mr-2 animate-pulse" /> Stop
              </>
            ) : (
              <>
                <Mic size={18} className="mr-2" /> Record Answer
              </>
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditing((v) => !v)}
          disabled={disabled || recording}
          className="h-12 w-full rounded-2xl border-border bg-background px-6 font-bold hover:bg-accent active:scale-95 sm:w-auto"
        >
          <PencilLine size={16} className="mr-2" />
          {isEditing ? "Done" : "Manual Edit"}
        </Button>
      </div>

      <p role="status" aria-live="polite" className="text-xs font-medium text-muted-foreground">
        {recording
          ? "Listening now — pauses are okay. Tap Stop when your answer is complete."
          : "Record a complete answer; the microphone stays open between sentences."}
      </p>

      <div className="rounded-[1.5rem] border border-border bg-background p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Your answer
        </p>
        {isEditing || !speech.supported ? (
          <Textarea
            value={speech.transcript}
            onChange={(e) => speech.setTranscript(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="mt-3 min-h-[90px] rounded-2xl border-border bg-accent/5 transition-colors focus:bg-background"
          />
        ) : speech.transcript ? (
          <p className="mt-3 text-lg font-bold leading-relaxed text-foreground">
            {speech.transcript}
          </p>
        ) : (
          <p className="mt-3 py-5 text-center text-sm font-medium italic text-muted-foreground">
            {recording
              ? "Listening… speak your answer in Korean."
              : "Your spoken answer will appear here."}
          </p>
        )}
      </div>

      {speech.error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm font-bold leading-relaxed text-destructive">{speech.error}</p>
        </motion.div>
      )}
    </div>
  )
}
