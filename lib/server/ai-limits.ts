import type { SupabaseClient } from "@supabase/supabase-js"

// Reasonable per-user daily limits on OpenAI usage, kept in one place.
// Bucketed by cost/complexity rather than per-route, since a learner hitting
// any one structured-generation route repeatedly has the same cost profile
// as hitting several of them.
export const RATE_LIMIT_BUCKETS = {
  chat: { limit: 100, description: "Chat messages" },
  structured: { limit: 50, description: "AI grading / generation requests" },
  tts: { limit: 50, description: "Text-to-speech requests" },
  transcription: { limit: 50, description: "Speech transcription requests" },
  large_generation: { limit: 20, description: "Large content generation (vocab sets, listening lessons)" },
} as const

export type RateLimitBucket = keyof typeof RATE_LIMIT_BUCKETS

// Maps each route's specific `feature` name (used for kori_ai_usage
// analytics) to the bucket it counts against. Unknown features default to
// "structured" — the safest (most restrictive relative to typical cost) bucket.
const FEATURE_TO_BUCKET: Record<string, RateLimitBucket> = {
  chat: "chat",
  tts: "tts",
  vocab_generate: "large_generation",
  listening_generate: "large_generation",
  corrections_check: "structured",
  daily_phrase_generate: "structured",
  daily_phrase_practice: "structured",
  daily_phrase_check_practice: "structured",
  vocab_lookup: "structured",
  vocab_check_sentence: "structured",
  vocab_sentence_challenge: "structured",
  message_generator: "structured",
  analyzer: "structured",
  interview_evaluate: "structured",
  interview_drill_questions: "structured",
  interview_speaking_check: "structured",
  scenario_evaluate: "structured",
  goals_coach: "structured",
  goals_generate_tasks: "structured",
  recovery_coach: "structured",
  translate: "structured",
  realtime_session: "structured",
  realtime_turn_analysis: "structured",
  korean_coach_feedback: "structured",
  korean_coach_speech: "tts",
  korean_coach_transcription: "transcription",
  ask_hengo: "structured",
  review_summary: "structured",
}

export function bucketForFeature(feature: string): RateLimitBucket {
  return FEATURE_TO_BUCKET[feature] ?? "structured"
}

export interface RateLimitStatus {
  allowed: boolean
  bucket: RateLimitBucket
  limit: number
  used: number
}

// Rolling 24h window, counted from kori_ai_usage — simple and understandable,
// no separate counter table or Redis needed at this app's scale. Only
// counts requests that actually reached the model (success or a real AI
// failure); auth failures never get here since requireUser() runs first.
export async function checkRateLimit(
  db: SupabaseClient,
  userId: string,
  feature: string,
): Promise<RateLimitStatus> {
  const bucket = bucketForFeature(feature)
  const limit = RATE_LIMIT_BUCKETS[bucket].limit
  const featuresInBucket = Object.entries(FEATURE_TO_BUCKET)
    .filter(([, b]) => b === bucket)
    .map(([f]) => f)
  // Always include the literal feature name too, in case it's not in the
  // static map (defaults to "structured" but wasn't listed above).
  if (!featuresInBucket.includes(feature)) featuresInBucket.push(feature)

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await db
    .from("kori_ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("feature", featuresInBucket)
    .gte("created_at", since)

  // Fail open on a counting error — a broken rate-limit check must not take
  // down the feature it's protecting.
  const used = error ? 0 : (count ?? 0)
  return { allowed: used < limit, bucket, limit, used }
}

export interface UsageRecord {
  userId: string
  feature: string
  model: string
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  latencyMs?: number | null
  success: boolean
  errorCode?: string | null
}

// Never throws — a logging failure must not affect the response the caller
// already computed. Never receives prompt/response text, only metadata.
export async function recordUsage(db: SupabaseClient, record: UsageRecord): Promise<void> {
  try {
    await db.from("kori_ai_usage").insert({
      user_id: record.userId,
      feature: record.feature,
      model: record.model,
      input_tokens: record.inputTokens ?? null,
      output_tokens: record.outputTokens ?? null,
      total_tokens: record.totalTokens ?? null,
      latency_ms: record.latencyMs ?? null,
      success: record.success,
      error_code: record.errorCode ?? null,
    })
  } catch (err) {
    console.error("[ai-usage] failed to record usage:", err instanceof Error ? err.message : "unknown error")
  }
}
