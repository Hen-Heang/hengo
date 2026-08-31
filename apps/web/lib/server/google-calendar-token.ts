// Server-only token refresh (Phase 5). The only public entry point is
// getValidGoogleAccessToken — every Google Calendar API call (lib/server/
// google-calendar-client.ts) goes through it instead of reading stored
// tokens directly, so callers never have to think about expiry themselves.
import {
  GoogleCalendarReauthRequiredError,
  refreshGoogleAccessToken,
} from "@/lib/server/google-calendar-oauth"
import {
  getGoogleCalendarTokens,
  markGoogleCalendarIntegrationError,
  updateGoogleCalendarAccessToken,
} from "@/lib/server/google-calendar-store"

export { GoogleCalendarReauthRequiredError }

export class GoogleCalendarNotConnectedError extends Error {
  constructor() {
    super("No Google Calendar connection for this user.")
    this.name = "GoogleCalendarNotConnectedError"
  }
}

// Refresh a little before actual expiry so a token doesn't die mid-request.
const EXPIRY_BUFFER_MS = 60_000

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const tokens = await getGoogleCalendarTokens(userId)
  if (!tokens) throw new GoogleCalendarNotConnectedError()

  const expiresAt = new Date(tokens.expiresAt).getTime()
  if (expiresAt - Date.now() > EXPIRY_BUFFER_MS) {
    return tokens.accessToken
  }

  if (!tokens.refreshToken) {
    await markGoogleCalendarIntegrationError(userId)
    throw new GoogleCalendarReauthRequiredError()
  }

  try {
    const refreshed = await refreshGoogleAccessToken(tokens.refreshToken)
    await updateGoogleCalendarAccessToken({
      userId,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
    })
    return refreshed.accessToken
  } catch (err) {
    if (err instanceof GoogleCalendarReauthRequiredError) {
      await markGoogleCalendarIntegrationError(userId)
    }
    throw err
  }
}
