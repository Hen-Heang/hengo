import { describe, expect, it } from "vitest"

import {
  CORE_KOREAN_300,
  CORE_KOREAN_TOTAL,
  getCoreKoreanCoverage,
  isCoreKoreanWord,
  nextCoreKoreanBatch,
} from "./core-korean-vocab"
import type { VocabItem } from "./types"

function word(term: string, mastery = 0, repetitions = 0): VocabItem {
  return {
    id: `${term}-${mastery}-${repetitions}`,
    category: "Existing",
    term,
    meaning: "meaning",
    mastery,
    nextReview: new Date(0).toISOString(),
    tags: [],
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions,
    lapses: 0,
  }
}

describe("Core Korean 300", () => {
  it("contains exactly 300 unique ranked terms", () => {
    expect(CORE_KOREAN_TOTAL).toBe(300)
    expect(new Set(CORE_KOREAN_300.map((entry) => entry.term)).size).toBe(300)
    expect(CORE_KOREAN_300.map((entry) => entry.rank)).toEqual(
      Array.from({ length: 300 }, (_, index) => index + 1),
    )
  })

  it("gives every item stable core, level, topic, and part-of-speech tags", () => {
    for (const entry of CORE_KOREAN_300) {
      expect(entry.tags).toContain("core")
      expect(entry.tags).toContain("core:300")
      expect(entry.tags.some((tag) => tag.startsWith("level:"))).toBe(true)
      expect(entry.tags.some((tag) => tag.startsWith("topic:"))).toBe(true)
      expect(entry.tags.some((tag) => tag.startsWith("pos:"))).toBe(true)
    }
  })

  it("counts duplicate saved rows once and keeps the strongest progress", () => {
    const coverage = getCoreKoreanCoverage([
      word("가다", 20, 1),
      word("가다", 80, 5),
      word("회의", 60, 3),
      word("not-core", 100, 10),
    ])

    expect(coverage.savedCount).toBe(2)
    expect(coverage.missingCount).toBe(298)
    expect(coverage.masteredCount).toBe(1)
    expect(coverage.averageMastery).toBe(70)
    expect(coverage.duplicateRows).toBe(1)
    expect(coverage.savedWords.find((item) => item.term === "가다")?.mastery).toBe(80)
  })

  it("recognizes normalized Korean terms and returns only missing batch items", () => {
    expect(isCoreKoreanWord(word("  회의  "))).toBe(true)
    expect(isCoreKoreanWord(word("not-core"))).toBe(false)

    const batch = nextCoreKoreanBatch([word("하다"), word("가다")], 5)
    expect(batch).toHaveLength(5)
    expect(batch.some((entry) => entry.term === "하다")).toBe(false)
    expect(batch.some((entry) => entry.term === "가다")).toBe(false)
  })
})
