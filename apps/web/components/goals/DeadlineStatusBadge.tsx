"use client"

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Timer,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  type GoalDeadlineInfo,
  getDeadlineStatusIcon,
  getDeadlineStatusStyling,
} from "@/lib/goals"

// Ported from Orbit components/ui/deadline-status-badge.tsx. The optional
// progress bar is inlined (no separate Progress primitive needed).
const iconMap = { CheckCircle2, AlertTriangle, Clock, Timer, Target, Calendar }

interface DeadlineStatusBadgeProps {
  deadlineInfo: GoalDeadlineInfo
  showProgress?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DeadlineStatusBadge({
  deadlineInfo,
  showProgress = false,
  size = "md",
  className,
}: DeadlineStatusBadgeProps) {
  const styling = getDeadlineStatusStyling(deadlineInfo.status, deadlineInfo.urgencyLevel)
  const iconName = getDeadlineStatusIcon(deadlineInfo.status)
  const IconComponent = iconMap[iconName as keyof typeof iconMap]

  const sizeClasses = {
    sm: "text-xs px-2 py-1 h-6",
    md: "text-sm px-3 py-1.5 h-7",
    lg: "text-base px-4 py-2 h-8",
  }
  const iconSizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Badge
        className={cn(
          "flex items-center gap-1.5 rounded-full backdrop-blur-sm transition-all duration-200",
          styling.badgeColor,
          sizeClasses[size]
        )}
      >
        <IconComponent className={cn(iconSizes[size], styling.iconColor)} />
        <span className="font-medium">{deadlineInfo.statusMessage}</span>
      </Badge>

      {showProgress && deadlineInfo.status !== "completed" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn("h-full rounded-full", styling.progressColor)}
              style={{ width: `${deadlineInfo.progressPercentage}%` }}
            />
          </div>
          <span className="min-w-fit">{Math.round(deadlineInfo.progressPercentage)}%</span>
        </div>
      )}
    </div>
  )
}
