import { isKoreanCoachMockMode } from "@/lib/korean-coach/mock"
import type { SpeechSpeed } from "@/lib/korean-coach/schemas"
import { KOREAN_COACH_SPEECH_TIMEOUT_MS, KOREAN_COACH_TTS_MODEL } from "./config"
import { CoachServiceError, sanitizeProviderError } from "./errors"

export interface SpeechResult {
  audio: ArrayBuffer | null
  model: string
  mode: "live" | "mock"
}

export async function generateKoreanSpeech(
  text: string,
  speed: SpeechSpeed,
): Promise<SpeechResult> {
  if (isKoreanCoachMockMode()) {
    return { audio: null, model: "browser-speech-mock", mode: "mock" }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new CoachServiceError({
      code: "AI_NOT_CONFIGURED",
      message: "Korean Coach is not configured. Add OPENAI_API_KEY or enable explicit mock mode.",
      retryable: false,
      status: 503,
    })
  }

  try {
    const body: Record<string, unknown> = {
      model: KOREAN_COACH_TTS_MODEL,
      voice: "alloy",
      input: text,
      speed,
      response_format: "mp3",
    }
    // The current tts-1 / tts-1-hd models support speed but not style
    // instructions. Keep the service compatible with a configurable newer
    // speech model without sending an unsupported field to the stable default.
    if (!["tts-1", "tts-1-hd"].includes(KOREAN_COACH_TTS_MODEL)) {
      body.instructions =
        "Speak natural Korean in a patient tutor voice. Enunciate every syllable clearly. Use a calm, friendly tone and a steady pace suitable for a beginner listening exercise."
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(KOREAN_COACH_SPEECH_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new CoachServiceError({
        code: response.status === 429 ? "RATE_LIMITED" : "SPEECH_FAILED",
        message:
          response.status === 429
            ? "The speech limit was reached. Please wait and try again."
            : "We could not generate the voice. You can continue with the transcript.",
        retryable: true,
        status: response.status === 429 ? 429 : 502,
      })
    }
    return {
      audio: await response.arrayBuffer(),
      model: KOREAN_COACH_TTS_MODEL,
      mode: "live",
    }
  } catch (error) {
    throw new CoachServiceError(sanitizeProviderError(error, "SPEECH_FAILED"), {
      cause: error,
    })
  }
}
