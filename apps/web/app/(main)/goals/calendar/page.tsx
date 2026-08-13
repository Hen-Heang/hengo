"use client"

import dynamic from "next/dynamic"

// The calendar is heavy (date-grid + recharts-free but large). Load it on the
// client after first paint so the page shell appears immediately.
const Calendar = dynamic(
  () => import("@/components/calendar/Calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted/20" />,
  }
)

// Standalone all-task calendar. The same component is embedded in a goal's
// schedule, while this primary route opts into the full workspace treatment.
export default function CalendarPage() {
  return (
    <div className="h-full min-h-0 w-full">
      <Calendar fullBleed />
    </div>
  )
}
