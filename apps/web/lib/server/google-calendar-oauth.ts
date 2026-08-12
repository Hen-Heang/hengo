// Server-only: exchanges the Google OAuth authorization code (from
// app/(main)/integrations/google-calendar/callback) for tokens, and looks up
// which Google account was granted. Talks to Google directly over plain
// fetch — no googleapis SDK dependency for what amounts to two REST calls.
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke"
const GOOGLE_PRIMARY_CALENDAR_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary"

export interface GoogleTokenExchangeResult {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
  scope: string
}

/**
 * Calendar OAuth now prefers a server-only client id. The public id remains a
 * compatibility fallback because older deployments also use it for Google
 * sign-in. Keeping Calendar authorization server-driven means the connect
 * button no longer fails just because NEXT_PUBLIC_GOOGLE_CLIENT_ID was omitted
 * from a production build.
 */
export function getGoogleOAuthClientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null
}

// Thrown when Google rejects a refresh_token grant (revoked/expired) —
// distinct from a transient failure, since the fix is "the user reconnects",
// not "retry the request".
export class GoogleCalendarReauthRequiredError extends Error {
  constructor() {
    super("Google Calendar access was revoked or expired; reconnect required.")
    this.name = "GoogleCalendarReauthRequiredError"
  }
}

export async function exchangeGoogleAuthCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenExchangeResult> {
  const clientId = getGoogleOAuthClientId()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar is not configured on the server.")
  }

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    // Google's error body is {error, error_description} — never token values
    // — but we still don't forward it verbatim to callers/logs.
    const body = await res.json().catch(() => null)
    console.error("Google token exchange failed", { status: res.status, error: body?.error })
    throw new Error("Google rejected the Calendar authorization request.")
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope,
  }
}

export interface GoogleTokenRefreshResult {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}

export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<GoogleTokenRefreshResult> {
  const clientId = getGoogleOAuthClientId()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar is not configured on the server.")
  }

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    if (res.status === 400 && body?.error === "invalid_grant") {
      throw new GoogleCalendarReauthRequiredError()
    }
    console.error("Google token refresh failed", { status: res.status, error: body?.error })
    throw new Error("Could not refresh the Google Calendar connection.")
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    // Google only rotates the refresh token occasionally; absence here does
    // not mean the old one is invalid.
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}

// Revoking either the access or refresh token invalidates the whole grant at
// Google. Best-effort: disconnect (Phase 9) must still remove Hengo's own
// stored credentials even if Google's revoke endpoint is unreachable.
export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch(GOOGLE_REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    })
  } catch {
    // Ignored — see comment above.
  }
}

// The primary calendar's `id` is the connected account's email address —
// this reads it using only the calendar.readonly scope we already requested,
// instead of asking Google for an additional identity/email scope.
export async function fetchPrimaryCalendarEmail(accessToken: string): Promise<string> {
  const res = await fetch(GOOGLE_PRIMARY_CALENDAR_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("Could not read the connected Google account.")
  const data = (await res.json()) as { id: string }
  return data.id
}
