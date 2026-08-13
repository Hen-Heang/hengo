// Phase 9 — disconnect Google Calendar. Revokes the grant at Google
// (best-effort) and deletes Hengo's stored credentials. Never touches the
// user's Hengo session or their Google *login* identity — those are
// unrelated to this integration (see lib/api/integrations.ts).
import { requireUser } from "@/lib/server/ai"
import { revokeGoogleToken } from "@/lib/server/google-calendar-oauth"
import { deleteGoogleCalendarIntegration, getGoogleCalendarTokens } from "@/lib/server/google-calendar-store"

export async function POST(req: Request) {
  const authed = await requireUser(req)
  if (authed instanceof Response) return authed
  const { user } = authed

  try {
    const tokens = await getGoogleCalendarTokens(user.id).catch(() => null)
    // Revoking the refresh token invalidates the whole grant; fall back to
    // the access token only if no refresh token was ever stored.
    const tokenToRevoke = tokens?.refreshToken ?? tokens?.accessToken
    if (tokenToRevoke) await revokeGoogleToken(tokenToRevoke)

    await deleteGoogleCalendarIntegration(user.id)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Could not disconnect Google Calendar." }, { status: 500 })
  }
}
