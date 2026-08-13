// Raw Google FreeBusy blocks for the Phase 8 free-time widget. Deliberately
// returns only {start, end} instants — never event titles/details — since
// this route's entire purpose is busy/free, not calendar display (that's
// the /events route). Not connected / needs reconnect degrade to an empty
// busy list rather than an error: "no Google connection" just means no
// additional busy time to account for.
import { requireUser } from "@/lib/server/ai"
import { getFreeBusy } from "@/lib/server/google-calendar-client"

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
    const [result] = await getFreeBusy(user.id, { timeMin, timeMax })
    return Response.json({ busy: result?.busy ?? [] })
  } catch {
    return Response.json({ busy: [] })
  }
}
