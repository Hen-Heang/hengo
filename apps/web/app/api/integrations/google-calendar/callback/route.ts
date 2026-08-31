// Trusted server-side endpoint Phase 3's callback page posts the Google
// authorization `code` to. Never receives or returns token values to the
// browser — it exchanges the code with Google itself and persists the
// result via lib/server/google-calendar-store.ts (service-role, encrypted).
import { requireUser } from "@/lib/server/ai"
import {
  exchangeGoogleAuthCode,
  fetchPrimaryCalendarEmail,
} from "@/lib/server/google-calendar-oauth"
import { storeGoogleCalendarTokens } from "@/lib/server/google-calendar-store"

export async function POST(req: Request) {
  const authed = await requireUser(req)
  if (authed instanceof Response) return authed
  const { user } = authed

  let code: unknown
  try {
    ;({ code } = await req.json())
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  if (typeof code !== "string" || !code) {
    return Response.json({ error: "Missing authorization code." }, { status: 400 })
  }

  const redirectUri = `${new URL(req.url).origin}/integrations/google-calendar/callback`

  try {
    const tokens = await exchangeGoogleAuthCode(code, redirectUri)
    const accountEmail = await fetchPrimaryCalendarEmail(tokens.accessToken)

    await storeGoogleCalendarTokens({
      userId: user.id,
      accountEmail,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scope,
    })

    return Response.json({ ok: true, accountEmail })
  } catch {
    // Sanitized: never surface Google's raw error body or token values.
    return Response.json({ error: "Could not connect Google Calendar." }, { status: 502 })
  }
}
