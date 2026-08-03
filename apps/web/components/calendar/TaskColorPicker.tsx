"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { TASK_COLORS } from "@/lib/tasks"

interface TaskColorPickerProps {
  value?: string | null
  onChange: (value: string) => void
  className?: string
}

/** A row of color swatches for tagging a task with a custom color. */
export function TaskColorPicker({ value, onChange, className }: TaskColorPickerProps) {
  const current = (value || "").toLowerCase()
  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {TASK_COLORS.map((c) => {
        const selected = current === c.value.toLowerCase()
        return (
          <button
            key={c.value}
            type="button"
            title={c.name}
            aria-label={c.name}
            aria-pressed={selected}
            onClick={() => onChange(c.value)}
            className="relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: c.value,
              boxShadow: selected
                ? `0 0 0 2px var(--background, #fff), 0 0 0 4px ${c.value}`
                : "inset 0 0 0 1px rgba(0,0,0,0.12)",
            }}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}
