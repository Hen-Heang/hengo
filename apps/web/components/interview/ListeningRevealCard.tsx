"use client"

import { BookOpen, Languages, MessageSquareQuote, SpellCheck } from "lucide-react"
import { motion } from "motion/react"

import { SpeakButton } from "@/components/ui/SpeakButton"
import { Card, CardContent } from "@/components/ui/card"
import type { EnrichedDrillQuestion } from "@/lib/interview-drills"

/**
 * What the candidate sees after revealing a listening-drill question: the
 * Korean transcript (with replay), the English translation (level-gated),
 * gloss chips for the tricky words, a grammar note, and their own answer for
 * self-comparison.
 */
export function ListeningRevealCard({
  question,
  showEnglish,
  userAnswer,
}: {
  question: EnrichedDrillQuestion
  showEnglish: boolean
  userAnswer?: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[1.8rem] border-violet-500/30 bg-violet-500/5 shadow-xl dark:bg-slate-900/40 sm:rounded-[2.2rem]">
        <CardContent className="space-y-5 p-5 sm:p-6">
          {/* Transcript */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              What was asked
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
                {question.ko}
              </p>
              <SpeakButton text={question.ko} className="mt-1 shrink-0 p-1.5" />
            </div>
            {showEnglish && question.en && (
              <p className="mt-2 flex items-start gap-1.5 text-sm font-medium italic leading-relaxed text-muted-foreground">
                <Languages size={14} className="mt-0.5 shrink-0" strokeWidth={2.5} />
                {question.en}
              </p>
            )}
          </div>

          {/* Difficult words */}
          {question.glosses.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <BookOpen size={12} strokeWidth={2.5} /> Words to know
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {question.glosses.map((gloss) => (
                  <span
                    key={gloss.term}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/60 py-1 pl-3 pr-1 text-sm font-bold text-foreground"
                  >
                    {gloss.term}
                    <span className="text-xs font-medium text-muted-foreground">
                      {gloss.meaning}
                    </span>
                    <SpeakButton text={gloss.term} className="p-1" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grammar note */}
          {question.grammarNote && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-background/60 p-4">
              <SpellCheck size={16} className="mt-0.5 shrink-0 text-violet-600" strokeWidth={2.5} />
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                {question.grammarNote}
              </p>
            </div>
          )}

          {/* The candidate's answer, for self-comparison */}
          {userAnswer && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                <MessageSquareQuote size={12} strokeWidth={2.5} /> Your answer
              </p>
              <p className="mt-1.5 text-sm font-bold leading-relaxed text-foreground">
                {userAnswer}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
