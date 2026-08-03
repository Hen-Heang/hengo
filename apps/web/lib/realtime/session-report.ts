// Pure builder for the post-session voice report. Turns the raw session data
// (turns + collected corrections + scenario context) into a structured,
// honestly-labeled report: real metrics, up to three important corrections,
// useful vocabulary, and a recommended next practice. No fabricated scores.

import {
  computeVoiceMetrics,
  type MetricsCorrection,
  type MetricsTurn,
  type VoiceSessionMetrics,
} from "./session-metrics"

export interface ReportCorrection {
  original: string
  // Minimal grammatical fix.
  corrected: string
  // How a native speaker would naturally phrase the whole turn.
  natural: string
  explanation: string
  grammarPoint: string | null
}

export interface ReportVocab {
  korean: string
  english: string
}

export interface RecommendedPractice {
  label: string
  href: string
  reason: string
}

export interface VoiceSessionReport {
  metrics: VoiceSessionMetrics
  scenarioTitle: string | null
  scenarioCompleted: boolean | null
  strengths: string[]
  corrections: ReportCorrection[]
  vocabulary: ReportVocab[]
  recommendedPractice: RecommendedPractice
}

export const MAX_REPORT_CORRECTIONS = 3
const MAX_REPORT_VOCAB = 6

function buildStrengths(metrics: VoiceSessionMetrics): string[] {
  const strengths: string[] = []
  if (metrics.userTurnCount >= 1) {
    strengths.push(
      `You spoke ${metrics.userTurnCount} time${metrics.userTurnCount === 1 ? "" : "s"} and kept the conversation going.`,
    )
  }
  if (metrics.approxWordCount >= 20) {
    strengths.push(`You produced about ${metrics.approxWordCount} Korean words of speech.`)
  }
  if (metrics.userTurnCount > 0 && metrics.importantMistakeCount === 0) {
    strengths.push("No major grammar issues came up — natural, confident speaking.")
  } else if (metrics.userTurnCount >= 3 && metrics.importantMistakeCount <= 1) {
    strengths.push("Most of your sentences were clear and easy to understand.")
  }
  return strengths.slice(0, 3)
}

interface RankedCorrection extends ReportCorrection {
  important: boolean
}

function buildCorrections(corrections: MetricsCorrection[]): ReportCorrection[] {
  const flat: RankedCorrection[] = []
  for (const correction of corrections) {
    for (const mistake of correction.analysis.mistakes) {
      flat.push({
        original: mistake.original,
        corrected: mistake.corrected,
        natural: correction.analysis.naturalVersion,
        explanation: mistake.explanation,
        grammarPoint: mistake.grammarPoint,
        important: mistake.severity === "important",
      })
    }
  }

  const seen = new Set<string>()
  return flat
    // Important first, preserving encounter order within each group.
    .sort((a, b) => Number(b.important) - Number(a.important))
    .filter((item) => {
      const key = `${item.original}→${item.corrected}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_REPORT_CORRECTIONS)
    .map((item) => ({
      original: item.original,
      corrected: item.corrected,
      natural: item.natural,
      explanation: item.explanation,
      grammarPoint: item.grammarPoint,
    }))
}

function buildVocabulary(corrections: MetricsCorrection[]): ReportVocab[] {
  const seen = new Set<string>()
  const result: ReportVocab[] = []
  for (const correction of corrections) {
    for (const vocab of correction.analysis.usefulVocabulary) {
      const korean = vocab.korean.trim()
      if (!korean || seen.has(korean)) continue
      seen.add(korean)
      result.push({ korean, english: vocab.english })
      if (result.length >= MAX_REPORT_VOCAB) return result
    }
  }
  return result
}

function recommendPractice(
  metrics: VoiceSessionMetrics,
  scenarioTitle: string | null,
  scenarioCompleted: boolean | null,
): RecommendedPractice {
  if (metrics.importantMistakeCount > 0) {
    return {
      label: "Review your corrections",
      href: "/chat?mode=corrections",
      reason: "Lock in the fixes from this session with spaced repetition.",
    }
  }
  if (scenarioTitle && scenarioCompleted === false) {
    return {
      label: "Try the scenario again",
      href: "/practice",
      reason: "You're close — another run should complete the goal.",
    }
  }
  return {
    label: "Review your vocabulary",
    href: "/vocab",
    reason: "Keep the expressions you practiced fresh.",
  }
}

export function buildVoiceSessionReport(input: {
  turns: MetricsTurn[]
  corrections: MetricsCorrection[]
  startedAt: number
  endedAt: number
  scenarioTitle: string | null
  scenarioCompleted?: boolean | null
}): VoiceSessionReport {
  const metrics = computeVoiceMetrics({
    turns: input.turns,
    corrections: input.corrections,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
  })
  const scenarioCompleted = input.scenarioCompleted ?? null

  return {
    metrics,
    scenarioTitle: input.scenarioTitle,
    scenarioCompleted,
    strengths: buildStrengths(metrics),
    corrections: buildCorrections(input.corrections),
    vocabulary: buildVocabulary(input.corrections),
    recommendedPractice: recommendPractice(metrics, input.scenarioTitle, scenarioCompleted),
  }
}
