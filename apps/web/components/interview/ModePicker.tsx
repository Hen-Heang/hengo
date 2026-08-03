"use client"

import { CheckCircle2, GraduationCap, Sparkles, TimerIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { InterviewMode } from "@/lib/interview-modes"
import { INTERVIEW_MODES } from "@/lib/interview-modes"
import { cn } from "@/lib/utils"

/**
 * Two selectable cards — friendly Practice vs strict Exam Simulation. Purely
 * presentational; the chosen mode's config drives the prompts and session UI.
 */
export function ModePicker({
  value,
  onChange,
}: {
  value: InterviewMode
  onChange: (mode: InterviewMode) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(INTERVIEW_MODES) as InterviewMode[]).map((id) => {
        const cfg = INTERVIEW_MODES[id]
        const active = value === id
        const isExam = id === "exam"
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={cn(
              "rounded-[1.5rem] border p-5 text-left transition-all active:scale-[0.99] sm:rounded-3xl",
              active
                ? isExam
                  ? "border-rose-500/60 bg-rose-500/5 shadow-lg"
                  : "border-blue-500/60 bg-blue-500/5 shadow-lg"
                : "border-border bg-card hover:bg-accent/30"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl",
                  isExam ? "bg-rose-500/10 text-rose-600" : "bg-blue-500/10 text-blue-600"
                )}
              >
                {isExam ? (
                  <GraduationCap size={20} strokeWidth={2.5} />
                ) : (
                  <Sparkles size={20} strokeWidth={2.5} />
                )}
              </div>
              {active && (
                <CheckCircle2
                  size={20}
                  strokeWidth={2.5}
                  className={isExam ? "text-rose-600" : "text-blue-600"}
                />
              )}
            </div>
            <p className="mt-3 text-lg font-bold text-foreground">{cfg.label}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
              {cfg.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cfg.durationSeconds ? (
                <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                  <TimerIcon size={11} className="mr-1" strokeWidth={2.5} />
                  {Math.round(cfg.durationSeconds / 60)} min
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                  Untimed
                </Badge>
              )}
              <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                {cfg.showEnglish ? "English on demand" : "Korean only"}
              </Badge>
              <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                {cfg.showFeedback ? "Feedback every turn" : "Feedback at the end"}
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}
