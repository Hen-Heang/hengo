import { describe, expect, it } from "vitest"

import { phraseCardContentSchema } from "@/lib/korean-phrasebook/schemas"
import {
  SOCIAL_AWARENESS_PHRASES,
  SOCIAL_AWARENESS_VOCAB,
  SOCIAL_AWARENESS_VOCAB_COUNTS,
  type StudyVocabLevel,
} from "@/lib/study-packs/social-awareness"

const levelOrder: Record<StudyVocabLevel, number> = {
  basic: 0,
  intermediate: 1,
  advanced: 2,
}

describe("social awareness script study pack", () => {
  it("keeps vocabulary ordered from basic to advanced", () => {
    for (let index = 1; index < SOCIAL_AWARENESS_VOCAB.length; index += 1) {
      expect(levelOrder[SOCIAL_AWARENESS_VOCAB[index].level]).toBeGreaterThanOrEqual(
        levelOrder[SOCIAL_AWARENESS_VOCAB[index - 1].level],
      )
    }
  })

  it("does not repeat Korean vocabulary terms", () => {
    const terms = SOCIAL_AWARENESS_VOCAB.map((entry) => entry.term.trim())
    expect(new Set(terms).size).toBe(terms.length)
  })

  it("reports vocabulary counts that match the source data", () => {
    const actual = SOCIAL_AWARENESS_VOCAB.reduce(
      (counts, entry) => {
        counts[entry.level] += 1
        return counts
      },
      { basic: 0, intermediate: 0, advanced: 0 } as Record<StudyVocabLevel, number>,
    )

    expect(SOCIAL_AWARENESS_VOCAB_COUNTS).toEqual(actual)
  })

  it("has valid Phrasebook cards with at least one recommended answer", () => {
    for (const card of SOCIAL_AWARENESS_PHRASES) {
      const result = phraseCardContentSchema.safeParse(card)
      expect(result.success, result.success ? undefined : JSON.stringify(result.error.issues)).toBe(
        true,
      )
      expect(card.answers.some((answer) => answer.isRecommended)).toBe(true)
    }
  })

  it("does not repeat Phrasebook Korean prompts", () => {
    const prompts = SOCIAL_AWARENESS_PHRASES.map((card) => card.question.korean.trim())
    expect(new Set(prompts).size).toBe(prompts.length)
  })
})
