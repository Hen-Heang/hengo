export const KOREAN_COACH_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-5.6-terra"
export const KOREAN_COACH_TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe"
export const KOREAN_COACH_TTS_MODEL =
  process.env.OPENAI_TTS_MODEL ?? process.env.TTS_MODEL ?? "tts-1"

export const KOREAN_COACH_TRANSCRIPTION_TIMEOUT_MS = 30_000
export const KOREAN_COACH_FEEDBACK_TIMEOUT_MS = 35_000
export const KOREAN_COACH_SPEECH_TIMEOUT_MS = 25_000
