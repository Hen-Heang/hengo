"use client"

import { useState } from "react"
import { differenceInCalendarDays } from "date-fns"
import { AlertTriangle, Calendar, ChevronDown, Clock } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { hhmmToMinutes } from "@/lib/calendar"
import { AutoResizingDescription } from "./AutoResizingDescription"
import { TaskColorPicker } from "./TaskColorPicker"

/** Sentinel `Select` value for "no goal" — same convention as QuickCaptureDialog. */
export const NO_GOAL = "none"

export interface TaskFormGoalOption {
  id: string
  title: string
}

/**
 * Live duration in minutes for the selected window, spanning multiple days
 * when start/end dates differ. Shared by the form display and both dialogs.
 */
export const calcDurationMinutes = (
  startDate: Date,
  endDate: Date,
  dailyStart: string,
  dailyEnd: string,
) => {
  const dayDiff = Math.max(0, differenceInCalendarDays(endDate, startDate))
  return Math.max(0, hhmmToMinutes(dailyEnd) + dayDiff * 1440 - hhmmToMinutes(dailyStart))
}

const formatDuration = (mins: number) => {
  if (mins <= 0) return "0m"
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  return parts.join(" ")
}

function TimeField({
  value,
  onChange,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  ariaLabel: string
}) {
  return (
    <input
      type="time"
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-11 w-full items-center rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 [color-scheme:light] dark:[color-scheme:dark]"
    />
  )
}

interface TaskFormFieldsProps {
  formId: string
  onSubmit: (e: React.FormEvent) => void
  preventEnterSubmit?: boolean
  className?: string
  /** New-task mode: show only the fields needed to schedule quickly. */
  compact?: boolean

  title: string
  onTitleChange: (v: string) => void
  titlePlaceholder?: string
  autoFocusTitle?: boolean
  showTitleRequired?: boolean

  description: string
  onDescriptionChange: (v: string) => void
  descriptionPlaceholder?: string
  descriptionMinRows?: number

  goals?: TaskFormGoalOption[]
  goalId?: string
  onGoalIdChange?: (v: string) => void

  startDate: Date
  endDate: Date
  onStartDateChange: (d: Date) => void
  onEndDateChange: (d: Date) => void
  startDateMin?: Date
  startDateMax?: Date
  endDateMin?: Date
  endDateMax?: Date
  rangeHint?: string | null
  rangeHintIsError?: boolean

  dailyStart: string
  dailyEnd: string
  onStartTimeChange: (v: string) => void
  onEndTimeChange: (v: string) => void
  timeError: string | null
  showDuration?: boolean

  isAnytime: boolean
  onAnytimeChange: (v: boolean) => void
  completed: boolean
  onCompletedChange: (v: boolean) => void
  color: string
  onColorChange: (v: string) => void
}

