"use client"

import { differenceInCalendarDays } from "date-fns"
import { Clock, Calendar, AlertTriangle } from "lucide-react"

import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { hhmmToMinutes } from "@/lib/calendar"
import { AutoResizingDescription } from "./AutoResizingDescription"
import { TaskColorPicker } from "./TaskColorPicker"

/**
 * Live duration in minutes for the selected window, spanning multiple days
 * when start/end dates differ. Shared by the form display and both dialogs.
 */
export const calcDurationMinutes = (
  startDate: Date,
  endDate: Date,
  dailyStart: string,
  dailyEnd: string
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

// Native time input mirroring the AriaTimePicker prop shape ("HH:MM" value/onChange).
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
      className="flex h-9 w-full items-center rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 [color-scheme:light] dark:[color-scheme:dark]"
    />
  )
}

interface TaskFormFieldsProps {
  formId: string
  onSubmit: (e: React.FormEvent) => void
  preventEnterSubmit?: boolean
  className?: string

  title: string
  onTitleChange: (v: string) => void
  titlePlaceholder?: string
  autoFocusTitle?: boolean
  showTitleRequired?: boolean

  description: string
  onDescriptionChange: (v: string) => void
  descriptionPlaceholder?: string
  descriptionMinRows?: number

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
  title,
  onTitleChange,
  titlePlaceholder = "What needs to be done?",
  autoFocusTitle,
  showTitleRequired,
  description,
  onDescriptionChange,
  descriptionPlaceholder = "Add details...",
  descriptionMinRows,
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
  const spanDays = Math.max(0, differenceInCalendarDays(endDate, startDate))

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
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor={`${formId}-title`} className="text-sm font-medium text-muted-foreground">
          Title
        </Label>
        <Input
          id={`${formId}-title`}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          autoFocus={autoFocusTitle}
          className="bg-background/80 border-border h-11 text-base"
        />
        {showTitleRequired && !title.trim() && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Title is required.
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor={`${formId}-description`}
          className="text-sm font-medium text-muted-foreground"
        >
          Description
        </Label>
        <AutoResizingDescription
          id={`${formId}-description`}
          value={description}
          onChange={onDescriptionChange}
          placeholder={descriptionPlaceholder}
          minRows={descriptionMinRows}
          className="bg-background/80 border-border min-h-[100px] text-base"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            Start Date
          </Label>
          <DateTimePicker
            granularity="day"
            value={startDate}
            min={startDateMin}
            max={startDateMax}
            onChange={(d) => d && onStartDateChange(d)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
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
            rangeHintIsError ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {rangeHint}
        </p>
      )}

      {/* Times */}
      {!isAnytime && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                Start Time
              </Label>
              <TimeField ariaLabel="Start time" value={dailyStart} onChange={onStartTimeChange} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                End Time
              </Label>
              <TimeField ariaLabel="End time" value={dailyEnd} onChange={onEndTimeChange} />
            </div>
          </div>

          {showDuration && (
            <div className="flex items-center justify-between bg-muted/40 border border-border px-3 py-2 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground">Duration</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {formatDuration(calcDurationMinutes(startDate, endDate, dailyStart, dailyEnd))}
              </span>
            </div>
          )}

          {timeError && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {timeError}
            </p>
          )}
        </div>
      )}

      {spanDays > 0 && <p className="text-xs text-muted-foreground">Spans {spanDays + 1} days</p>}

      {/* Anytime & Completed */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between bg-muted/40 border border-border px-3 py-2.5 rounded-lg">
          <Label className="text-sm font-medium text-muted-foreground">Anytime</Label>
          <Switch checked={isAnytime} onCheckedChange={onAnytimeChange} />
        </div>
        <div className="flex items-center justify-between bg-muted/40 border border-border px-3 py-2.5 rounded-lg">
          <Label className="text-sm font-medium text-muted-foreground">Completed</Label>
          <Switch checked={completed} onCheckedChange={onCompletedChange} />
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Color</Label>
        <TaskColorPicker value={color} onChange={onColorChange} />
      </div>
    </form>
  )
}
