"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

const DEFAULT_STAGES = ["Thinking…", "Writing…", "Polishing…"]

/**
 * Staged progress indicator for slow AI calls. Cycles through the given
 * status lines (stopping on the last one so it never loops back, which
 * would read as a stall) above an indeterminate progress bar.
 */
export function AiGenerating({
  stages = DEFAULT_STAGES,
  stageDuration = 2200,
  className,
}: {
  stages?: string[]
  stageDuration?: number
  className?: string
}) {
  const [stage, setStage] = React.useState(0)

  React.useEffect(() => {
    if (stage >= stages.length - 1) return
    const id = window.setTimeout(() => setStage((s) => s + 1), stageDuration)
    return () => window.clearTimeout(id)
  }, [stage, stages.length, stageDuration])

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
        <Sparkles size={16} className="animate-pulse" />
        <motion.span
          className="absolute -inset-1 rounded-[0.9rem] border border-blue-500/40"
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="truncate text-xs font-bold text-muted-foreground"
          >
            {stages[Math.min(stage, stages.length - 1)]}
          </motion.p>
        </AnimatePresence>

        <div className="relative h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
          <motion.span
            className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-blue-500/0 via-blue-500 to-blue-500/0"
            animate={{ left: ["-33%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  )
}
