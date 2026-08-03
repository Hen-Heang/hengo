import { describe, expect, it } from "vitest"

import {
  sampleUnexpectedQuestions,
  UNEXPECTED_QUESTIONS,
} from "./interview-unexpected"

// Simple deterministic LCG so sampling is reproducible in tests.
function seededRng(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe("UNEXPECTED_QUESTIONS", () => {
  it("ships a broad pool with Korean and English for every entry", () => {
    expect(UNEXPECTED_QUESTIONS.length).toBeGreaterThanOrEqual(30)
    for (const q of UNEXPECTED_QUESTIONS) {
      expect(q.ko.trim()).not.toBe("")
      expect(q.en.trim()).not.toBe("")
      expect(q.category).toBeTruthy()
    }
  })

  it("covers several categories", () => {
    const categories = new Set(UNEXPECTED_QUESTIONS.map((q) => q.category))
    expect(categories.size).toBeGreaterThanOrEqual(5)
  })
})

describe("sampleUnexpectedQuestions", () => {
  it("returns the requested number of distinct questions", () => {
    const sample = sampleUnexpectedQuestions(4, seededRng(1))
    expect(sample).toHaveLength(4)
    expect(new Set(sample.map((q) => q.ko)).size).toBe(4)
  })

  it("varies between sessions (different rng streams)", () => {
    const a = sampleUnexpectedQuestions(5, seededRng(1)).map((q) => q.ko)
    const b = sampleUnexpectedQuestions(5, seededRng(2)).map((q) => q.ko)
    expect(a).not.toEqual(b)
  })

  it("clamps when asked for more than the pool holds", () => {
    const sample = sampleUnexpectedQuestions(10_000, seededRng(3))
    expect(sample).toHaveLength(UNEXPECTED_QUESTIONS.length)
  })

  it("returns nothing for zero or negative counts", () => {
    expect(sampleUnexpectedQuestions(0, seededRng(4))).toHaveLength(0)
    expect(sampleUnexpectedQuestions(-2, seededRng(5))).toHaveLength(0)
  })

  it("does not mutate the source pool", () => {
    const before = [...UNEXPECTED_QUESTIONS]
    sampleUnexpectedQuestions(5, seededRng(6))
    expect(UNEXPECTED_QUESTIONS).toEqual(before)
  })
})
