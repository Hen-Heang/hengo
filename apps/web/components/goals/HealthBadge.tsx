import { GOAL_HEALTH_LABELS, getHealthStatusStyling, type GoalHealthStatus } from "@/lib/goals"
import { cn } from "@/lib/utils"

// Health status is always shown as a dot + text label together — never
// color alone (accessibility requirement: don't rely only on color).
export function HealthBadge({
  status,
  reason,
  size = "sm",
}: {
  status: GoalHealthStatus
  reason?: string | null
  size?: "sm" | "md"
}) {
  const styling = getHealthStatusStyling(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        styling.badgeColor,
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      )}
      title={reason ?? undefined}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styling.dotColor)} aria-hidden="true" />
      {GOAL_HEALTH_LABELS[status]}
    </span>
  )
}
