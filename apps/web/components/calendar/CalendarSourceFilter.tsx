"use client"

import { cn } from "@/lib/utils"

export type CalendarSource = "all" | "hengo" | "google"

const OPTIONS: { value: CalendarSource; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hengo", label: "Hengo" },
  { value: "google", label: "Google" },
]

export function CalendarSourceFilter({
  value,
  onChange,
}: {
  value: CalendarSource
  onChange: (value: CalendarSource) => void
}) {
  return (
    <div
      role="group"
      aria-label="Calendar sources"
      className="flex shrink-0 items-center rounded-lg border border-border/60 bg-muted/40 p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          title={`Show ${option.label.toLowerCase()} calendar items`}
          className={cn(
            "flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-2.5 sm:text-sm",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex h-2.5 w-2.5 shrink-0 overflow-hidden rounded-full" aria-hidden>
            {option.value === "all" ? (
              <>
                <span className="h-full w-1/2 bg-primary" />
                <span className="h-full w-1/2 bg-[#4285F4]" />
              </>
            ) : (
              <span
                className={cn(
                  "h-full w-full rounded-full",
                  option.value === "google" ? "bg-[#4285F4]" : "bg-primary",
                )}
              />
            )}
          </span>
          {option.label}
        </button>
      ))}
    </div>
  )
}
