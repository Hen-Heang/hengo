import {
  KOREAN_COACH_MAX_AUDIO_BYTES,
  validateAudioInput,
} from "@/lib/korean-coach/audio"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import { CoachServiceError } from "@/lib/server/korean-coach/errors"
import {
  coachDataResponse,
  coachErrorResponse,
  requireCoachUser,
  simpleCoachError,
} from "@/lib/server/korean-coach/http"
import { transcribeKoreanAudio } from "@/lib/server/korean-coach/transcription"

export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireCoachUser(req)
  if (auth instanceof Response) return auth

  const rate = await checkRateLimit(auth.db, auth.user.id, "korean_coach_transcription")
  if (!rate.allowed) {
    return simpleCoachError(
      "RATE_LIMITED",
      `Daily transcription limit reached (${rate.limit}/day). Try again tomorrow or use text input.`,
      429,
      true,
    )
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0")
  if (
    Number.isFinite(contentLength) &&
    contentLength > KOREAN_COACH_MAX_AUDIO_BYTES + 1024 * 1024
  ) {
    return simpleCoachError(
      "AUDIO_TOO_LARGE",
      "The recording is too large. Keep your answer short and try again.",
      413,
    )
  }

  const formData = await req.formData().catch(() => null)
  const audio = formData?.get("audio")
  if (!(audio instanceof File)) {
    return simpleCoachError("EMPTY_AUDIO", "Choose or record an audio answer first.", 400)
  }
  const durationValue = formData?.get("durationMs")
  const durationMs =
    typeof durationValue === "string" && /^\d+$/.test(durationValue)
      ? Number(durationValue)
      : undefined
  const validation = validateAudioInput({ size: audio.size, type: audio.type, durationMs })
  if (!validation.valid) {
    const code =
      validation.code === "audio_too_large"
        ? "AUDIO_TOO_LARGE"
        : validation.code === "unsupported_audio_format"
          ? "UNSUPPORTED_AUDIO_FORMAT"
          : validation.code === "recording_too_short"
            ? "RECORDING_TOO_SHORT"
            : "EMPTY_AUDIO"
    return simpleCoachError(code, validation.message ?? "Invalid audio recording.", 400)
  }

  try {
    const result = await transcribeKoreanAudio(audio)
    void recordUsage(auth.db, {
      userId: auth.user.id,
      feature: "korean_coach_transcription",
      model: result.model,
      latencyMs: Math.round(performance.now() - startedAt),
      success: true,
    })
    return coachDataResponse({ transcript: result.transcript }, result.mode)
  } catch (error) {
    const safe =
      error instanceof CoachServiceError
        ? error.safe
        : {
            code: "TRANSCRIPTION_FAILED" as const,
            message: "We could not transcribe that recording. Please try again or use text input.",
            retryable: true,
            status: 502,
          }
    void recordUsage(auth.db, {
      userId: auth.user.id,
      feature: "korean_coach_transcription",
      model: "unknown",
      latencyMs: Math.round(performance.now() - startedAt),
      success: false,
      errorCode: safe.code,
    })
    return coachErrorResponse(safe)
  }
}
