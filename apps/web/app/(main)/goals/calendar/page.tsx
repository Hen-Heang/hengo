"use client"

import dynamic from "next/dynamic"

import { GoalsHubNav } from "@/components/goals/hub/GoalsHubNav"

// The calendar is heavy (date-grid + recharts-free but large). Load it on the
// client after first paint so the page shell appears immediately.
const Calendar = dynamic(
  () => import("@/components/calendar/Calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-muted/20" />,
  }
)

// Standalone personal-tasks calendar (goal_id = null). Ports Orbit
// routes/calendar.tsx — the same Calendar component is embedded in the goal
// detail Tasks tab. Realtime/PWA/gcal seams are deferred (see INTEGRATION.md).
// The Calendar tab of the Goals hub — see GoalsHubNav.
export default function CalendarPage() {
  return (
    <div className="space-y-3 pb-2 sm:space-y-4">
      <GoalsHubNav />
      <div className="h-[calc(100dvh-13.5rem)] min-h-[520px] sm:h-[calc(100dvh-11rem)]">
        <Calendar />
      </div>
    </div>
  )
}
