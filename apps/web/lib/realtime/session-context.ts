// Pure, I/O-free builders for the realtime voice session. The route does the
// Supabase reads; everything here is deterministic so it can be unit tested:
// model allowlisting, level tuning, prompt construction (greet vs continue,
// scenario roleplay, recent-mistake awareness), and bootstrap decisions.

import {
  hasMeaningfulHistory,
  limitBootstrapHistory,
  shouldCreateInitialResponse,
  type RealtimeBootstrapMessage,
} from "./events"

export type KoreanLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

// The realtime model is set via REALTIME_MODEL. Like the chat model allowlist
// (lib/server/models.ts), an unknown value falls back to the safe default
// instead of passing an arbitrary string to OpenAI and getting a generic 502.
export const DEFAULT_REALTIME_MODEL = "gpt-realtime-2.1"
export const ALLOWED_REALTIME_MODELS = [
  "gpt-realtime-2.1",
  "gpt-realtime-2.1-mini",
  "gpt-realtime",
  "gpt-realtime-mini",
] as const

export type AllowedRealtimeModel = (typeof ALLOWED_REALTIME_MODELS)[number]

export function isAllowedRealtimeModel(value: string): value is AllowedRealtimeModel {
  return (ALLOWED_REALTIME_MODELS as readonly string[]).includes(value)
}

/** Resolves the configured REALTIME_MODEL to an allowlisted id, falling back to
 *  the default and returning whether the requested value was rejected so the
 *  caller can log a clear, actionable warning at startup. */
export function resolveRealtimeModel(requested?: string | null): {
  model: AllowedRealtimeModel
  invalidRequest: string | null
} {
  if (!requested) return { model: DEFAULT_REALTIME_MODEL, invalidRequest: null }
  if (isAllowedRealtimeModel(requested)) return { model: requested, invalidRequest: null }
  return { model: DEFAULT_REALTIME_MODEL, invalidRequest: requested }
}

export interface VoiceLevelConfig {
  speed: number
  maxOutputTokens: number
  instructions: string
}

export const VOICE_LEVELS: Record<KoreanLevel, VoiceLevelConfig> = {
  BEGINNER: {
    speed: 0.88,
    maxOutputTokens: 500,
    instructions:
      "- Use beginner Korean (TOPIK 1 / A1-A2) in polite 해요체. Use common everyday words and one idea per sentence. Avoid slang, idioms, abstract vocabulary, long clauses, and advanced connective endings.\n" +
      "- Reply with 3-4 short sentences, usually 4-8 Korean words per sentence. Keep the conversation substantial by using simple sentences, not by making sentences complex.\n" +
      "- Introduce at most one new expression per turn. When useful, naturally repeat or rephrase the key expression. Ask one simple open question.",
  },
  INTERMEDIATE: {
    speed: 0.94,
    maxOutputTokens: 700,
    instructions:
      "- Use intermediate Korean (roughly TOPIK 2-3 / B1) in natural polite speech. Prefer familiar vocabulary and clear sentence structures; explain uncommon expressions with a simpler Korean rephrasing.\n" +
      "- Reply with 3-5 natural sentences (about 25-50 Korean words), add at most two useful new expressions, and ask one relevant open question.",
  },
  ADVANCED: {
    speed: 0.99,
    maxOutputTokens: 900,
    instructions:
      "- Use natural advanced Korean appropriate to the topic, including nuanced vocabulary and idioms when they genuinely fit. Do not make the wording complex just to sound advanced.\n" +
      "- Reply with 4-6 natural sentences (about 40-75 Korean words) and ask one relevant open question.",
  },
}

// Optional per-session speaking pace override. When set, it replaces the
// level-derived speed so a learner can slow the coach down (or speed it up)
// from the setup sheet without changing their level.
export type SpeakingPace = "slow" | "clear" | "natural"

export const PACE_SPEED: Record<SpeakingPace, number> = {
  slow: 0.85,
  clear: 0.93,
  natural: 1.0,
}

export function resolveSpeechSpeed(level: KoreanLevel, pace?: SpeakingPace | null): number {
  if (pace && PACE_SPEED[pace] !== undefined) return PACE_SPEED[pace]
  return VOICE_LEVELS[level].speed
}

export function cleanProfileValue(value: unknown, maxLength = 120): string | null {
  if (typeof value !== "string") return null
  const cleaned = value.replace(/\s+/g, " ").trim()
  return cleaned ? cleaned.slice(0, maxLength) : null
}

export function normalizeKoreanLevel(value: unknown): KoreanLevel {
  const normalized = cleanProfileValue(value, 30)?.toUpperCase()
  if (normalized === "ADVANCED") return "ADVANCED"
  if (normalized === "INTERMEDIATE") return "INTERMEDIATE"
  return "BEGINNER"
}

export interface RealtimeScenarioContext {
  title: string
  summary: string | null
  goal: string | null
  introMessage: string | null
}

export interface RealtimeRecentMistake {
  original: string
  corrected: string
}

