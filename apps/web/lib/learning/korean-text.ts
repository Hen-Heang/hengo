// Pure helpers for deciding whether a chat turn contains Korean worth an AI
// grammar pass, and for building a stable dedup key so the same repeated
// mistake collapses into one correction card instead of duplicating forever.

const HANGUL_RANGE = /[가-힣ㄱ-ㅎㅏ-ㅣ]/

export function containsHangul(text: string): boolean {
  return HANGUL_RANGE.test(text)
}

// Trimmed, NFC-normalized, whitespace-collapsed, trailing-punctuation-stripped
// form used both for the "is this worth analyzing" check and for the
// correction dedup fingerprint — the two must agree on what counts as "the
// same text" or a mistake could dedupe against analysis but not against itself.
export function normalizeKoreanText(text: string): string {
  return text
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?~,]+$/g, "")
    .trim()
}

// Short acknowledgements that are almost never worth an AI grammar pass on
// their own. Still analyzed if they're part of a longer message.
const ACK_ONLY = new Set([
  "네",
  "네네",
  "넵",
  "예",
  "아니요",
  "아니",
  "아뇨",
  "감사합니다",
  "감사해요",
  "고마워요",
  "고맙습니다",
  "안녕하세요",
  "안녕히계세요",
  "안녕",
  "알겠습니다",
  "알겠어요",
  "네알겠습니다",
  "오케이",
  "오케",
  "굿",
])

const MAX_ANALYZABLE_LENGTH = 500

export function shouldAnalyzeKoreanTurn(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed.length > MAX_ANALYZABLE_LENGTH) return false
  if (!containsHangul(trimmed)) return false

  const normalized = normalizeKoreanText(trimmed)
  // Strip filler characters (laughing/crying particles, punctuation, spaces)
  // to see if anything meaningful is left after removing a bare acknowledgement.
  const core = normalized.replace(/[!?.~ㅋㅎㅜㅠ\s]/g, "")
  if (core.length === 0) return false
  if (ACK_ONLY.has(core)) return false

  return true
}

export interface CorrectionFingerprintInput {
  originalText: string
  correctedText: string
  category?: string | null
}

// Deterministic, human-readable dedup key (not hashed, so it stays debuggable
// and collision-free) combining normalized before/after text with the primary
// grammar category. Callers pair this with the user_id column for a
// per-user unique constraint — this function alone does not need user_id
// since it's always scoped by the caller's row ownership.
export function createCorrectionFingerprint(input: CorrectionFingerprintInput): string {
  const original = normalizeKoreanText(input.originalText).toLowerCase()
  const corrected = normalizeKoreanText(input.correctedText).toLowerCase()
  const category = (input.category ?? "general").trim().toLowerCase() || "general"
  return `${original}::${corrected}::${category}`
}
