export type CoachErrorCode =
  | "AUTH_REQUIRED"
  | "SESSION_EXPIRED"
  | "INVALID_REQUEST"
  | "MICROPHONE_UNAVAILABLE"
  | "EMPTY_AUDIO"
  | "RECORDING_TOO_SHORT"
  | "AUDIO_TOO_LARGE"
  | "UNSUPPORTED_AUDIO_FORMAT"
  | "RATE_LIMITED"
  | "AI_NOT_CONFIGURED"
  | "TRANSCRIPTION_FAILED"
  | "FEEDBACK_FAILED"
  | "INVALID_AI_OUTPUT"
  | "SPEECH_FAILED"
  | "AI_TIMEOUT"
  | "INTERNAL_ERROR"

export interface SafeCoachError {
  code: CoachErrorCode
  message: string
  retryable: boolean
  status: number
}

export class CoachServiceError extends Error {
  constructor(
    public readonly safe: SafeCoachError,
    options?: ErrorOptions,
  ) {
    super(safe.message, options)
    this.name = "CoachServiceError"
  }
}

export function sanitizeProviderError(
  error: unknown,
  fallbackCode: Extract<
    CoachErrorCode,
    "TRANSCRIPTION_FAILED" | "FEEDBACK_FAILED" | "SPEECH_FAILED"
  >,
): SafeCoachError {
  if (error instanceof CoachServiceError) return error.safe

  const name = error instanceof Error ? error.name : ""
  if (name === "AbortError" || name === "TimeoutError") {
    return {
      code: "AI_TIMEOUT",
      message: "The AI service took too long to respond. Please try again.",
      retryable: true,
      status: 504,
    }
  }

  return {
    code: fallbackCode,
    message:
      fallbackCode === "TRANSCRIPTION_FAILED"
        ? "We could not transcribe that recording. Please try again or use text input."
        : fallbackCode === "SPEECH_FAILED"
          ? "We could not generate the voice. You can continue with the transcript."
          : "We could not prepare feedback. Please try again.",
    retryable: true,
    status: 502,
  }
}
