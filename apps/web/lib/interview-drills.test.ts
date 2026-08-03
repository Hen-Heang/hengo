import { describe, expect, it } from "vitest"

import {
  averageSpeakingScores,
  buildDrillQueue,
  DRILL_SIZE,
  LISTENING_LEVELS,
  pickStyleExamples,
  replaceUnseenTail,
  staticQuestionPool,
  toFallbackEnriched,
  type SpeakingScores,
} from "./interview-drills"

// Deterministic LCG, mirrors interview-unexpected.test.ts.
function seededRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const scores = (n: number): SpeakingScores => ({
  speaking: n,
  grammar: n,
  vocabulary: n,
  pronunciation: n,
  confidence: n,
  naturalness: n,
})

describe("staticQuestionPool", () => {
  it("unions the topic prep questions with the off-topic pool", () => {
    const pool = staticQuestionPool()
    expect(pool.length).toBeGreaterThanOrEqual(50)
    for (const q of pool) {
      expect(q.ko.trim()).not.toBe("")
      expect(q.en.trim()).not.toBe("")
    }
  })
})

describe("buildDrillQueue", () => {
  it("returns DRILL_SIZE distinct pool members by default", () => {
    const queue = buildDrillQueue(undefined, seededRng(1))
    expect(queue).toHaveLength(DRILL_SIZE)
    expect(new Set(queue.map((q) => q.ko)).size).toBe(DRILL_SIZE)
    const poolKos = new Set(staticQuestionPool().map((q) => q.ko))
    for (const q of queue) expect(poolKos.has(q.ko)).toBe(true)
  })

  it("varies between sessions", () => {
    const a = buildDrillQueue(5, seededRng(1)).map((q) => q.ko)
    const b = buildDrillQueue(5, seededRng(2)).map((q) => q.ko)
    expect(a).not.toEqual(b)
  })

  it("clamps when size exceeds the pool", () => {
    expect(buildDrillQueue(10_000, seededRng(3))).toHaveLength(staticQuestionPool().length)
  })
})

describe("toFallbackEnriched", () => {
  it("adds empty glosses and grammar note", () => {
    expect(toFallbackEnriched({ ko: "질문", en: "question" })).toEqual({
      ko: "질문",
      en: "question",
      glosses: [],
      grammarNote: "",
    })
  })
})

describe("replaceUnseenTail", () => {
  const queue = ["a", "b", "c", "d", "e"]

  it("never replaces already-shown items", () => {
    const next = replaceUnseenTail(queue, ["X", "Y", "Z", "W"], 2)
    expect(next.slice(0, 2)).toEqual(["a", "b"])
    expect(next).toEqual(["a", "b", "X", "Y", "Z"])
  })

  it("keeps the original remainder when fresh is shorter than the tail", () => {
    expect(replaceUnseenTail(queue, ["X"], 2)).toEqual(["a", "b", "X", "d", "e"])
  })

  it("is a no-op when everything has been shown or fresh is empty", () => {
    expect(replaceUnseenTail(queue, ["X"], 5)).toBe(queue)
    expect(replaceUnseenTail(queue, [], 0)).toBe(queue)
  })

  it("replaces the whole queue at nextIndex 0", () => {
    expect(replaceUnseenTail(queue, ["V", "W", "X", "Y", "Z"], 0)).toEqual([
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ])
  })
})

describe("pickStyleExamples", () => {
  it("returns 3 Korean questions from the pool", () => {
    const examples = pickStyleExamples(seededRng(4))
    expect(examples).toHaveLength(3)
    const poolKos = new Set(staticQuestionPool().map((q) => q.ko))
    for (const ko of examples) expect(poolKos.has(ko)).toBe(true)
  })
})

describe("averageSpeakingScores", () => {
  it("averages per key with one-decimal rounding", () => {
    const avg = averageSpeakingScores([scores(4), scores(3), scores(5)])
    expect(avg).not.toBeNull()
    expect(avg!.speaking).toBe(4)
    // (4+3+5)/3 = 4.0 for every key
    expect(avg!.naturalness).toBe(4)
    const uneven = averageSpeakingScores([scores(4), scores(5)])
    expect(uneven!.grammar).toBe(4.5)
    const third = averageSpeakingScores([scores(3), scores(4), scores(4)])
    expect(third!.confidence).toBe(3.7) // 3.666… → 3.7
  })

  it("returns null for no results", () => {
    expect(averageSpeakingScores([])).toBeNull()
  })
})

describe("LISTENING_LEVELS", () => {
  it("exam mode is the strictest: one play, no slow, no English", () => {
    const exam = LISTENING_LEVELS.exam
    expect(exam.maxPlays).toBe(1)
    expect(exam.allowSlowReplay).toBe(false)
    expect(exam.showEnglishOnReveal).toBe(false)
  })

  it("easy and medium are unlimited with slow replay and English", () => {
    for (const level of [LISTENING_LEVELS.easy, LISTENING_LEVELS.medium]) {
      expect(level.maxPlays).toBeNull()
      expect(level.allowSlowReplay).toBe(true)
      expect(level.showEnglishOnReveal).toBe(true)
    }
  })

  it("hard limits plays but keeps English on reveal", () => {
    expect(LISTENING_LEVELS.hard.maxPlays).toBe(2)
    expect(LISTENING_LEVELS.hard.showEnglishOnReveal).toBe(true)
  })

  it("every level carries a complexity hint and matching id", () => {
    for (const [key, level] of Object.entries(LISTENING_LEVELS)) {
      expect(level.id).toBe(key)
      expect(level.complexityHint.trim()).not.toBe("")
    }
  })
})
