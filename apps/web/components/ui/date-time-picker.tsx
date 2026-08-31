"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Lightweight replacement for Orbit's AriaDateTimePicker. Same prop shape so
// ported forms/dialogs work unchanged, but backed by a native date/datetime
// input instead of react-aria-components + @internationalized/date.
// JS Date <-> input-string conversion is isolated here; callers keep using Date.

interface DateTimePickerProps {
  value: Date | null
  onChange: (value: Date | null) => void
  granularity?: "day" | "minute"
  min?: Date
  max?: Date
  className?: string
  disabled?: boolean
  id?: string
}

// Format a Date into the value a native date / datetime-local input expects,
// using local time (not UTC) so the displayed day matches the user's clock.
function toInputValue(date: Date | null, withTime: boolean): string {
  if (!date || isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  if (!withTime) return d
  return `${d}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function DateTimePicker({
  value,
  onChange,
  granularity = "day",
  min,
  max,
  className,
  disabled,
  id,
}: DateTimePickerProps) {
  const withTime = granularity === "minute"

  return (
    <input
      id={id}
      type={withTime ? "datetime-local" : "date"}
      aria-label={id ? undefined : withTime ? "Date and time" : "Date"}
      disabled={disabled}
      value={toInputValue(value, withTime)}
      min={min ? toInputValue(min, withTime) : undefined}
      max={max ? toInputValue(max, withTime) : undefined}
      onChange={(e) => {
        const v = e.target.value
        if (!v) {
          onChange(null)
          return
        }
        // Native inputs yield local-time strings; `new Date(v)` parses them as local.
        const parsed = new Date(v)
        onChange(isNaN(parsed.getTime()) ? null : parsed)
      }}
      className={cn(
        "flex h-11 min-h-[44px] w-full items-center rounded-lg border border-border bg-background px-3 py-2 text-base shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]",
        className,
      )}
    />
  )
}
