import { describe, expect, it } from "vitest"

import { parseTagsInput } from "./tags"

describe("parseTagsInput", () => {
  it("trims, lowercases, and dedupes", () => {
    expect(parseTagsInput(" Korean, work , korean ,  ")).toEqual(["korean", "work"])
  })

  it("returns an empty array for blank input", () => {
    expect(parseTagsInput("   ,, ")).toEqual([])
  })

  it("preserves input order of first occurrence", () => {
    expect(parseTagsInput("b, a, b, c")).toEqual(["b", "a", "c"])
  })
})
