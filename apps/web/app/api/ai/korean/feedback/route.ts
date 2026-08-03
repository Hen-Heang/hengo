import { feedbackRequestSchema } from "@/lib/korean-coach/schemas"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import { CoachServiceError } from "@/lib/server/korean-coach/errors"
import { generateKoreanTutorFeedback } from "@/lib/server/korean-coach/feedback"
import {
  coachDataResponse,
  coachErrorResponse,
  requireCoachUser,
  simpleCoachError,
} from "@/lib/server/korean-coach/http"

export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireCoachUser(req)
  if (auth instanceof Response) return auth

  const rate = await checkRateLimit(auth.db, auth.user.id, "korean_coach_feedback")
  if (!rate.allowed) {
    return simpleCoachError(
      "RATE_LIMITED",
      `Daily feedback limit reached (${rate.limit}/day). Try again tomorrow.`,
      429,
      true,
    )
  }

  const raw = await req.json().catch(() => null)
  const input = feedbackRequestSchema.safeParse(raw)
  if (!input.success) {
    return simpleCoachError("INVALID_REQUEST", "Check your answer and try again.", 400)
  }

  try {
    const result = await generateKoreanTutorFeedback(input.data)
    void recordUsage(auth.db, {
      userId: auth.user.id,
      feature: "korean_coach_feedback",
      model: result.model,
      latencyMs: Math.round(performance.now() - startedAt),
      success: true,
    })
    return coachDataResponse(result.feedback, result.mode)
  } catch (error) {
    const safe =
      error instanceof CoachServiceError
        ? error.safe
        : {
            code: "FEEDBACK_FAILED" as const,
            message: "We could not prepare feedback. Please try again.",
            retryable: true,
            status: 502,
          }
    void recordUsage(auth.db, {
      userId: auth.user.id,
      feature: "korean_coach_feedback",
      model: "unknown",
      latencyMs: Math.round(performance.now() - startedAt),
      success: false,
      errorCode: safe.code,
    })
    return coachErrorResponse(safe)
  }
}

