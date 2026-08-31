"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagEditor } from "@/components/ui/tag-editor"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage, goalsApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { useHabits } from "@/hooks/useHabits"
import {
  buildEntryFromTemplate,
  DAILY_TEMPLATE_PROMPTS,
  ENERGY_LABELS,
  MOOD_LABELS,
  validateJournalEntryInput,
  type JournalEntry,
  type JournalEntryInput,
} from "@/lib/journal"
import { cn } from "@/lib/utils"

const NONE = "none"

export interface JournalComposerValues {
  occurredAt: Date
  title: string
  achievement: string
  lesson: string
  blocker: string
  tomorrow: string
  gratitude: string
  content: string
  mood: number | null
  energy: number | null
  tags: string[]
  goalId: string
  habitId: string
}

function emptyValues(): JournalComposerValues {
  return {
    occurredAt: new Date(),
    title: "",
    achievement: "",
    lesson: "",
    blocker: "",
    tomorrow: "",
    gratitude: "",
    content: "",
    mood: null,
    energy: null,
    tags: [],
    goalId: NONE,
    habitId: NONE,
  }
}

export function entryToComposerValues(entry: JournalEntry): JournalComposerValues {
  return {
    occurredAt: new Date(entry.occurredAt),
    title: entry.title ?? "",
    achievement: entry.achievement ?? "",
    lesson: entry.lesson ?? "",
    blocker: entry.blocker ?? "",
    tomorrow: "",
    gratitude: entry.gratitude ?? "",
    content: entry.content,
    mood: entry.mood,
    energy: entry.energy,
    tags: entry.tags,
    goalId: entry.goalId ?? NONE,
    habitId: entry.habitId ?? NONE,
  }
}

function toInput(values: JournalComposerValues): JournalEntryInput {
  const template = buildEntryFromTemplate({ tomorrow: values.tomorrow })
  const content = [values.content.trim(), template.content].filter(Boolean).join("\n\n")
  return {
    occurredAt: values.occurredAt.toISOString(),
    title: values.title.trim() || null,
    content,
    mood: values.mood,
    energy: values.energy,
    achievement: values.achievement.trim() || null,
    lesson: values.lesson.trim() || null,
    blocker: values.blocker.trim() || null,
    gratitude: values.gratitude.trim() || null,
    tags: values.tags,
    goalId: values.goalId === NONE ? null : values.goalId,
    habitId: values.habitId === NONE ? null : values.habitId,
  }
}

function RatingPicker({
  value,
  onChange,
  labels,
  name,
}: {
  value: number | null
  onChange: (value: number | null) => void
  labels: readonly string[]
  name: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={name}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          title={labels[n]}
          aria-label={`${name} ${n}: ${labels[n]}`}
          aria-pressed={value === n}
          className={cn(
            "flex size-11 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
            value === n
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function JournalComposer({
  mode,
  initial,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit"
  initial?: JournalComposerValues
  onSave: (input: JournalEntryInput) => Promise<void>
  onCancel?: () => void
}) {
  const [values, setValues] = useState<JournalComposerValues>(initial ?? emptyValues())
  const [moreOpen, setMoreOpen] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const set = (patch: Partial<JournalComposerValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const userId = getUserId()
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", userId, "for-journal-link"],
    queryFn: () => goalsApi.list(),
    enabled: userId != null && moreOpen,
    staleTime: 60_000,
  })
  const { activeHabits } = useHabits()

  const input = toInput(values)
  const errors = validateJournalEntryInput(input)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitAttempted(true)
    if (Object.keys(errors).length > 0 || saving) return
    setSaving(true)
    try {
      await onSave(input)
      if (mode === "create") {
        setValues(emptyValues())
        setSubmitAttempted(false)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't save that entry — try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DateTimePicker
          value={values.occurredAt}
          onChange={(d) => set({ occurredAt: d ?? new Date() })}
          granularity="minute"
          className="sm:w-auto sm:min-w-52"
        />
        <Input
          aria-label="Journal title"
          value={values.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Title (optional)"
          className="min-w-0 flex-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DAILY_TEMPLATE_PROMPTS.filter((p) => p.key !== "tomorrow").map((prompt) => (
          <div key={prompt.key} className="space-y-1.5">
            <label
              htmlFor={`journal-${prompt.key}`}
              className="text-sm font-medium text-muted-foreground"
            >
              {prompt.label}
            </label>
            <Textarea
              id={`journal-${prompt.key}`}
              value={values[prompt.key as "achievement" | "lesson" | "blocker"]}
              onChange={(e) =>
                set({ [prompt.key]: e.target.value } as Partial<JournalComposerValues>)
              }
              placeholder={prompt.placeholder}
              className="min-h-20"
            />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="journal-tomorrow" className="text-sm font-medium text-muted-foreground">
            What should I do tomorrow?
          </label>
          <Textarea
            id="journal-tomorrow"
            value={values.tomorrow}
            onChange={(e) => set({ tomorrow: e.target.value })}
            placeholder={DAILY_TEMPLATE_PROMPTS.find((p) => p.key === "tomorrow")?.placeholder}
            className="min-h-16"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Mood (optional)</span>
          <RatingPicker
            name="Mood"
            value={values.mood}
            onChange={(mood) => set({ mood })}
            labels={MOOD_LABELS}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Energy (optional)</span>
          <RatingPicker
            name="Energy"
            value={values.energy}
            onChange={(energy) => set({ energy })}
            labels={ENERGY_LABELS}
          />
        </div>
      </div>

      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              size={14}
              className={cn("transition-transform", moreOpen && "rotate-180")}
            />
            More (gratitude, notes, tags, goal/habit link)
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="journal-gratitude"
              className="text-sm font-medium text-muted-foreground"
            >
              Gratitude (optional)
            </label>
            <Textarea
              id="journal-gratitude"
              value={values.gratitude}
              onChange={(e) => set({ gratitude: e.target.value })}
              placeholder="Something you're grateful for…"
              className="min-h-16"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="journal-notes" className="text-sm font-medium text-muted-foreground">
              Other notes
            </label>
            <Textarea
              id="journal-notes"
              value={values.content}
              onChange={(e) => set({ content: e.target.value })}
              placeholder="Anything else, in markdown…"
              className="min-h-24"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-muted-foreground">Tags</span>
            <TagEditor tags={values.tags} onChange={(tags) => set({ tags })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">Related goal</span>
              <Select value={values.goalId} onValueChange={(goalId) => set({ goalId })}>
                <SelectTrigger className="w-full" aria-label="Related goal">
                  <SelectValue placeholder="No goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">Related habit</span>
              <Select value={values.habitId} onValueChange={(habitId) => set({ habitId })}>
                <SelectTrigger className="w-full" aria-label="Related habit">
                  <SelectValue placeholder="No habit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No habit</SelectItem>
                  {activeHabits.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      {habit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {submitAttempted && errors.overall && (
        <p role="alert" className="text-sm text-destructive">
          {errors.overall}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {mode === "create" ? "Save entry" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
