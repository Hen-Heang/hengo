// Server-side read of a Hengo user's Google Calendar events for the Planner
// (Phase 7). Never exposed to the browser: tokens. Only the normalized
// ExternalCalendarEvent DTO (lib/external-calendar.ts) leaves this route.
import { requireUser } from "@/lib/server/ai"
import { getEvents } from "@/lib/server/google-calendar-client"
import { GoogleCalendarNotConnectedError, GoogleCalendarReauthRequiredError } from "@/lib/server/google-calendar-token"

export async function GET(req: Request) {
  const authed = await requireUser(req)
  if (authed instanceof Response) return authed
  const { user } = authed

  const url = new URL(req.url)
  const timeMin = url.searchParams.get("timeMin")
  const timeMax = url.searchParams.get("timeMax")
  if (!timeMin || !timeMax) {
    return Response.json({ error: "timeMin and timeMax are required." }, { status: 400 })
  }

  try {
    const result = await getEvents(user.id, { timeMin, timeMax })
    return Response.json(result)
  } catch (err) {
    // Not connected / needs reconnect are ordinary states, not server errors —
    // the Planner just shows no Google events until the user (re)connects.
    if (err instanceof GoogleCalendarNotConnectedError) {
      return Response.json({ error: "not_connected" }, { status: 404 })
    }
    if (err instanceof GoogleCalendarReauthRequiredError) {
      return Response.json({ error: "reauth_required" }, { status: 409 })
    }
    return Response.json({ error: "Could not load Google Calendar events." }, { status: 502 })
  }
}
