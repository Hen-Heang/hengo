import { requireUser } from "@/lib/server/ai"
import { getGoogleOAuthClientId } from "@/lib/server/google-calendar-oauth"

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
const GOOGLE_OAUTH_AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"

export async function POST(req: Request) {
  const authed = await requireUser(req)
  if (authed instanceof Response) return authed

  let state: unknown
  try {
    ;({ state } = await req.json())
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  if (typeof state !== "string" || !/^[a-f0-9]{48}$/.test(state)) {
    return Response.json({ error: "Invalid OAuth state." }, { status: 400 })
  }

  const clientId = getGoogleOAuthClientId()
  if (!clientId) {
    return Response.json(
      {
        error:
          "Google Calendar is not configured. Add GOOGLE_CLIENT_ID (or NEXT_PUBLIC_GOOGLE_CLIENT_ID) in Vercel.",
        code: "google_client_id_missing",
      },
      { status: 503 },
    )
  }

  const redirectUri = `${new URL(req.url).origin}/integrations/google-calendar/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return Response.json({
    authorizationUrl: `${GOOGLE_OAUTH_AUTHORIZE_ENDPOINT}?${params.toString()}`,
  })
}
