import { KOREAN_COACH_SCENARIOS } from "@/lib/korean-coach/scenarios"
import { coachDataResponse, requireCoachUser } from "@/lib/server/korean-coach/http"

export async function GET(req: Request): Promise<Response> {
  const auth = await requireCoachUser(req)
  if (auth instanceof Response) return auth
  return coachDataResponse(KOREAN_COACH_SCENARIOS)
}
