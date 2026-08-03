import { createHash } from "node:crypto"

import { z } from "zod"

import { requireUser } from "@/lib/server/ai"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import type { RealtimeBootstrapMessage } from "@/lib/realtime/events"
import {
  buildRealtimeBootstrap,
  buildRealtimeInstructions,
  cleanProfileValue,
  normalizeKoreanLevel,
  resolveRealtimeModel,
  resolveSpeechSpeed,
  VOICE_LEVELS,
  type RealtimeRecentMistake,
  type RealtimeScenarioContext,
} from "@/lib/realtime/session-context"

const REALTIME_FEATURE = "realtime_session"

// Resolve (and validate) the configured model once at module load so an
// unsupported REALTIME_MODEL surfaces a clear warning instead of a generic 502.
const { model: REALTIME_MODEL, invalidRequest: INVALID_REALTIME_MODEL } = resolveRealtimeModel(
  process.env.REALTIME_MODEL,
)
if (INVALID_REALTIME_MODEL) {
  console.warn(
    `[realtime-session] REALTIME_MODEL="${INVALID_REALTIME_MODEL}" is not an allowed realtime model; ` +
      `falling back to "${REALTIME_MODEL}".`,
  )
}

// Fetch a little more than the bootstrap cap so empty rows don't shrink the tail.
const HISTORY_FETCH_LIMIT = 16

const inputSchema = z.object({
  conversationId: z.string().uuid(),
  technicalMode: z.boolean().optional(),
  pace: z.enum(["slow", "clear", "natural"]).optional(),
})

export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, db } = auth

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "Realtime voice is not configured" }, { status: 503 })
  }

  const rateStatus = await checkRateLimit(db, user.id, REALTIME_FEATURE)
  if (!rateStatus.allowed) {
    return Response.json(
      { error: `Daily live-voice limit reached (${rateStatus.limit}/day). Try again tomorrow.` },
      { status: 429 },
    )
  }

  const parsed = inputSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return Response.json(
      { error: "conversationId is required", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }
  const { conversationId, technicalMode = false, pace } = parsed.data

  // Conversation + profile + recent transcript + recent important mistakes in
  // parallel (all RLS-scoped to the caller). Scenario needs conversation.scenario_id
  // first, so it's a second, conditional read.
  const [
    { data: conversation, error: conversationError },
    { data: profile },
    { data: historyRows },
    { data: mistakeRows },
  ] = await Promise.all([
    db
      .from("kori_conversations")
      .select("id, conversation_type, scenario_id")
      .eq("id", conversationId)
      .maybeSingle(),
    db
      .from("kori_profiles")
      .select("display_name, korean_level, occupation, learning_goal, native_language, country")
      .maybeSingle(),
    db
      .from("kori_messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_FETCH_LIMIT),
    db
      .from("kori_corrections")
      .select("original_text, corrected_text")
      .eq("severity", "important")
      .order("last_seen_at", { ascending: false })
      .limit(5),
  ])

  if (conversationError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 })
  }

  let scenario: RealtimeScenarioContext | null = null
  if (conversation.scenario_id) {
    const { data: scenarioRow } = await db
      .from("kori_scenarios")
      .select("title, summary, goal, intro_message")
      .eq("id", conversation.scenario_id)
      .maybeSingle()
    if (scenarioRow) {
      scenario = {
        title: cleanProfileValue(scenarioRow.title, 120) ?? "Roleplay",
        summary: cleanProfileValue(scenarioRow.summary, 300),
        goal: cleanProfileValue(scenarioRow.goal, 300),
        introMessage: cleanProfileValue(scenarioRow.intro_message, 600),
      }
    }
  }

  const level = normalizeKoreanLevel(profile?.korean_level)
  const voiceLevel = VOICE_LEVELS[level]
  const speechSpeed = resolveSpeechSpeed(level, pace)

  const history: RealtimeBootstrapMessage[] = (historyRows ?? [])
    .reverse()
    .map((row) => ({
      id: String(row.id),
      role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
      text: String(row.content ?? ""),
    }))
  const bootstrap = buildRealtimeBootstrap(history)

  const recentMistakes: RealtimeRecentMistake[] = (mistakeRows ?? [])
    .map((row) => ({
      original: cleanProfileValue(row.original_text, 80) ?? "",
      corrected: cleanProfileValue(row.corrected_text, 80) ?? "",
    }))
    .filter((mistake) => mistake.original && mistake.corrected)

  const instructions = buildRealtimeInstructions({
    learnerName: cleanProfileValue(profile?.display_name, 60) ?? "the learner",
    level,
    conversationType: conversation.conversation_type,
    technicalMode,
    occupation: cleanProfileValue(profile?.occupation),
    learningGoal: cleanProfileValue(profile?.learning_goal),
    nativeLanguage: cleanProfileValue(profile?.native_language, 60),
    country: cleanProfileValue(profile?.country, 60),
    scenario,
    recentMistakes,
    // The bootstrap tail is what the model will actually see replayed, so the
    // greet/continue instruction is derived from the same set.
    history: bootstrap.history,
  })

  const safetyIdentifier = createHash("sha256").update(auth.user.id).digest("hex")

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          output_modalities: ["audio"],
          instructions,
          max_output_tokens: voiceLevel.maxOutputTokens,
          audio: {
            input: {
              noise_reduction: { type: "near_field" },
              transcription: {
                model: "gpt-4o-mini-transcribe",
                language: "ko",
                prompt:
                  "Natural Korean conversation. Preserve Korean names, workplace terms, and software vocabulary accurately.",
              },
              turn_detection: {
                type: "semantic_vad",
                eagerness: "low",
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice: "marin",
              speed: speechSpeed,
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error("[realtime-session] OpenAI rejected session", response.status, detail)
      void recordUsage(db, {
        userId: user.id,
        feature: REALTIME_FEATURE,
        model: REALTIME_MODEL,
        latencyMs: Math.round(performance.now() - startedAt),
        success: false,
        errorCode: `http_${response.status}`,
      })
      return Response.json({ error: "Could not start realtime voice" }, { status: 502 })
    }

    const data = (await response.json()) as { value?: string; expires_at?: number }
    if (!data.value) {
      void recordUsage(db, {
        userId: user.id,
        feature: REALTIME_FEATURE,
        model: REALTIME_MODEL,
        latencyMs: Math.round(performance.now() - startedAt),
        success: false,
        errorCode: "no_client_secret",
      })
      return Response.json({ error: "Realtime voice returned no client secret" }, { status: 502 })
    }

    void recordUsage(db, {
      userId: user.id,
      feature: REALTIME_FEATURE,
      model: REALTIME_MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      success: true,
    })

    return Response.json({
      clientSecret: data.value,
      expiresAt: data.expires_at ?? null,
      model: REALTIME_MODEL,
      learnerLevel: level,
      speechRate: speechSpeed,
      scenarioTitle: scenario?.title ?? null,
      bootstrap,
    })
  } catch (error) {
    console.error("[realtime-session] Failed to create session", error)
    void recordUsage(db, {
      userId: user.id,
      feature: REALTIME_FEATURE,
      model: REALTIME_MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      success: false,
      errorCode: error instanceof Error ? error.name : "unknown",
    })
    return Response.json({ error: "Could not connect to realtime voice" }, { status: 502 })
  }
}
