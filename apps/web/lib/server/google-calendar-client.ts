// Server-only Google Calendar API v3 client (Phase 6). Every function takes
// a Hengo userId and resolves a fresh access token itself via
// lib/server/google-calendar-token.ts — callers never handle tokens.
//
// Deliberately thin: plain fetch against the REST API, no googleapis SDK.
// Events are normalized to ExternalCalendarEvent before leaving this module —
// attendees, descriptions, conferencing links, and other Google-specific
// fields are never read past the raw API response, per the V1 privacy scope.
import { getValidGoogleAccessToken } from "@/lib/server/google-calendar-token"
import { recordGoogleCalendarSync } from "@/lib/server/google-calendar-store"

const CALENDAR_LIST_ENDPOINT = "https://www.googleapis.com/calendar/v3/users/me/calendarList"
const FREEBUSY_ENDPOINT = "https://www.googleapis.com/calendar/v3/freeBusy"
const MAX_EVENT_PAGES = 20 // 250/page cap → 5000 events; current-week usage never approaches this.
const MAX_RANGE_MS = 92 * 24 * 60 * 60 * 1000 // ~3 months — never sync a user's whole history.

export interface GoogleCalendarSummary {
  id: string
  summary: string
  primary: boolean
  timeZone: string
}

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

interface GoogleEventItem {
  id: string
  status?: string
  summary?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
}

async function googleGet(url: string, accessToken: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error("Google Calendar API request failed.")
  return res
}

function assertBoundedRange(timeMin: string, timeMax: string): void {
  const start = new Date(timeMin).getTime()
  const end = new Date(timeMax).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Invalid date range.")
  }
  if (end - start > MAX_RANGE_MS) {
    throw new Error("Date range too large — Google Calendar sync is limited to about 3 months at a time.")
  }
}

export function normalizeGoogleEvent(
  item: GoogleEventItem,
  calendarId: string
): ExternalCalendarEvent | null {
  if (item.status === "cancelled") return null
  const start = item.start?.dateTime ?? item.start?.date
  const end = item.end?.dateTime ?? item.end?.date
  if (!start || !end) return null

  return {
    id: item.id,
    source: "google",
    calendarId,
    title: item.summary ?? "(No title)",
    start,
    end,
    allDay: Boolean(item.start?.date),
    readOnly: true,
  }
}

export async function getCalendars(userId: string): Promise<GoogleCalendarSummary[]> {
  const accessToken = await getValidGoogleAccessToken(userId)
  const res = await googleGet(CALENDAR_LIST_ENDPOINT, accessToken)
  const data = (await res.json()) as {
    items?: { id: string; summary: string; primary?: boolean; timeZone: string }[]
  }
  return (data.items ?? []).map((item) => ({
    id: item.id,
    summary: item.summary,
    primary: Boolean(item.primary),
    timeZone: item.timeZone,
  }))
}

export interface GoogleCalendarEventsResult {
  timeZone: string
  events: ExternalCalendarEvent[]
}

// `calendarId` defaults to the connected account's primary calendar — V1's
// Planner filter is "All / Hengo / Google", not per-calendar selection.
export async function getEvents(
  userId: string,
  { timeMin, timeMax, calendarId = "primary" }: { timeMin: string; timeMax: string; calendarId?: string }
): Promise<GoogleCalendarEventsResult> {
  assertBoundedRange(timeMin, timeMax)
  const accessToken = await getValidGoogleAccessToken(userId)

  const events: ExternalCalendarEvent[] = []
  let timeZone = "UTC"
  let pageToken: string | undefined
  let page = 0

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true", // expands recurring events into their individual instances
      orderBy: "startTime",
      maxResults: "250",
    })
    if (pageToken) params.set("pageToken", pageToken)

    const res = await googleGet(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      accessToken
    )
    const data = (await res.json()) as {
      timeZone?: string
      items?: GoogleEventItem[]
      nextPageToken?: string
    }
    if (data.timeZone) timeZone = data.timeZone
    for (const item of data.items ?? []) {
      const normalized = normalizeGoogleEvent(item, calendarId)
      if (normalized) events.push(normalized)
    }
    pageToken = data.nextPageToken
    page += 1
  } while (pageToken && page < MAX_EVENT_PAGES)

  await recordGoogleCalendarSync(userId)
  return { timeZone, events }
}

export interface GoogleCalendarFreeBusyResult {
  calendarId: string
  busy: { start: string; end: string }[]
}

export async function getFreeBusy(
  userId: string,
  { timeMin, timeMax, calendarIds = ["primary"] }: { timeMin: string; timeMax: string; calendarIds?: string[] }
): Promise<GoogleCalendarFreeBusyResult[]> {
  assertBoundedRange(timeMin, timeMax)
  const accessToken = await getValidGoogleAccessToken(userId)

  const res = await fetch(FREEBUSY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ timeMin, timeMax, items: calendarIds.map((id) => ({ id })) }),
  })
  if (!res.ok) throw new Error("Google Calendar API request failed.")

  const data = (await res.json()) as {
    calendars: Record<string, { busy?: { start: string; end: string }[] }>
  }
  return calendarIds.map((calendarId) => ({
    calendarId,
    busy: data.calendars[calendarId]?.busy ?? [],
  }))
}
