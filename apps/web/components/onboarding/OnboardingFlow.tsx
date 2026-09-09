"use client"

import { useState } from "react"
import { ArrowRight, Check, Gauge, GraduationCap, Sparkles, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { userApi, koreanCoachApi, getApiErrorMessage } from "@/lib/api"
import {
  KOREAN_LEARNING_GOAL_LABEL,
  koreanLearningGoalSchema,
  type KoreanLearningGoal,
} from "@/lib/korean-coach/schemas"
import { cn } from "@/lib/utils"

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Beginner", desc: "Just starting out", emoji: "🌱" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "Basic conversations", emoji: "🌿" },
  { value: "ADVANCED", label: "Advanced", desc: "Fluent situations", emoji: "🌳" },
]

// The app's one goal vocabulary — the same enum /korean-coach/preferences
// edits and every prompt reads. This used to be a fifth, workplace-only list
// of its own, which is how a learner could answer "Team meeting
// communication" here and still see "Workplace Korean" selected there.
const GOAL_OPTIONS = koreanLearningGoalSchema.options

const TARGET_OPTIONS = [
  { minutes: 5, label: "Casual", desc: "5 min / day" },
  { minutes: 15, label: "Regular", desc: "15 min / day" },
  { minutes: 30, label: "Serious", desc: "30 min / day" },
]

type OnboardingFlowProps = {
  userId: string
  onDone: () => void
}

export function OnboardingFlow({ userId, onDone }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<string | null>(null)
  const [goal, setGoal] = useState<KoreanLearningGoal | null>(null)
  const [target, setTarget] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const steps = [
    {
      icon: GraduationCap,
      title: "What's your Korean level?",
      subtitle: "This tunes how the AI coach explains things.",
      valid: level != null,
    },
    {
      icon: Target,
      title: "What's your main goal?",
      subtitle: "We'll shape practice around this.",
      valid: goal != null,
    },
    {
      icon: Gauge,
      title: "Set your daily target",
      subtitle: "A realistic goal beats an ambitious one you skip.",
      valid: target != null,
    },
  ]
  const current = steps[step]
  const isLast = step === steps.length - 1

  async function handleFinish() {
    if (!level || !goal || !target) return
    setSaving(true)
    setError("")
    try {
      // completeOnboarding still writes kori_profiles.learning_goal: it is
      // the cross-device "wizard already done" sentinel app/(main)/layout.tsx
      // checks. The answers themselves live on the coach preferences row,
      // which is what the rest of the app actually reads.
      const current = await koreanCoachApi.getPreferences()
      await Promise.all([
        userApi.completeOnboarding(userId, {
          koreanLevel: level,
          learningGoal: KOREAN_LEARNING_GOAL_LABEL[goal],
        }),
        koreanCoachApi.savePreferences({
          ...current,
          mainGoal: goal,
          dailyPracticeGoalMinutes: target,
        }),
      ])
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save your answers. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden rounded-lg border-none p-0 sm:max-w-md"
      >
        <DialogTitle className="sr-only">Welcome to Hengo</DialogTitle>

        {/* Step progress */}
        <div className="flex items-center gap-1.5 px-5 pt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-blue-500" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <current.icon size={22} strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{current.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>
        </div>

        <div className="px-5 py-4">
          <div className="space-y-2.5">
            {step === 0 &&
              LEVEL_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={level === opt.value}
                  onClick={() => setLevel(opt.value)}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </OptionCard>
              ))}

            {step === 1 &&
              GOAL_OPTIONS.map((g) => (
                <OptionCard key={g} selected={goal === g} onClick={() => setGoal(g)}>
                  <span className="min-w-0 flex-1 text-left text-sm font-semibold text-foreground">
                    {KOREAN_LEARNING_GOAL_LABEL[g]}
                  </span>
                </OptionCard>
              ))}

            {step === 2 &&
              TARGET_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.minutes}
                  selected={target === opt.minutes}
                  onClick={() => setTarget(opt.minutes)}
                >
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                </OptionCard>
              ))}
          </div>

          {error && <p className="mt-3 text-xs font-bold text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-accent/5 px-5 py-3">
          <button
            type="button"
            onClick={onDone}
            className="min-h-11 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="h-11 rounded-lg px-4 text-sm font-semibold"
              >
                Back
              </Button>
            )}
            {isLast ? (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={!current.valid || saving}
                className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Sparkles size={14} className="mr-1.5" />
                    Get started
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!current.valid}
                className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Next
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        selected
          ? "border-blue-500/60 bg-blue-500/10"
          : "border-border bg-card hover:border-blue-500/30 dark:bg-slate-900/40",
      )}
    >
      {children}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-blue-500 bg-blue-500 text-white" : "border-border text-transparent",
        )}
      >
        <Check size={12} strokeWidth={3.5} />
      </span>
    </button>
  )
}
