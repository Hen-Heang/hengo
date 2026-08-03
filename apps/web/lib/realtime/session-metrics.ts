// Honest, computed metrics for a completed voice session — no invented
// pronunciation percentages. Pure so it's shared by the post-session report
// and the persisted session summary, and unit tested directly.

import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"

// Structural inputs so this module doesn't depend on the hook (avoids a cycle).
export interface MetricsTurn {
  role: "user" | "assistant"
  text: string
}

export interface MetricsCorrection {
  originalText: string
  analysis: TurnAnalysis
}

export interface VoiceSessionMetrics {
  durationSeconds: number
  userTurnCount: number
  assistantTurnCount: number
  // Approximate Korean words the learner spoke (whitespace tokens across their
  // turns) — labeled "approximate" everywhere it surfaces.
  approxWordCount: number
  importantMistakeCount: number
  // Useful expressions surfaced by the turn analyses this session, deduped.
  targetExpressions: string[]
}

const MAX_TARGET_EXPRESSIONS = 8

function wordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function uniqueCapped(values: string[], cap: number): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const cleaned = value.trim()
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    result.push(cleaned)
    if (result.length >= cap) break
  }
  return result
}

export function computeVoiceMetrics(input: {
  turns: MetricsTurn[]
  corrections: MetricsCorrection[]
  startedAt: number
  endedAt: number
}): VoiceSessionMetrics {
  const userTurns = input.turns.filter((turn) => turn.role === "user")
  const assistantTurns = input.turns.filter((turn) => turn.role === "assistant")

  const approxWordCount = userTurns.reduce((sum, turn) => sum + wordCount(turn.text), 0)
  const importantMistakeCount = input.corrections.reduce(
    (sum, correction) =>
      sum + correction.analysis.mistakes.filter((mistake) => mistake.severity === "important").length,
    0,
  )
  const targetExpressions = uniqueCapped(
    input.corrections.flatMap((correction) =>
      correction.analysis.usefulVocabulary.map((vocab) => vocab.korean),
    ),
    MAX_TARGET_EXPRESSIONS,
  )

  return {
    durationSeconds: Math.max(0, Math.round((input.endedAt - input.startedAt) / 1000)),
    userTurnCount: userTurns.length,
    assistantTurnCount: assistantTurns.length,
    approxWordCount,
    importantMistakeCount,
    targetExpressions,
  }
}