export function TaskFormFields({
  formId,
  onSubmit,
  preventEnterSubmit,
  className,
  compact = false,
  title,
  onTitleChange,
  titlePlaceholder = "What needs to be done?",
  autoFocusTitle,
  showTitleRequired,
  description,
  onDescriptionChange,
  descriptionPlaceholder = "Add details...",
  descriptionMinRows,
  goals,
  goalId,
  onGoalIdChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startDateMin,
  startDateMax,
  endDateMin,
  endDateMax,
  rangeHint,
  rangeHintIsError,
  dailyStart,
  dailyEnd,
  onStartTimeChange,
  onEndTimeChange,
  timeError,
  showDuration,
  isAnytime,
  onAnytimeChange,
  completed,
  onCompletedChange,
  color,
  onColorChange,
}: TaskFormFieldsProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const spanDays = Math.max(0, differenceInCalendarDays(endDate, startDate))

  const descriptionField = (
    <div className="space-y-2">
      <Label
        htmlFor={`${formId}-description`}
        className="text-sm font-medium text-muted-foreground"
      >
        Description <span className="font-normal">(optional)</span>
      </Label>
      <AutoResizingDescription
        id={`${formId}-description`}
        value={description}
        onChange={onDescriptionChange}
        placeholder={descriptionPlaceholder}
        minRows={descriptionMinRows}
        className="min-h-[88px] border-border bg-background/80 text-base"
      />
    </div>
  )

  const goalField = goals ? (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">Goal</Label>
      <Select value={goalId ?? NO_GOAL} onValueChange={(v) => onGoalIdChange?.(v)}>
        <SelectTrigger className="w-full" aria-label="Goal">
          <SelectValue placeholder="No goal (personal task)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_GOAL}>No goal (personal task)</SelectItem>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null

  const startDateField = (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
        Date
      </Label>
      <DateTimePicker
        granularity="day"
        value={startDate}
        min={startDateMin}
        max={startDateMax}
        onChange={(d) => d && onStartDateChange(d)}
      />
    </div>
  )

  const anytimeField = (
    <div className="flex min-h-11 items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div>
        <Label className="text-sm font-medium text-foreground">Anytime</Label>
        {compact && <p className="mt-0.5 text-xs text-muted-foreground">No fixed clock time</p>}
      </div>
      <Switch checked={isAnytime} onCheckedChange={onAnytimeChange} />
    </div>
  )

  const startTimeField = !isAnytime ? (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
        Start Time
      </Label>
      <TimeField ariaLabel="Start time" value={dailyStart} onChange={onStartTimeChange} />
    </div>
  ) : null

  const advancedFields = (
    <div className="space-y-5">
      {descriptionField}

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
          End Date
        </Label>
        <DateTimePicker
          granularity="day"
          value={endDate}
          min={endDateMin}
          max={endDateMax}
          onChange={(d) => d && onEndDateChange(d)}
        />
      </div>

      {!isAnytime && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            End Time
          </Label>
          <TimeField ariaLabel="End time" value={dailyEnd} onChange={onEndTimeChange} />
        </div>
      )}

      {showDuration && !isAnytime && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Duration</span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {formatDuration(calcDurationMinutes(startDate, endDate, dailyStart, dailyEnd))}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <Label className="text-sm font-medium text-muted-foreground">Completed</Label>
        <Switch checked={completed} onCheckedChange={onCompletedChange} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Color</Label>
        <TaskColorPicker value={color} onChange={onColorChange} />
      </div>
    </div>
  )

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      onKeyDown={
        preventEnterSubmit
          ? (e) => {
              if (e.key === "Enter" && e.target !== e.currentTarget) e.preventDefault()
            }
          : undefined
      }
      className={cn("space-y-5", className)}
    >
      <div className="space-y-2">
        <Label htmlFor={`${formId}-title`} className="text-sm font-medium text-muted-foreground">
          Task
        </Label>
        <Input
          id={`${formId}-title`}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          autoFocus={autoFocusTitle}
          className="h-11 border-border bg-background/80 text-base"
        />
        {showTitleRequired && !title.trim() && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Title is required.
          </p>
        )}
      </div>

      {compact ? (
        <>
          {goalField}

          <div className="grid gap-3 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
            {startDateField}
            {startTimeField ?? anytimeField}
          </div>

          {startTimeField && anytimeField}

          {rangeHint && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                rangeHintIsError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {rangeHint}
            </p>
          )}

          {timeError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {timeError}
            </p>
          )}

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
                More options
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">{advancedFields}</CollapsibleContent>
          </Collapsible>
        </>
      ) : (
        <>
          {descriptionField}
          {goalField}

          <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
            {startDateField}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                End Date
              </Label>
              <DateTimePicker
                granularity="day"
                value={endDate}
                min={endDateMin}
                max={endDateMax}
                onChange={(d) => d && onEndDateChange(d)}
              />
            </div>
          </div>

          {rangeHint && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs -mt-2",
                rangeHintIsError ? "text-destructive" : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {rangeHint}
            </p>
          )}

          {!isAnytime && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {startTimeField}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                    End Time
                  </Label>
                  <TimeField ariaLabel="End time" value={dailyEnd} onChange={onEndTimeChange} />
                </div>
              </div>

              {showDuration && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">Duration</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatDuration(calcDurationMinutes(startDate, endDate, dailyStart, dailyEnd))}
                  </span>
                </div>
              )}
            </div>
          )}

          {timeError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {timeError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {anytimeField}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <Label className="text-sm font-medium text-muted-foreground">Completed</Label>
              <Switch checked={completed} onCheckedChange={onCompletedChange} />
            </div>
          </div>

          {spanDays > 0 && (
            <p className="text-xs text-muted-foreground">Spans {spanDays + 1} days</p>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Color</Label>
            <TaskColorPicker value={color} onChange={onColorChange} />
          </div>
        </>
      )}
    </form>
  )
}
