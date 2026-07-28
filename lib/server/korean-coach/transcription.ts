import { isKoreanCoachMockMode } from "@/lib/korean-coach/mock"
import {
  KOREAN_COACH_TRANSCRIBE_MODEL,
  KOREAN_COACH_TRANSCRIPTION_TIMEOUT_MS,
} from "./config"
import { CoachServiceError, sanitizeProviderError } from "./errors"

export interface TranscriptionResult {
  transcript: string
  model: string
  mode: "live" | "mock"
}

export async function transcribeKoreanAudio(file: File): Promise<TranscriptionResult> {
  if (isKoreanCoachMockMode()) {
    return {
      transcript: "마감일 언제 있어요?",
      model: "mock-transcription",
      mode: "mock",
    }
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
    const formData = new FormData()
    formData.set("file", file, file.name || "answer.webm")
    formData.set("model", KOREAN_COACH_TRANSCRIBE_MODEL)
    formData.set("language", "ko")
    formData.set(
      "prompt",
      "한국어 회화 연습입니다. 직장, 소프트웨어 개발, 일상생활에 관한 짧은 해요체 답변입니다.",
    )

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
      signal: AbortSignal.timeout(KOREAN_COACH_TRANSCRIPTION_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new CoachServiceError({
        code: response.status === 429 ? "RATE_LIMITED" : "TRANSCRIPTION_FAILED",
        message:
          response.status === 429
            ? "The transcription limit was reached. Please wait and try again."
            : "We could not transcribe that recording. Please try again or use text input.",
        retryable: true,
        status: response.status === 429 ? 429 : 502,
      })
    }

    const payload = (await response.json()) as { text?: unknown }
    const transcript = typeof payload.text === "string" ? payload.text.trim() : ""
    if (!transcript) {
      throw new CoachServiceError({
        code: "TRANSCRIPTION_FAILED",
        message: "No speech was recognized. Try again closer to the microphone or use text input.",
        retryable: true,
        status: 422,
      })
    }
    return { transcript, model: KOREAN_COACH_TRANSCRIBE_MODEL, mode: "live" }
  } catch (error) {
    throw new CoachServiceError(sanitizeProviderError(error, "TRANSCRIPTION_FAILED"), {
      cause: error,
    })
  }
}

