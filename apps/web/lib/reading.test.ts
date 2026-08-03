import { describe, expect, it } from "vitest"

import { createReadingUnitId, mergeReadingUnits, type ReadingUnit } from "./reading"

function makeUnit(id: string, title = id): ReadingUnit {
  return {
    id,
    title,
    titleEnglish: title,
    category: "DAILY_LIFE",
    level: "Beginner",
    summary: "",
    source: "test",
    paragraphs: [{ korean: "안녕하세요", english: "Hello" }],
    vocab: [],
    quiz: [],
  }
}

describe("mergeReadingUnits", () => {
  const builtins = [makeUnit("a"), makeUnit("b")]

  it("returns builtins unchanged when nothing is stored", () => {
    expect(mergeReadingUnits(builtins, {})).toEqual(builtins)
  })

  it("overrides a builtin with the stored version of the same id", () => {
    const edited = makeUnit("a", "edited title")
    const result = mergeReadingUnits(builtins, { a: edited })
    expect(result[0].title).toBe("edited title")
    expect(result).toHaveLength(2)
  })

  it("hides a builtin stored as null", () => {
    const result = mergeReadingUnits(builtins, { a: null })
    expect(result.map((u) => u.id)).toEqual(["b"])
  })

  it("appends custom units after the builtins", () => {
    const custom = makeUnit("my-unit")
    const result = mergeReadingUnits(builtins, { "my-unit": custom })
    expect(result.map((u) => u.id)).toEqual(["a", "b", "my-unit"])
  })
})

describe("createReadingUnitId", () => {
  it("slugifies the title", () => {
    expect(createReadingUnitId("My First Article!", new Set())).toBe("my-first-article")
  })

  it("keeps Korean characters", () => {
    expect(createReadingUnitId("한국의 카페", new Set())).toBe("한국의-카페")
  })

  it("appends a suffix when the id is taken", () => {
    const taken = new Set(["cafe", "cafe-2"])
    expect(createReadingUnitId("Cafe", taken)).toBe("cafe-3")
  })

  it("falls back to 'unit' for empty titles", () => {
    expect(createReadingUnitId("!!!", new Set())).toBe("unit")
  })
})
