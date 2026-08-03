"use client"

import { CheckCircle2, Ear, Headphones, Volume1, VolumeX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  LISTENING_LEVELS,
  type ListeningLevel,
} from "@/lib/interview-drills"
import { cn } from "@/lib/utils"

const LEVEL_ICONS: Record<ListeningLevel, typeof Ear> = {
  easy: Volume1,
  medium: Ear,
  hard: Headphones,
  exam: VolumeX,
}

/**
 * Four selectable difficulty cards for the listening drill. Same selectable-
 * card pattern as ModePicker; the chosen level's config drives the generation
 * prompt and the drill UI (play limits, slow replay, English on reveal).
 */
export function LevelPicker({
  value,
  onChange,
}: {
  value: ListeningLevel
  onChange: (level: ListeningLevel) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(LISTENING_LEVELS) as ListeningLevel[]).map((id) => {
        const cfg = LISTENING_LEVELS[id]
        const active = value === id
        const isExam = id === "exam"
        const Icon = LEVEL_ICONS[id]
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
                  : "border-violet-500/60 bg-violet-500/5 shadow-lg"
                : "border-border bg-card hover:bg-accent/30"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl",
                  isExam ? "bg-rose-500/10 text-rose-600" : "bg-violet-500/10 text-violet-600"
                )}
              >
                <Icon size={20} strokeWidth={2.5} />
              </div>
              {active && (
                <CheckCircle2
                  size={20}
                  strokeWidth={2.5}
                  className={isExam ? "text-rose-600" : "text-violet-600"}
                />
              )}
            </div>
            <p className="mt-3 text-lg font-bold text-foreground">{cfg.label}</p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
              {cfg.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                {cfg.maxPlays === null ? "Unlimited listens" : `${cfg.maxPlays} listen${cfg.maxPlays === 1 ? "" : "s"}`}
              </Badge>
              {cfg.allowSlowReplay && (
                <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                  Slow replay
                </Badge>
              )}
              {!cfg.showEnglishOnReveal && (
                <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px]">
                  No English
                </Badge>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
