"use client"

import { isSameDay, isToday } from "date-fns"

import { cn } from "@/lib/utils"
import type { Task } from "@/lib/tasks"
import { getTaskColor } from "@/lib/tasks"

interface MonthViewProps {
  currentMonth: Date
  selectedDate?: Date
  onDateChange: (date: Date) => void
  getTasksForDate: (date: Date) => Task[]
  onTaskClick?: (task: Task) => void
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getDaysInMonth(currentMonth: Date): Date[] {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const totalCellsNeeded = daysInMonth + startingDayOfWeek
  const rowCount = totalCellsNeeded <= 28 ? 4 : totalCellsNeeded >= 36 ? 6 : 5
  const totalCells = rowCount * 7

  const days: Date[] = []
  // Leading days from the previous month (greyed out).
  for (let i = 0; i < startingDayOfWeek; i++) {
    const d = new Date(year, month, 0 - (startingDayOfWeek - i - 1))
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  const maxDays = Math.min(daysInMonth, totalCells - startingDayOfWeek)
  for (let i = 1; i <= maxDays; i++) {
    const d = new Date(year, month, i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  while (days.length < totalCells) {
    const d = new Date(year, month + 1, days.length - startingDayOfWeek - maxDays + 1)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

export function MonthView({
  currentMonth,
  selectedDate,
  onDateChange,
  getTasksForDate,
  onTaskClick,
}: MonthViewProps) {
  const days = getDaysInMonth(currentMonth)
  const rowCount = days.length / 7

  return (
    <div className="flex h-full w-full flex-col p-1 sm:p-2">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-sm">
        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30 text-center">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "py-3 text-[11px] font-bold uppercase tracking-wide",
                i === 0 || i === 6 ? "text-muted-foreground" : "text-muted-foreground"
              )}
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div
          className="grid flex-1 grid-cols-7"
          style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
        >
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const today = isToday(date)
            const dayTasks = isCurrentMonth ? getTasksForDate(date) : []

            return (
              <div
                key={index}
                onClick={() => isCurrentMonth && onDateChange(date)}
                onKeyDown={(e) => {
                  if (isCurrentMonth && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onDateChange(date)
                  }
                }}
                role={isCurrentMonth ? "button" : undefined}
                tabIndex={isCurrentMonth ? 0 : undefined}
                aria-pressed={isCurrentMonth ? isSelected : undefined}
                aria-label={isCurrentMonth ? date.toLocaleDateString(undefined, { month: "long", day: "numeric" }) : undefined}
                className={cn(
                  "relative flex min-h-[80px] flex-col gap-1 border-b border-r border-border/50 p-1.5 transition-colors sm:min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  index % 7 === 0 && "border-l",
                  Math.floor(index / 7) === 0 && "border-t",
                  !isCurrentMonth && "cursor-default bg-muted/10 opacity-30",
                  isCurrentMonth && "cursor-pointer hover:bg-muted/20",
                  isSelected && "bg-primary/5"
                )}
              >
                <div className="mb-1 flex justify-center">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all",
                      today && !isSelected && "bg-primary text-primary-foreground shadow",
                      isSelected && "scale-110 bg-primary/90 text-primary-foreground shadow",
                      !today && !isSelected && "text-muted-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {isCurrentMonth && (
                  <div className="flex flex-1 flex-col justify-end gap-1">
                    {/* Mobile: dots */}
                    <div className="flex h-1.5 flex-wrap justify-center gap-0.5 px-1 sm:hidden">
                      {dayTasks.slice(0, 4).map((task, i) => (
                        <span
                          key={i}
                          className={cn("h-1 w-1 rounded-full", task.completed && "opacity-40")}
                          style={{ backgroundColor: getTaskColor(task) }}
                        />
                      ))}
                      {dayTasks.length > 4 && (
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                    {/* Desktop: chips */}
                    <div className="hidden flex-col gap-0.5 overflow-hidden sm:flex">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          title={task.title || task.description}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick?.(task)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              e.stopPropagation()
                              onTaskClick?.(task)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={task.title || task.description}
                          className={cn(
                            "mx-0.5 flex cursor-pointer items-center gap-1 truncate rounded-md border border-l-2 px-2 py-1 text-[9px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                            task.completed
                              ? "bg-muted/40 text-muted-foreground line-through opacity-60"
                              : "bg-muted/30 text-foreground/80 hover:bg-muted/60"
                          )}
                          style={{ borderLeftColor: getTaskColor(task) }}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: getTaskColor(task) }}
                          />
                          <span className="truncate">{task.title || task.description}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-center text-[9px] font-medium text-muted-foreground">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
