"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CalendarClock, Check, Loader2, X } from "lucide-react"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DEFAULT_TASK_COLOR } from "@/lib/tasks"
import { bumpEndAfterStart } from "@/lib/calendar"
import { TaskFormFields, calcDurationMinutes } from "./TaskFormFields"

export interface TaskRangePayload {
  title?: string
  start_date?: Date
  end_date?: Date
  daily_start_time?: string
  daily_end_time?: string
  is_anytime?: boolean
  duration_minutes?: number | null
  completed?: boolean
  color?: string | null
}

interface AddTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (
    description: string,
    date: Date,
    time?: string,
    range?: TaskRangePayload
  ) => void | Promise<void>
  defaultDate?: Date
  defaultTime?: string | null
  goalStartDate?: Date
  goalTargetDate?: Date
}

export function AddTaskDialog({
  isOpen,
  onClose,
  onAddTask,
  defaultDate: propDefaultDate,
  defaultTime,
  goalStartDate,
  goalTargetDate,
}: AddTaskDialogProps) {
  const defaultDate = useMemo(
    () => propDefaultDate ?? new Date(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propDefaultDate?.getTime()]
  )

  const [title, setTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [startDate, setStartDate] = useState<Date>(defaultDate)
  const [endDate, setEndDate] = useState<Date>(defaultDate)
  const [dailyStart, setDailyStart] = useState("09:00")
  const [dailyEnd, setDailyEnd] = useState("10:00")
  const [isAnytime, setIsAnytime] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [color, setColor] = useState<string>(DEFAULT_TASK_COLOR)
  const [timeError, setTimeError] = useState<string | null>(null)

  const clampToGoalRange = useCallback(
    (d: Date): Date => {
      let r = new Date(d)
      if (goalStartDate && r < goalStartDate) r = new Date(goalStartDate)
      if (goalTargetDate && r > goalTargetDate) r = new Date(goalTargetDate)
      return r
    },
    [goalStartDate, goalTargetDate]
  )

  const dateOutOfRange = useMemo(
    () =>
      (!!goalStartDate && startDate < goalStartDate) ||
      (!!goalTargetDate && endDate > goalTargetDate),
    [goalStartDate, goalTargetDate, startDate, endDate]
  )

  const rangeHint = useMemo(() => {
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    if (goalStartDate && goalTargetDate) return `Allowed: ${fmt(goalStartDate)} – ${fmt(goalTargetDate)}`
    if (goalStartDate) return `Must start on or after ${fmt(goalStartDate)}`
    if (goalTargetDate) return `Must end on or before ${fmt(goalTargetDate)}`
    return null
  }, [goalStartDate, goalTargetDate])

  const handleStartTimeChange = useCallback(
    (value: string) => {
      const v = value || "09:00"
      setDailyStart(v)
      setTimeError(null)
      if (startDate.toDateString() === endDate.toDateString()) {
        setDailyEnd((prev) => bumpEndAfterStart(v, prev))
      }
    },
    [startDate, endDate]
  )

  const handleEndTimeChange = useCallback((value: string) => {
    setDailyEnd(value || "10:00")
    setTimeError(null)
  }, [])

  const handleAnytimeChange = useCallback((v: boolean) => {
    setIsAnytime(v)
    setTimeError(null)
  }, [])

  useEffect(() => {
    const base = clampToGoalRange(defaultDate)
    setSelectedDate(base)
    setStartDate(base)
    setEndDate(base)
  }, [defaultDate, clampToGoalRange])

  useEffect(() => {
    if (!isOpen || !defaultTime || !/^\d{1,2}:\d{2}$/.test(defaultTime)) return
    setIsAnytime(false)
    setDailyStart(defaultTime)
    setDailyEnd(bumpEndAfterStart(defaultTime, defaultTime))
    setTimeError(null)
  }, [isOpen, defaultTime])

  const resetForm = useCallback(() => {
    setTitle("")
    setTaskDescription("")
    setCompleted(false)
    setIsAnytime(false)
    setColor(DEFAULT_TASK_COLOR)
    setTimeError(null)
    setSubmitAttempted(false)
    setStartDate(defaultDate)
    setEndDate(defaultDate)
    setDailyStart("09:00")
    setDailyEnd("10:00")
  }, [defaultDate])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleStartDateChange = useCallback((d: Date) => {
    setStartDate(d)
    setEndDate((prev) => (d > prev ? d : prev))
    setSelectedDate(d)
    setTimeError(null)
  }, [])

  const handleEndDateChange = useCallback(
    (d: Date) => {
      setEndDate(d < startDate ? startDate : d)
      setTimeError(null)
    },
    [startDate]
  )

  const startDateMax = useMemo(
    () => (goalTargetDate ? (endDate < goalTargetDate ? endDate : goalTargetDate) : endDate),
    [goalTargetDate, endDate]
  )

  const endDateMin = useMemo(
    () => (goalStartDate ? (startDate > goalStartDate ? startDate : goalStartDate) : startDate),
    [goalStartDate, startDate]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitAttempted(true)
      if (!title.trim()) return
      if (dateOutOfRange) {
        setTimeError(
          rangeHint
            ? `Task dates must fall within the goal window. ${rangeHint}.`
            : "Task dates fall outside the goal's allowed range."
        )
        return
      }

      setIsSubmitting(true)
      try {
        const finalStart = dailyStart || "09:00"
        const finalEnd = dailyEnd || "10:00"
        const durationMinutes = isAnytime
          ? null
          : calcDurationMinutes(startDate, endDate, finalStart, finalEnd)

        await onAddTask(taskDescription.trim(), selectedDate, isAnytime ? undefined : finalStart, {
          title: title || undefined,
          start_date: startDate,
          end_date: endDate,
          daily_start_time: isAnytime ? undefined : finalStart,
          daily_end_time: isAnytime ? undefined : finalEnd,
          is_anytime: isAnytime,
          duration_minutes: durationMinutes,
          completed,
          color,
        })
        resetForm()
        onClose()
      } catch (error) {
        console.error("Failed to add task:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      title,
      dateOutOfRange,
      rangeHint,
      dailyStart,
      dailyEnd,
      isAnytime,
      taskDescription,
      selectedDate,
      startDate,
      endDate,
      completed,
      color,
      onAddTask,
      resetForm,
      onClose,
    ]
  )

  const isSubmitDisabled = isSubmitting || !!timeError || dateOutOfRange

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 gap-0 w-[calc(100vw-2rem)] max-w-[520px] max-h-[90dvh] overflow-hidden flex flex-col rounded-2xl">
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">
              Add New Task
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <DialogDescription className="sr-only">
          Create a new task with a title, description, dates, optional time range, and color.
        </DialogDescription>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
          <TaskFormFields
            formId="add-task-form"
            onSubmit={handleSubmit}
            title={title}
            onTitleChange={setTitle}
            autoFocusTitle
            showTitleRequired={submitAttempted}
            description={taskDescription}
            onDescriptionChange={setTaskDescription}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            startDateMin={goalStartDate}
            startDateMax={startDateMax}
            endDateMin={endDateMin}
            endDateMax={goalTargetDate}
            rangeHint={rangeHint}
            rangeHintIsError={dateOutOfRange}
            dailyStart={dailyStart}
            dailyEnd={dailyEnd}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            timeError={timeError}
            isAnytime={isAnytime}
            onAnytimeChange={handleAnytimeChange}
            completed={completed}
            onCompletedChange={setCompleted}
            color={color}
            onColorChange={setColor}
          />
        </div>

        <div className="flex-shrink-0 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border/60">
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-11">
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-task-form"
              disabled={isSubmitDisabled}
              className="flex-[2] h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
