import { describe, expect, it } from "vitest"

import type { VocabItem } from "./types"
import {
  computeVocabStats,
  filterVocab,
  isCorrectTerm,
  matchesMastery,
  shuffle,
  sortVocab,
} from "./vocab-review"

function word(overrides: Partial<VocabItem>): VocabItem {
  return {
    id: "1",
    category: "Work",
    term: "회의",
    meaning: "meeting",
    mastery: 0,
    nextReview: "-",
    tags: [],
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    ...overrides,
  }
}

describe("shuffle", () => {
  it("keeps the same elements and length", () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect(result).toHaveLength(input.length)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it("does not mutate the input array", () => {
    const input = [1, 2, 3]
    shuffle(input)
    expect(input).toEqual([1, 2, 3])
  })

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle([7])).toEqual([7])
  })
})

describe("isCorrectTerm", () => {
  it("accepts an exact match", () => {
    expect(isCorrectTerm("회의", "회의")).toBe(true)
  })

  it("ignores surrounding whitespace and punctuation", () => {
    expect(isCorrectTerm("  회의. ", "회의")).toBe(true)
    expect(isCorrectTerm("배포   하다", "배포 하다")).toBe(true)
  })

  it("normalizes decomposed Hangul (NFD) input", () => {
    expect(isCorrectTerm("회의".normalize("NFD"), "회의")).toBe(true)
  })

  it("accepts terms with optional parenthesized parts either way", () => {
    expect(isCorrectTerm("출시하다", "출시(하다)")).toBe(true)
    expect(isCorrectTerm("출시", "출시(하다)")).toBe(true)
  })

  it("rejects wrong or empty answers", () => {
    expect(isCorrectTerm("회사", "회의")).toBe(false)
    expect(isCorrectTerm("", "회의")).toBe(false)
    expect(isCorrectTerm("   ", "회의")).toBe(false)
  })

  it("accepts any single alternative in a slash-separated term", () => {
    expect(isCorrectTerm("구매하다", "구매하다 / 구입하다 / 사다")).toBe(true)
    expect(isCorrectTerm("구입하다", "구매하다 / 구입하다 / 사다")).toBe(true)
    expect(isCorrectTerm("사다", "구매하다 / 구입하다 / 사다")).toBe(true)
  })

  it("still accepts the full slash-joined string", () => {
    expect(isCorrectTerm("구매하다 / 구입하다 / 사다", "구매하다 / 구입하다 / 사다")).toBe(true)
  })

  it("rejects an alternative that isn't in the list", () => {
    expect(isCorrectTerm("팔다", "구매하다 / 구입하다 / 사다")).toBe(false)
  })
})

describe("matchesMastery", () => {
  it("buckets mastery into weak / learning / mastered", () => {
    expect(matchesMastery(0, "weak")).toBe(true)
    expect(matchesMastery(49, "weak")).toBe(true)
    expect(matchesMastery(50, "weak")).toBe(false)
    expect(matchesMastery(50, "learning")).toBe(true)
    expect(matchesMastery(79, "learning")).toBe(true)
    expect(matchesMastery(80, "learning")).toBe(false)
    expect(matchesMastery(80, "mastered")).toBe(true)
    expect(matchesMastery(100, "mastered")).toBe(true)
  })

  it("matches everything for the all filter", () => {
    expect(matchesMastery(0, "all")).toBe(true)
    expect(matchesMastery(100, "all")).toBe(true)
  })
})

describe("filterVocab", () => {
  const words = [
    word({ id: "1", term: "회의", meaning: "meeting", mastery: 90, tags: ["work"] }),
    word({ id: "2", term: "배포", meaning: "deployment", mastery: 30, pronunciation: "baepo", category: "Tech" }),
    word({ id: "3", term: "출근", meaning: "going to work", mastery: 60, category: "Daily" }),
  ]

  it("returns everything with no query and the all filter", () => {
    expect(filterVocab(words, "", "all")).toHaveLength(3)
  })

  it("searches term, meaning, pronunciation, category, and tags", () => {
    expect(filterVocab(words, "회의", "all").map((w) => w.id)).toEqual(["1"])
    expect(filterVocab(words, "deploy", "all").map((w) => w.id)).toEqual(["2"])
    expect(filterVocab(words, "baepo", "all").map((w) => w.id)).toEqual(["2"])
    expect(filterVocab(words, "daily", "all").map((w) => w.id)).toEqual(["3"])
    expect(filterVocab(words, "work", "all").map((w) => w.id)).toEqual(["1", "3"])
  })

  it("is case-insensitive and trims the query", () => {
    expect(filterVocab(words, "  MEETING ", "all").map((w) => w.id)).toEqual(["1"])
  })

  it("combines mastery filter with the query", () => {
    expect(filterVocab(words, "", "weak").map((w) => w.id)).toEqual(["2"])
    expect(filterVocab(words, "work", "mastered").map((w) => w.id)).toEqual(["1"])
    expect(filterVocab(words, "work", "weak")).toHaveLength(0)
  })
})

describe("sortVocab", () => {
  const words = [
    word({ id: "1", term: "회의", mastery: 90, nextReview: "2026-06-20" }),
    word({ id: "2", term: "배포", mastery: 30, nextReview: "2026-06-15" }),
    word({ id: "3", term: "출근", mastery: 60, nextReview: "2026-06-18" }),
  ]

  it("sorts by mastery ascending then descending", () => {
    expect(sortVocab(words, "mastery-asc").map((w) => w.id)).toEqual(["2", "3", "1"])
    expect(sortVocab(words, "mastery-desc").map((w) => w.id)).toEqual(["1", "3", "2"])
  })

  it("sorts by soonest next review", () => {
    expect(sortVocab(words, "due").map((w) => w.id)).toEqual(["2", "3", "1"])
  })

  it("sorts alphabetically by Korean term", () => {
    expect(sortVocab(words, "alpha").map((w) => w.term)).toEqual(["배포", "출근", "회의"])
  })

  it("does not mutate the input array", () => {
    const input = [...words]
    sortVocab(input, "mastery-asc")
    expect(input.map((w) => w.id)).toEqual(["1", "2", "3"])
  })
})

describe("computeVocabStats", () => {
  it("buckets words and averages mastery", () => {
    const stats = computeVocabStats([
      word({ mastery: 90 }),
      word({ mastery: 80 }),
      word({ mastery: 60 }),
      word({ mastery: 10 }),
    ])
    expect(stats).toEqual({
      total: 4,
      weak: 1,
      learning: 1,
      mastered: 2,
      averageMastery: 60,
    })
  })

  it("returns zeroed stats for an empty deck", () => {
    expect(computeVocabStats([])).toEqual({
      total: 0,
      weak: 0,
      learning: 0,
      mastered: 0,
      averageMastery: 0,
    })
  })
})
