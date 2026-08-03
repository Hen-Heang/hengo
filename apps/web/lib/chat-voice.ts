const HANGUL = /[가-힣]/

// Subtitle/correction lines stay visible in the chat but should never be read
// aloud as part of the coach's conversational turn.
const NON_SPOKEN_LINE =
  /^\s*(?:(?:[-+>]|#{1,6})\s*)?(?:\*\*)?(?:EN|RR|FIX)\s*:(?:\*\*)?/i

// Captures the label and its value so the UI can render EN/RR/FIX lines as a
// styled subtitle block instead of raw text inside the bubble.
const SUBTITLE_LINE =
  /^\s*(?:(?:[-+>]|#{1,6})\s*)?(?:\*\*)?(EN|RR|FIX)\s*:(?:\*\*)?\s*(.+)$/i

export const CHAT_VOICE = "marin"

// gpt-4o-mini-tts supports delivery instructions. A speech-first prompt keeps
// Korean practice warm and conversational instead of sounding like a screen
// reader reciting the assistant's formatted answer.
export const CHAT_VOICE_INSTRUCTIONS =
  "Speak as a warm, attentive Korean conversation partner. Use a natural contemporary Seoul Korean accent, " +
  "gentle emotional warmth, varied intonation, and brief natural pauses. Pronounce Korean clearly for a language " +
  "learner and speak just slightly slower than everyday conversation, without sounding exaggerated, robotic, or " +
  "like an announcer. Treat the text as a spontaneous reply, not a document being read aloud."

function removeMarkdown(line: string): string {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(?:#{1,6}|[-+>])\s*/, "")
    .replace(/[`*_~]/g, "")
    .replace(/^(?:Korean|KO|한국어)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Returns the speakable Korean portion of a single response line, or null when
 * the line is a subtitle/romanization/correction or contains no Korean.
 */
export function speakableLine(line: string): string | null {
  const trimmed = line.trim()
  if (!HANGUL.test(trimmed) || NON_SPOKEN_LINE.test(trimmed)) return null
  return removeMarkdown(trimmed) || null
}

/**
 * Returns only the speakable Korean portion of a voice-mode response. English
 * subtitles, romanization, and correction notes remain visual learning aids.
 */
export function extractKoreanForSpeech(content: string): string {
  return content
    .split("\n")
    .map(speakableLine)
    .filter((line): line is string => Boolean(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export type VoiceSubtitles = {
  korean: string
  en?: string
  rr?: string
  fix?: string
}

/**
 * Parses a voice-mode reply (Korean lines + labelled EN/RR/FIX lines) into its
 * parts so the UI can render real subtitles. Returns null for anything that
 * doesn't follow the voice format — e.g. regular text-mode replies with
 * English prose — so callers can fall back to normal markdown rendering.
 */
export function parseVoiceSubtitles(content: string): VoiceSubtitles | null {
  const korean: string[] = []
  let en: string | undefined
  let rr: string | undefined
  let fix: string | undefined

  for (const raw of content.split("\n")) {
    const line = raw.trim()
    if (!line) continue

    const labelled = SUBTITLE_LINE.exec(line)
    if (labelled) {
      const value = removeMarkdown(labelled[2])
      if (!value) continue
      const label = labelled[1].toUpperCase()
      if (label === "EN") en = en ? `${en} ${value}` : value
      else if (label === "RR") rr = rr ? `${rr} ${value}` : value
      else fix = fix ? `${fix} ${value}` : value
      continue
    }

    const spoken = speakableLine(line)
    if (spoken) {
      korean.push(spoken)
      continue
    }

    // A non-Korean, non-labelled line means this is prose, not a voice turn.
    return null
  }

  if (korean.length === 0 || (!en && !rr && !fix)) return null
  return { korean: korean.join(" "), en, rr, fix }
}

/**
 * Splits spoken Korean into TTS-sized sentences so playback can start after
 * the first sentence instead of waiting for audio of the whole turn. Tiny
 * fragments (interjections like "네!") merge into the previous sentence.
 */
export function splitKoreanSentences(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]+["'’”)\]]*|[^.!?…]+$/g) ?? []
  const sentences: string[] = []
  for (const part of parts) {
    const sentence = part.trim()
    if (!sentence) continue
    if (sentences.length > 0 && sentence.length < 4) {
      sentences[sentences.length - 1] += ` ${sentence}`
    } else {
      sentences.push(sentence)
    }
  }
  return sentences
}
