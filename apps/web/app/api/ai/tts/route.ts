import { z } from "zod"
import { requireUser } from "@/lib/server/ai"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"

const BUILT_IN_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
])

// Default steering for gpt-4o-mini-tts. Tuned for a language-learning aid:
// clarity and crisp articulation come first (a "warm/calm" tone makes the model
// speak softer and mumblier, which is bad for pronunciation practice). Language-
// neutral so it also works for occasional English. Callers can override.
const DEFAULT_INSTRUCTIONS =
  "Enunciate clearly and crisply, giving every syllable its full, distinct sound. " +
  "Speak at a steady, moderate pace with a neutral, friendly tone and natural intonation. " +
  "Prioritize clarity and correct pronunciation over expressiveness; do not rush, trail off, or soften the ends of words."

const inputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  voice: z.string().max(30).optional(),
  instructions: z.string().max(1200).optional(),
  speed: z.number().min(0.25).max(4).optional(),
})

// Text-to-speech via OpenAI's audio API (the AI SDK has no stable speech call
// yet); returns raw MP3 bytes for an <audio> object URL.
export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, db } = auth

  const rateStatus = await checkRateLimit(db, user.id, "tts")
  if (!rateStatus.allowed) {
    return Response.json({ error: `Daily text-to-speech limit reached (${rateStatus.limit}/day). Try again tomorrow.` }, { status: 429 })
  }

  const rawBody = await req.json().catch(() => ({}))
  const parsed = inputSchema.safeParse(rawBody)
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.issues.map((i) => i.message) }, { status: 400 })
  }
  const { text, voice, instructions, speed } = parsed.data

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 })

  const model = process.env.TTS_MODEL ?? "gpt-4o-mini-tts"
  const supportsInstructions = model !== "tts-1" && model !== "tts-1-hd"
  const selectedVoice = voice && BUILT_IN_VOICES.has(voice) ? voice : "marin"
  const selectedInstructions = instructions ?? DEFAULT_INSTRUCTIONS

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice: selectedVoice,
      input: text.slice(0, 4096),
      ...(supportsInstructions ? { instructions: selectedInstructions.slice(0, 1200) } : {}),
      ...(speed ? { speed } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    void recordUsage(db, {
      userId: user.id,
      feature: "tts",
      model,
      latencyMs: Math.round(performance.now() - startedAt),
      success: false,
      errorCode: `http_${res.status}`,
    })
    return Response.json({ error: `TTS failed: ${res.status} ${detail.slice(0, 200)}` }, { status: 500 })
  }

  void recordUsage(db, {
    userId: user.id,
    feature: "tts",
    model,
    latencyMs: Math.round(performance.now() - startedAt),
    success: true,
  })
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } })
}
