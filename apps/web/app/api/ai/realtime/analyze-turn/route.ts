import { z } from "zod"

import { DEFAULT_MODEL, requireUser } from "@/lib/server/ai"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import { shouldAnalyzeKoreanTurn } from "@/lib/learning/korean-text"
import { runTurnAnalysis } from "@/lib/server/turn-analysis"
import { persistTurnMistakes } from "@/lib/server/corrections-store"

// Analyzes ONE completed learner voice turn with the same structured Korean
// turn-analysis + correction-SRS pipeline the typed chat uses (source
// "realtime_voice"). Called fire-and-forget from the client after a user turn's
// transcript completes, so it never delays the live assistant response.
//
// Ineligible turns (empty, too short, non-Korean) are skipped before the model
// is called, so they consume neither the model nor the user's daily quota.
// Duplicate analysis for the same realtime item is prevented on the client; the
// underlying correction store also dedupes mistakes by fingerprint.

const FEATURE = "realtime_turn_analysis"
const MAX_TEXT_LENGTH = 500

const inputSchema = z.object({
  conversationId: z.string().uuid(),
  itemId: z.string().min(1).max(200),
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
})

export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, db } = auth

  const parsed = inputSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }
  // itemId is validated for the client contract (dedup is enforced client-side)
  // but not needed server-side yet.
  const { conversationId, text } = parsed.data

  // Cheap eligibility gate first — non-Korean/too-short turns never reach the
  // model or the daily quota.
  if (!shouldAnalyzeKoreanTurn(text)) {
    return Response.json({ skipped: true, reason: "ineligible", analysis: null })
  }

  const rateStatus = await checkRateLimit(db, user.id, FEATURE)
  if (!rateStatus.allowed) {
    return Response.json(
      { skipped: true, reason: "rate_limited", analysis: null },
      { status: 429 },
    )
  }

  // Confirm the conversation belongs to the caller (RLS also scopes the
  // correction writes) and read the learner's level for the analysis prompt.
  const [{ data: conversation }, { data: profile }] = await Promise.all([
    db.from("kori_conversations").select("id").eq("id", conversationId).maybeSingle(),
    db.from("kori_profiles").select("korean_level").maybeSingle(),
  ])
  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 })
  }
  const level = profile?.korean_level ?? "BEGINNER"

  try {
    const analysis = await runTurnAnalysis({ level, text })
    if (!analysis) {
      void recordUsage(db, {
        userId: user.id,
        feature: FEATURE,
        model: DEFAULT_MODEL,
        latencyMs: Math.round(performance.now() - startedAt),
        success: false,
        errorCode: "no_analysis",
      })
      return Response.json({ skipped: true, reason: "no_analysis", analysis: null })
    }

    // Persist real mistakes into the shared correction SRS (deduped by
    // fingerprint). Swallows its own errors so a persistence blip can't fail the
    // response the caller already needs for the live correction decision.
    if (analysis.hasErrors && analysis.mistakes.length > 0) {
      await persistTurnMistakes({
        db,
        userId: user.id,
        sourceFeature: "realtime_voice",
        sourceId: conversationId,
        mistakes: analysis.mistakes,
        naturalVersion: analysis.naturalVersion,
      })
    }

    void recordUsage(db, {
      userId: user.id,
      feature: FEATURE,
      model: DEFAULT_MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      success: true,
    })
    return Response.json({ skipped: false, analysis })
  } catch (err) {
    void recordUsage(db, {
      userId: user.id,
      feature: FEATURE,
      model: DEFAULT_MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      success: false,
      errorCode: err instanceof Error ? err.name : "unknown",
    })
    return Response.json({ skipped: true, reason: "error", analysis: null }, { status: 500 })
  }
}
