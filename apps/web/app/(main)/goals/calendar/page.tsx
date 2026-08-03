"use client"

import dynamic from "next/dynamic"

import { PageHero } from "@/components/app/page-hero"

// The calendar is heavy (date-grid + recharts-free but large). Load it on the
// client after first paint so the page shell appears immediately.
const Calendar = dynamic(
  () => import("@/components/calendar/Calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-muted/20" />,
  }
)

// Standalone personal-tasks calendar (goal_id = null). Ports Orbit
// routes/calendar.tsx — the same Calendar component is embedded in the goal
// detail Tasks tab. Realtime/PWA/gcal seams are deferred (see INTEGRATION.md).
export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Planner"
        title="Calendar"
        description="Schedule and review your tasks across day, week, and month views."
      />
      <div className="h-[calc(100dvh-13rem)] min-h-[520px]">
        <Calendar />
      </div>
    </div>
  )
}
