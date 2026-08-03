"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns"

import { cn } from "@/lib/utils"
import type { Task } from "@/lib/tasks"
import { getTaskColor, hexWithAlpha } from "@/lib/tasks"
import { getAllDayTasks, layoutDayTasks, MINUTES_IN_DAY, formatTaskTimeRange } from "@/lib/calendar"

const HOUR_HEIGHT = 52 // px per hour row
const TOTAL_HEIGHT = HOUR_HEIGHT * 24
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_MINUTES = 30
const SLOTS = Array.from({ length: (24 * 60) / SLOT_MINUTES }, (_, i) => i * SLOT_MINUTES)

interface WeekTimeGridProps {
  mode: "week" | "day"
  selectedDate: Date
  getTasksForDate: (date: Date) => Task[]
  onTaskClick: (task: Task) => void
  onSlotClick?: (date: Date, time: string) => void
  onDateSelect?: (date: Date) => void
}

const formatHourLabel = (hour: number) => {
  if (hour === 0) return "12 AM"
  if (hour === 12) return "12 PM"
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

export function WeekTimeGrid({
  mode,
  selectedDate,
  getTasksForDate,
  onTaskClick,
  onSlotClick,
  onDateSelect,
}: WeekTimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const days = useMemo(() => {
    if (mode === "day") return [selectedDate]
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [mode, selectedDate])

  // Auto-scroll so the current time is in view on mount / view change.
  useEffect(() => {
    if (!scrollRef.current) return
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
    const focusMin = Math.max(0, Math.min(nowMin, MINUTES_IN_DAY) - 90)
    scrollRef.current.scrollTop = (focusMin / 60) * HOUR_HEIGHT
  }, [mode])

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const colWidth = `${100 / days.length}%`

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky day-header row */}
      <div className="flex border-b border-border/60 bg-card/60 backdrop-blur-md">
        <div className="w-14 shrink-0 sm:w-16" aria-hidden />
        {days.map((day) => {
          const today = isToday(day)
          const selected = isSameDay(day, selectedDate)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "flex-1 px-1 py-2 text-center transition-colors",
                onDateSelect && "hover:bg-primary/5"
              )}
              style={{ width: colWidth }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums sm:h-8 sm:w-8 sm:text-base",
                  today && "bg-primary text-primary-foreground",
                  !today && selected && "bg-primary/15 text-primary",
                  !today && !selected && "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </button>
          )
        })}
      </div>

      <AllDayStrip
        days={days}
        getTasksForDate={getTasksForDate}
        onTaskClick={onTaskClick}
        colWidth={colWidth}
      />

      {/* Scrollable hour grid */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto no-scrollbar">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          <div className="w-14 shrink-0 sm:w-16">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-r border-border/40"
                style={{ height: HOUR_HEIGHT }}
              >
                {hour > 0 && (
                  <span className="absolute -top-2 right-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs">
                    {formatHourLabel(hour)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              tasks={getTasksForDate(day)}
              onTaskClick={onTaskClick}
              onSlotClick={onSlotClick}
              showNowLine={isToday(day)}
              nowMinutes={nowMinutes}
              colWidth={colWidth}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface AllDayStripProps {
  days: Date[]
  getTasksForDate: (date: Date) => Task[]
  onTaskClick: (task: Task) => void
  colWidth: string
}

function AllDayStrip({ days, getTasksForDate, onTaskClick, colWidth }: AllDayStripProps) {
  const perDay = days.map((day) => getAllDayTasks(getTasksForDate(day)))
  const hasAny = perDay.some((list) => list.length > 0)
  if (!hasAny) return null

  return (
    <div className="flex border-b border-border/60 bg-muted/30">
      <div className="flex w-14 shrink-0 items-center justify-end pr-1.5 sm:w-16">
        <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
          All-day
        </span>
      </div>
      {days.map((day, i) => (
        <div
          key={day.toISOString()}
          className="flex-1 space-y-1 border-l border-border/40 p-1"
          style={{ width: colWidth }}
        >
          {perDay[i].map((task) => {
            const color = getTaskColor(task)
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onTaskClick(task)}
                title={task.title || task.description || "Untitled"}
                className={cn(
                  "w-full truncate rounded-md border-l-2 px-1.5 py-1 text-left text-xs font-medium text-foreground transition-colors",
                  task.completed && "line-through opacity-60"
                )}
                style={{ backgroundColor: hexWithAlpha(color, 0.16), borderLeftColor: color }}
              >
                {task.title || task.description || "Untitled"}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

interface DayColumnProps {
  day: Date
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onSlotClick?: (date: Date, time: string) => void
  showNowLine: boolean
  nowMinutes: number
  colWidth: string
}

function DayColumn({
  day,
  tasks,
  onTaskClick,
  onSlotClick,
  showNowLine,
  nowMinutes,
  colWidth,
}: DayColumnProps) {
  const positioned = useMemo(() => layoutDayTasks(tasks), [tasks])

  return (
    <div
      className="relative flex-1 border-l border-border/40"
      style={{ width: colWidth }}
    >
      {SLOTS.map((minutes) => {
        const hh = String(Math.floor(minutes / 60)).padStart(2, "0")
        const mm = String(minutes % 60).padStart(2, "0")
        return (
          <button
            key={minutes}
            type="button"
            disabled={!onSlotClick}
            onClick={() => onSlotClick?.(day, `${hh}:${mm}`)}
            aria-label={`Add task at ${hh}:${mm} on ${format(day, "EEEE, MMMM d")}`}
            className={cn(
              "absolute inset-x-0 z-0 text-left focus-visible:z-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              onSlotClick && "hover:bg-accent/10",
              minutes % 60 === 0 && "border-b border-border/40"
            )}
            style={{ top: (minutes / 60) * HOUR_HEIGHT, height: HOUR_HEIGHT / 2 }}
          />
        )
      })}

      {showNowLine && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
          style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
        >
          <div className="h-2 w-2 -ml-1 rounded-full bg-red-500" />
          <div className="h-px flex-1 bg-red-500" />
        </div>
      )}

      {positioned.map((p) => {
        const top = (p.startMin / 60) * HOUR_HEIGHT
        const height = ((p.endMin - p.startMin) / 60) * HOUR_HEIGHT
        const widthPct = 100 / p.lanes
        const color = getTaskColor(p.task)
        return (
          <button
            key={p.task.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTaskClick(p.task)
            }}
            title={p.task.title || p.task.description || "Untitled"}
            className={cn(
              "absolute z-10 overflow-hidden rounded-lg border border-l-[3px] px-1.5 py-1 text-left text-foreground shadow-sm transition-shadow duration-150 hover:z-30 hover:shadow-md",
              p.task.completed && "opacity-60"
            )}
            style={{
              top,
              height: Math.max(height - 2, 18),
              left: `calc(${p.lane * widthPct}% + 2px)`,
              width: `calc(${p.span * widthPct}% - 4px)`,
              backgroundColor: hexWithAlpha(color, 0.16),
              borderColor: hexWithAlpha(color, 0.4),
              borderLeftColor: color,
            }}
          >
            <div
              className={cn(
                "truncate text-xs font-semibold leading-tight",
                p.task.completed && "line-through"
              )}
            >
              {p.task.title || p.task.description || "Untitled"}
            </div>
            {height > 30 && (
              <div className="truncate text-[11px] opacity-80">
                {formatTaskTimeRange(
                  p.task.daily_start_time,
                  p.task.daily_end_time,
                  p.task.is_anytime
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
