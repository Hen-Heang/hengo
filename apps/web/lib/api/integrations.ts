// Settings > Integrations. Google Calendar is a read-only OAuth grant kept
// deliberately separate from Google *login* (lib/api/auth.ts, lib/google-auth.ts):
// this is authorized directly against Google, not through Supabase Auth's
// identity system. `supabase.auth.linkIdentity("google", ...)` fails with
// "already linked" for anyone who has ever used the Google login button (it
// already holds a `google` identity); reusing `signInWithOAuth` for scope
// escalation risks disturbing the existing session/identity depending on the
// project's account-linking settings. Talking to Google's OAuth endpoints
// ourselves avoids both — the current Hengo session only identifies which
// user is connecting, it never mediates the Google grant itself.
import { getUserId } from "@/lib/auth-store"
import { supabase } from "@/lib/supabase"
import type { ExternalCalendarEvent } from "@/lib/external-calendar"

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
const GOOGLE_OAUTH_AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const OAUTH_STATE_STORAGE_KEY = "hengo:gcal-oauth-state"

export interface GoogleCalendarIntegrationStatus {
  connected: boolean
  accountEmail: string | null
  lastSyncedAt: string | null
}

export interface GoogleCalendarEventsResult {
  timeZone: string
  events: ExternalCalendarEvent[]
}

function generateOAuthState(): string {
  const random = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("")
}

// Every route under app/api/integrations/google-calendar/* is a normal
// requireUser route (like the AI routes), so it needs the caller's Supabase
// access token as a bearer header — supabase-js doesn't attach this to
// same-origin fetches on its own the way it does to its own PostgREST calls.
async function authedFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) return null
  return fetch(path, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
  })
}

export const integrationsApi = {
  // Reads only the safe metadata columns — the migration revokes column-level
  // SELECT on the token ciphertext columns from `authenticated`, so this can
  // never come back with token data even if the query were changed to `*`.
  getGoogleCalendarStatus: async (): Promise<GoogleCalendarIntegrationStatus> => {
    const userId = getUserId()
    if (!userId) return { connected: false, accountEmail: null, lastSyncedAt: null }

    const { data, error } = await supabase
      .from("kori_google_calendar_integrations")
      .select("provider_account_email, status, last_synced_at")
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (!data || data.status !== "active") {
      return { connected: false, accountEmail: null, lastSyncedAt: null }
    }
    return {
      connected: true,
      accountEmail: data.provider_account_email,
      lastSyncedAt: data.last_synced_at,
    }
  },

  // Reads normalized, read-only Google Calendar events for the Planner
  // (app/(main)/goals/calendar) via the server route, which resolves a fresh
  // access token itself — the browser never sees one. Callers should treat
  // any rejection as "no Google events right now" rather than a hard error;
  // the calendar must keep working when disconnected or mid-reauth.
  getGoogleCalendarEvents: async (timeMin: string, timeMax: string): Promise<GoogleCalendarEventsResult> => {
    const params = new URLSearchParams({ timeMin, timeMax })
    const res = await authedFetch(`/api/integrations/google-calendar/events?${params}`)
    if (!res) throw new Error("Google Calendar requires an active Hengo session.")
    if (!res.ok) throw new Error("Google Calendar events could not be refreshed.")
    return res.json()
  },

  // Raw Google busy blocks for the Phase 8 free-time widget — see
  // lib/free-time.ts for how these combine with Hengo tasks. Same
  // fail-open behavior as getGoogleCalendarEvents.
  getGoogleCalendarFreeBusy: async (
    timeMin: string,
    timeMax: string
  ): Promise<{ start: string; end: string }[]> => {
    const params = new URLSearchParams({ timeMin, timeMax })
    const res = await authedFetch(`/api/integrations/google-calendar/freebusy?${params}`)
    if (!res || !res.ok) return []
    const json = await res.json()
    return json.busy ?? []
  },

  // Redirects the browser to Google's consent screen.
  connectGoogleCalendar: () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error("Google Calendar is not configured (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID).")
    }
    if (!getUserId()) throw new Error("Not signed in.")

    const state = generateOAuthState()
    sessionStorage.setItem(OAUTH_STATE_STORAGE_KEY, state)

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/integrations/google-calendar/callback`,
      response_type: "code",
      scope: GOOGLE_CALENDAR_SCOPE,
      access_type: "offline",
      prompt: "consent",
      state,
    })
    window.location.assign(`${GOOGLE_OAUTH_AUTHORIZE_ENDPOINT}?${params.toString()}`)
  },

  // Revokes the grant at Google and deletes Hengo's stored credentials.
  // Never signs the user out of Hengo or touches their Google login identity.
  disconnectGoogleCalendar: async (): Promise<void> => {
    const res = await authedFetch("/api/integrations/google-calendar/disconnect", { method: "POST" })
    if (!res) throw new Error("Not signed in.")
    if (!res.ok) throw new Error("Could not disconnect Google Calendar.")
  },
}
