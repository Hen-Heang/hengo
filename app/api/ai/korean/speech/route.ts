import { speechRequestSchema } from "@/lib/korean-coach/schemas"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import { CoachServiceError } from "@/lib/server/korean-coach/errors"
import {
  coachErrorResponse,
  requireCoachUser,
  simpleCoachError,
} from "@/lib/server/korean-coach/http"
import { generateKoreanSpeech } from "@/lib/server/korean-coach/speech"

export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireCoachUser(req)
  if (auth instanceof Response) return auth

  const rate = await checkRateLimit(auth.db, auth.user.id, "korean_coach_speech")
  if (!rate.allowed) {
    return simpleCoachError(
      "RATE_LIMITED",
      `Daily speech limit reached (${rate.limit}/day). Continue with the transcript or try tomorrow.`,
      429,
      true,
    )
  }

  const raw = await req.json().catch(() => null)
  const input = speechRequestSchema.safeParse(raw)
  if (!input.success) {
    return simpleCoachError("INVALID_REQUEST", "The speech request is invalid.", 400)
  }

  try {
    const result = await generateKoreanSpeech(input.data.text, input.data.speed)
    void recordUsage(auth.db, {
      userId: auth.user.id,
      feature: "korean_coach_speech",
      model: result.model,
      latencyMs: Math.round(performance.now() - startedAt),
      success: true,
    })
    if (result.mode === "mock") {
      return new Response(null, {
        status: 204,
        headers: {
          "X-Hengo-AI-Mode": "mock",
          "X-Hengo-Voice": "browser-preview",
        },
      })
    }
    return new Response(result.audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Hengo-AI-Mode": "live",
        "X-Hengo-Voice": "ai-generated",
      },
    })
  } catch (error) {
    const safe =
      error instanceof CoachServiceError
        ? error.safe
        : {
            code: "SPEECH_FAILED" as const,
            message: "We could not generate the voice. You can continue with the transcript.",
            retryable: true,
            status: 502,
          }
    void recordUsage(auth.db, {
      userId: auth.user.id,
      feature: "korean_coach_speech",
      model: "unknown",
      latencyMs: Math.round(performance.now() - startedAt),
      success: false,
      errorCode: safe.code,
    })
    return coachErrorResponse(safe)
  }
}

