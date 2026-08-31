"use client"

import {
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  MessageSquareText,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
} from "lucide-react"

import { CoachAudioPlayer } from "@/components/korean-coach/CoachAudioPlayer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { KoreanTutorFeedback, RomanizationMode, SpeechSpeed } from "@/lib/korean-coach/schemas"

interface CoachFeedbackProps {
  feedback: KoreanTutorFeedback
  romanizationMode: RomanizationMode
  speed: SpeechSpeed
  onSpeedChange: (speed: SpeechSpeed) => void
  onTryAgain: () => void
  onContinue: () => void
  onSaveMistakes: () => Promise<void>
  mistakesSaved: boolean
  busy?: boolean
}

function PhraseBlock({
  title,
  korean,
  romanization,
  english,
  romanizationMode,
  accent = false,
}: {
  title: string
  korean: string
  romanization: string
  english: string
  romanizationMode: RomanizationMode
  accent?: boolean
}) {
  return (
    <div className={accent ? "rounded-xl border border-primary/20 bg-primary/5 p-4" : ""}>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold leading-relaxed" lang="ko">
        {korean}
      </p>
      {romanizationMode === "always" && romanization && (
        <p className="mt-1 text-xs italic text-muted-foreground/70">{romanization}</p>
      )}
      <p className="mt-2 text-sm text-muted-foreground">{english}</p>
    </div>
  )
}

export function CoachFeedback({
  feedback,
  romanizationMode,
  speed,
  onSpeedChange,
  onTryAgain,
  onContinue,
  onSaveMistakes,
  mistakesSaved,
  busy = false,
}: CoachFeedbackProps) {
  const hasImportantCorrection = feedback.mistakes.some((mistake) => mistake.important)

  return (
    <section aria-labelledby="coach-feedback" className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={feedback.taskCompleted ? "accent" : "secondary"}>
            {feedback.taskCompleted ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <MessageSquareText aria-hidden="true" />
            )}
            {feedback.taskCompleted ? "Meaning communicated" : "One useful correction"}
          </Badge>
          {hasImportantCorrection && <Badge variant="outline">Try this one again</Badge>}
        </div>
        <h2 id="coach-feedback" className="mt-3 text-2xl font-semibold">
          Feedback on this attempt
        </h2>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <PhraseBlock
            title="1. What you said · speech recognition result"
            korean={feedback.transcript}
            romanization=""
            english=""
            romanizationMode="never"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              2. What was understood
            </p>
            <p className="mt-2 leading-7">{feedback.understoodMeaning}</p>
          </div>

          <PhraseBlock
            title="3. Corrected Korean"
            korean={feedback.correctedSentence.korean}
            romanization={feedback.correctedSentence.romanization}
            english={feedback.correctedSentence.english}
            romanizationMode={romanizationMode}
            accent
          />

          <PhraseBlock
            title="4. Natural Korean"
            korean={feedback.alternativeSentence.korean}
            romanization={feedback.alternativeSentence.romanization}
            english={feedback.alternativeSentence.english}
            romanizationMode={romanizationMode}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              5. Short explanation
            </p>
            <p className="mt-2 leading-7">{feedback.feedback.summary}</p>
            {!feedback.feedback.grammar.isCorrect && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feedback.feedback.grammar.explanation}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Volume2 className="size-4 text-primary" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                6. Listen to the correction
              </p>
            </div>
            <CoachAudioPlayer
              text={feedback.correctedSentence.korean}
              speed={speed}
              onSpeedChange={onSpeedChange}
              label="Corrected answer"
            />
          </div>

          <div className="rounded-xl bg-muted/35 p-4">
            <p className="text-sm font-semibold">Honest speaking observation</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {feedback.feedback.fluencyObservation}
            </p>
            {feedback.feedback.wordsToRetry.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {feedback.feedback.wordsToRetry.map((word) => (
                  <Badge key={word} variant="outline">
                    <span lang="ko">{word}</span>
                  </Badge>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              This is based on the transcript. It is not an exact pronunciation or phoneme score.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <CardTitle>Next step</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" size="lg" className="w-full" onClick={onTryAgain} disabled={busy}>
            <RotateCcw aria-hidden="true" />
            7. Try Again
          </Button>
          <Button
            type="button"
            size="lg"
            variant={hasImportantCorrection ? "outline" : "secondary"}
            className="w-full"
            onClick={onContinue}
            disabled={busy}
          >
            8. Continue conversation
            <ArrowRight aria-hidden="true" />
          </Button>
          {feedback.mistakes.length > 0 && (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="w-full"
              onClick={() => void onSaveMistakes()}
              disabled={busy || mistakesSaved}
            >
              {mistakesSaved ? <BookmarkCheck aria-hidden="true" /> : <Save aria-hidden="true" />}
              {mistakesSaved ? "9. Saved to mistakes" : "9. Save to mistakes"}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
