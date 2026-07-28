export const KOREAN_COACH_MAX_AUDIO_BYTES = 10 * 1024 * 1024
export const KOREAN_COACH_MIN_AUDIO_BYTES = 1_000
export const KOREAN_COACH_MIN_RECORDING_MS = 600

export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/ogg",
] as const

export type AudioValidationCode =
  | "empty_audio"
  | "recording_too_short"
  | "audio_too_large"
  | "unsupported_audio_format"

export interface AudioValidationResult {
  valid: boolean
  code?: AudioValidationCode
  message?: string
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.toLowerCase().split(";")[0].trim()
}

export function isSupportedAudioMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType)
  return (SUPPORTED_AUDIO_MIME_TYPES as readonly string[]).includes(normalized)
}

export function validateAudioInput(input: {
  size: number
  type: string
  durationMs?: number
}): AudioValidationResult {
  if (input.size <= 0) {
    return { valid: false, code: "empty_audio", message: "No audio was recorded. Please try again." }
  }
  if (input.durationMs !== undefined && input.durationMs < KOREAN_COACH_MIN_RECORDING_MS) {
    return {
      valid: false,
      code: "recording_too_short",
      message: "The recording is too short. Speak for at least one second and try again.",
    }
  }
  if (input.size < KOREAN_COACH_MIN_AUDIO_BYTES) {
    return {
      valid: false,
      code: "recording_too_short",
      message: "The recording did not contain enough audio. Please try again.",
    }
  }
  if (input.size > KOREAN_COACH_MAX_AUDIO_BYTES) {
    return {
      valid: false,
      code: "audio_too_large",
      message: "The recording is too large. Keep your answer short and try again.",
    }
  }
  if (!isSupportedAudioMimeType(input.type)) {
    return {
      valid: false,
      code: "unsupported_audio_format",
      message: "This browser recorded an unsupported audio format. Use text input instead.",
    }
  }
  return { valid: true }
}

export function preferredRecorderMimeType(
  isTypeSupported: (mimeType: string) => boolean,
): string | null {
  const candidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]
  return candidates.find((candidate) => isTypeSupported(candidate)) ?? null
}
