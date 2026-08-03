"use client"

import { useState } from "react"
import { ArrowRight, Check, Gauge, GraduationCap, Sparkles, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { userApi, getApiErrorMessage } from "@/lib/api"
import { setDailyGoalMinutes } from "@/lib/onboarding-store"
import { cn } from "@/lib/utils"

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Beginner", desc: "Just starting out", emoji: "🌱" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "Basic conversations", emoji: "🌿" },
  { value: "ADVANCED", label: "Advanced", desc: "Fluent situations", emoji: "🌳" },
]

// Same option set as the Settings "Learning goal" field, so an onboarding
// answer and a later Settings edit stay on the same vocabulary.
const GOAL_OPTIONS = [
  "Daily standup participation",
  "Team meeting communication",
  "Writing professional messages",
  "Technical discussion in Korean",
  "General workplace communication",
]

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
  const [goal, setGoal] = useState<string | null>(null)
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
      await userApi.completeOnboarding(userId, { koreanLevel: level, learningGoal: goal })
      setDailyGoalMinutes(target)
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
        className="max-w-md gap-0 overflow-hidden rounded-3xl border-none p-0 sm:max-w-md"
      >
        <DialogTitle className="sr-only">Welcome to Hengo</DialogTitle>

        {/* Step progress */}
        <div className="flex items-center gap-1.5 px-6 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-blue-500" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="px-6 pt-5 pb-2">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <current.icon size={22} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">{current.title}</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{current.subtitle}</p>
        </div>

        <div className="px-6 py-4">
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
                    <span className="block text-sm font-bold text-foreground">{opt.label}</span>
                    <span className="block text-xs font-medium text-muted-foreground">{opt.desc}</span>
                  </span>
                </OptionCard>
              ))}

            {step === 1 &&
              GOAL_OPTIONS.map((g) => (
                <OptionCard key={g} selected={goal === g} onClick={() => setGoal(g)}>
                  <span className="min-w-0 flex-1 text-left text-sm font-bold text-foreground">{g}</span>
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
                    <span className="block text-sm font-bold text-foreground">{opt.label}</span>
                    <span className="block text-xs font-medium text-muted-foreground">{opt.desc}</span>
                  </span>
                </OptionCard>
              ))}
          </div>

          {error && <p className="mt-3 text-xs font-bold text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-accent/5 px-6 py-4">
          <button
            type="button"
            onClick={onDone}
            className="text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="h-10 rounded-xl px-4 text-xs font-bold active:scale-95"
              >
                Back
              </Button>
            )}
            {isLast ? (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={!current.valid || saving}
                className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-500 active:scale-95"
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
                className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-500 active:scale-95"
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
        "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98]",
        selected
          ? "border-blue-500/60 bg-blue-500/10"
          : "border-border bg-card hover:border-blue-500/30 dark:bg-slate-900/40"
      )}
    >
      {children}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-blue-500 bg-blue-500 text-white" : "border-border text-transparent"
        )}
      >
        <Check size={12} strokeWidth={3.5} />
      </span>
    </button>
  )
}
