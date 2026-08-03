import { describe, expect, it } from "vitest"

import { dedupeSlug, slugify } from "./slug"

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Spring Security JWT notes!")).toBe("spring-security-jwt-notes")
  })

  it("collapses repeated whitespace and punctuation", () => {
    expect(slugify("  Hello   World -- Again  ")).toBe("hello-world-again")
  })

  it("falls back to an empty string for input with no alphanumerics", () => {
    expect(slugify("!!!")).toBe("")
  })
})

describe("dedupeSlug", () => {
  it("returns the slug unchanged when there is no collision", () => {
    expect(dedupeSlug("hello", ["other"])).toBe("hello")
  })

  it("appends a numeric suffix on collision", () => {
    expect(dedupeSlug("hello", ["hello"])).toBe("hello-2")
  })

  it("finds the next free suffix", () => {
    expect(dedupeSlug("hello", ["hello", "hello-2"])).toBe("hello-3")
  })
})
