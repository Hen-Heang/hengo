// Client-safe shared types for external (Google) calendar events. Kept
// separate from lib/server/google-calendar-client.ts (which has the same
// interface) so this file can be imported from browser code — the server
// module pulls in Node's `crypto` and can't be bundled client-side.
import { subDays } from "date-fns"

import { formatYMD, parseYMD } from "@/lib/calendar"
import type { Task } from "@/lib/tasks"

export interface ExternalCalendarEvent {
  id: string
  source: "google"
  calendarId: string
  title: string
  start: string
  end: string
  allDay: boolean
  readOnly: true
}

// Distinct from every TASK_COLOR_PRESETS swatch (lib/tasks.ts) so a Google
// event is never confusable with a Hengo task by color alone.
export const GOOGLE_CALENDAR_COLOR = "#4285F4"

function timeOfDay(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`
}

// Google's all-day `end.date` is exclusive (the day *after* the event ends);
// Hengo's Task.end_date is treated as inclusive by lib/calendar.ts's date-range
// filtering, so a raw pass-through would make the event appear one day too long.
function inclusiveAllDayEnd(end: string): string {
  const parsed = parseYMD(end)
  return parsed ? formatYMD(subDays(parsed, 1)) : end
}

// Adapts a Google event into the shape every calendar view already knows how
// to render (Task), instead of teaching each view a second data shape. The
// `externalSource` marker is what those views use to disable completion/edit/
// delete affordances and show the read-only treatment.
export function toCalendarTask(event: ExternalCalendarEvent): Task {
  return {
    id: `google:${event.id}`,
    description: "",
    completed: false,
    user_id: "",
    title: event.title,
    start_date: event.start,
    end_date: event.allDay ? inclusiveAllDayEnd(event.end) : event.end,
    daily_start_time: event.allDay ? null : timeOfDay(event.start),
    daily_end_time: event.allDay ? null : timeOfDay(event.end),
    is_anytime: event.allDay,
    duration_minutes: null,
    color: GOOGLE_CALENDAR_COLOR,
    tags: [],
    externalSource: "google",
  }
}
