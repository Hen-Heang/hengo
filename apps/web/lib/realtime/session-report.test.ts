import { describe, expect, it } from "vitest"

import type { TurnAnalysis } from "@/lib/ai/schemas/turn-analysis"
import type { MetricsCorrection, MetricsTurn } from "./session-metrics"
import { computeVoiceMetrics } from "./session-metrics"
import { buildVoiceSessionReport, MAX_REPORT_CORRECTIONS } from "./session-report"

function correction(
  originalText: string,
  mistakes: Array<{ original: string; corrected: string; severity: "minor" | "important" }>,
  vocab: Array<{ korean: string; english: string }> = [],
): MetricsCorrection {
  const analysis: TurnAnalysis = {
    hasErrors: mistakes.length > 0,
    correctedText: "corrected",
    naturalVersion: `${originalText} (natural)`,
    overallExplanation: null,
    mistakes: mistakes.map((m) => ({
      category: "verb_ending",
      original: m.original,
      corrected: m.corrected,
      explanation: `fix ${m.original}`,
      grammarPoint: null,
      severity: m.severity,
    })),
    usefulVocabulary: vocab.map((v) => ({ korean: v.korean, english: v.english, example: null })),
  }
  return { originalText, analysis }
}

const TURNS: MetricsTurn[] = [
  { role: "assistant", text: "안녕하세요" },
  { role: "user", text: "저는 개발자 예요" },
  { role: "assistant", text: "반가워요" },
  { role: "user", text: "회사에서 한국어를 배우고 있어요" },
]

describe("computeVoiceMetrics", () => {
  it("counts turns, approximate words, important mistakes, and dedupes expressions", () => {
    const metrics = computeVoiceMetrics({
      turns: TURNS,
      corrections: [
        correction("저는 개발자 예요", [{ original: "예요", corrected: "이에요", severity: "important" }], [
          { korean: "개발자", english: "developer" },
        ]),
        correction("회사에서 한국어를 배우고 있어요", [{ original: "a", corrected: "b", severity: "minor" }], [
          { korean: "개발자", english: "developer" },
          { korean: "회사", english: "company" },
        ]),
      ],
      startedAt: 0,
      endedAt: 120_000,
    })
    expect(metrics.userTurnCount).toBe(2)
    expect(metrics.assistantTurnCount).toBe(2)
    expect(metrics.approxWordCount).toBe(3 + 4)
    expect(metrics.importantMistakeCount).toBe(1)
    expect(metrics.targetExpressions).toEqual(["개발자", "회사"])
    expect(metrics.durationSeconds).toBe(120)
  })
})

describe("buildVoiceSessionReport", () => {
  it("surfaces important corrections first and caps them", () => {
    const corrections = [
      correction("t1", [{ original: "m1", corrected: "c1", severity: "minor" }]),
      correction("t2", [{ original: "m2", corrected: "c2", severity: "important" }]),
      correction("t3", [{ original: "m3", corrected: "c3", severity: "important" }]),
      correction("t4", [{ original: "m4", corrected: "c4", severity: "important" }]),
    ]
    const report = buildVoiceSessionReport({
      turns: TURNS,
      corrections,
      startedAt: 0,
      endedAt: 60_000,
      scenarioTitle: null,
    })
    expect(report.corrections).toHaveLength(MAX_REPORT_CORRECTIONS)
    expect(report.corrections.every((c) => c.original.startsWith("m"))).toBe(true)
    // The three important ones win over the minor one.
    expect(report.corrections.map((c) => c.original)).not.toContain("m1")
  })

  it("recommends corrections review when important mistakes occurred", () => {
    const report = buildVoiceSessionReport({
      turns: TURNS,
      corrections: [correction("t", [{ original: "m", corrected: "c", severity: "important" }])],
      startedAt: 0,
      endedAt: 60_000,
      scenarioTitle: null,
    })
    expect(report.recommendedPractice.href).toBe("/chat?mode=corrections")
  })

  it("recommends a scenario retry when clean but the scenario goal wasn't met", () => {
    const report = buildVoiceSessionReport({
      turns: TURNS,
      corrections: [],
      startedAt: 0,
      endedAt: 60_000,
      scenarioTitle: "Daily Standup",
      scenarioCompleted: false,
    })
    expect(report.recommendedPractice.href).toBe("/practice")
    expect(report.strengths.length).toBeGreaterThan(0)
  })

  it("produces no fabricated pronunciation score", () => {
    const report = buildVoiceSessionReport({
      turns: TURNS,
      corrections: [],
      startedAt: 0,
      endedAt: 60_000,
      scenarioTitle: null,
    })
    expect(JSON.stringify(report)).not.toMatch(/pronunciation/i)
    expect(report.scenarioCompleted).toBeNull()
  })
})