export interface RealtimeContextInput {
  learnerName: string
  level: KoreanLevel
  conversationType: string
  technicalMode: boolean
  occupation: string | null
  learningGoal: string | null
  nativeLanguage: string | null
  country: string | null
  scenario: RealtimeScenarioContext | null
  recentMistakes: RealtimeRecentMistake[]
  history: RealtimeBootstrapMessage[]
}

// How many recent important mistakes to surface as gentle "watch-for" context.
export const MAX_MISTAKE_HINTS = 5

function scenarioBlock(scenario: RealtimeScenarioContext): string {
  const lines = [
    `ROLEPLAY SCENARIO — "${scenario.title}":`,
    scenario.summary ? `- Situation: ${scenario.summary}` : null,
    scenario.goal ? `- The learner's goal this session: ${scenario.goal}` : null,
    scenario.introMessage ? `- Roleplay setup: ${scenario.introMessage}` : null,
    "- Stay in character for this scenario and keep it a natural, spoken roleplay. Guide the learner toward the goal without doing it for them.",
  ].filter(Boolean) as string[]
  return lines.join("\n")
}

function mistakesBlock(mistakes: RealtimeRecentMistake[]): string {
  const items = mistakes
    .slice(0, MAX_MISTAKE_HINTS)
    .map((mistake) => `- ${mistake.original} → ${mistake.corrected}`)
    .join("\n")
  return (
    "The learner has recently struggled with these — gently reinforce the correct form when it naturally comes up, but do not lecture or list them:\n" +
    items
  )
}

/** Builds the full system instructions for the realtime session, adapting the
 *  greeting behavior to whether there is existing conversation history. */
export function buildRealtimeInstructions(input: RealtimeContextInput): string {
  const voiceLevel = VOICE_LEVELS[input.level]
  const continuing = hasMeaningfulHistory(input.history)

  const profileDetails = [
    input.occupation && `Job: ${input.occupation}`,
    input.learningGoal && `Learning goal: ${input.learningGoal}`,
    input.nativeLanguage &&
      `Native language: ${input.nativeLanguage} (do not speak it unless explicitly requested)`,
    input.country && `Country: ${input.country}`,
  ].filter(Boolean) as string[]
  const profileBlock = profileDetails.length
    ? `Learner context (adapt quietly; do not announce this profile):\n${profileDetails
        .map((line) => `- ${line}`)
        .join("\n")}`
    : ""

  const practiceContext = input.technicalMode
    ? "Prioritize realistic Korean for software work, meetings, code reviews, and office relationships."
    : "Use practical everyday Korean and let the learner guide the topic naturally."

  // Greet only for a brand-new conversation; otherwise pick up the thread.
  const openingRule = continuing
    ? "- You are continuing an ongoing conversation shown in the messages above. Do NOT greet again or restart the topic. Respond naturally to the most recent message and keep continuity with what was already said."
    : "- On the first response when no learner audio has been provided yet, greet them warmly in Korean, introduce one easy topic, and ask a simple question that invites more than yes/no."

  return (
    `You are Hengo, a warm Korean conversation partner and speaking coach for ${input.learnerName}. ` +
    `Their approximate Korean level is ${input.level}. The practice type is ${input.conversationType}.\n\n` +
    "VOICE AND LANGUAGE:\n" +
    "- Speak only natural, contemporary Korean. Never read English translations, romanization, markdown, labels, or stage directions aloud.\n" +
    "- Sound like a real person in a relaxed one-to-one conversation: warm, responsive, expressive, and never scripted.\n" +
    "- Speak clearly at the configured learner pace, with natural intonation and a brief pause between every sentence.\n\n" +
    "LEVEL RULES (follow these strictly):\n" +
    `${voiceLevel.instructions}\n\n` +
    "CONVERSATION BEHAVIOR:\n" +
    "- React specifically to what the learner said, add one useful idea or personal-style observation, and move the same topic forward. Vary your openings and never praise automatically.\n" +
    "- Let the learner finish. If they pause mid-thought, wait patiently. They may interrupt you; adapt naturally and do not complain.\n" +
    "- Match vocabulary and grammar to their level. If they struggle, simplify and offer a short example in Korean.\n" +
    "- Correct only an important mistake that affects naturalness or meaning. First respond to their idea, then say '더 자연스럽게 말하면…' with one concise correction, and continue the conversation.\n" +
    `${openingRule}\n` +
    `- ${practiceContext}\n` +
    (input.scenario ? `\n${scenarioBlock(input.scenario)}\n` : "") +
    (input.recentMistakes.length ? `\n${mistakesBlock(input.recentMistakes)}\n` : "") +
    (profileBlock ? `\n${profileBlock}\n` : "")
  )
}

export interface RealtimeBootstrap {
  history: RealtimeBootstrapMessage[]
  createInitialResponse: boolean
}

/** Produces the sanitized bootstrap payload the browser replays into the new
 *  realtime context: a size-limited history tail plus whether the assistant
 *  should speak first. */
export function buildRealtimeBootstrap(
  history: RealtimeBootstrapMessage[],
  max?: number,
): RealtimeBootstrap {
  const limited = limitBootstrapHistory(history, max)
  return {
    history: limited,
    createInitialResponse: shouldCreateInitialResponse(limited),
  }
}
