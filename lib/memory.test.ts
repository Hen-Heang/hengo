import { describe, expect, it } from "vitest"
import {
  filterMemoryCandidatesByStatus,
  sanitizeSearchQuery,
  sortMemoryCandidates,
  validateMemoryCandidateInput,
  type MemoryCandidate,
} from "./memory"

function candidate(overrides: Partial<MemoryCandidate> = {}): MemoryCandidate {
  return {
    id: "1",
    fact: "Prefers concise code review feedback",
    category: "preference",
    sourceType: "conversation",
    sourceId: null,
    confidence: 0.7,
    status: "proposed",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("validateMemoryCandidateInput", () => {
  it("rejects an empty fact", () => {
    expect(validateMemoryCandidateInput({ fact: "  " }).fact).toBeTruthy()
  })

  it("rejects a fact over 500 characters", () => {
    expect(validateMemoryCandidateInput({ fact: "a".repeat(501) }).fact).toBeTruthy()
  })

  it("accepts a normal fact", () => {
    expect(validateMemoryCandidateInput({ fact: "Uses pnpm, not npm" })).toEqual({})
  })
})

describe("filterMemoryCandidatesByStatus", () => {
  const candidates = [
    candidate({ id: "1", status: "proposed" }),
    candidate({ id: "2", status: "approved" }),
    candidate({ id: "3", status: "rejected" }),
  ]

  it("filters by a specific status", () => {
    expect(filterMemoryCandidatesByStatus(candidates, "approved").map((c) => c.id)).toEqual(["2"])
  })

  it("returns everything for 'all'", () => {
    expect(filterMemoryCandidatesByStatus(candidates, "all")).toHaveLength(3)
  })
})

describe("sortMemoryCandidates", () => {
  it("sorts newest first", () => {
    const candidates = [
      candidate({ id: "old", createdAt: "2026-01-01T00:00:00.000Z" }),
      candidate({ id: "new", createdAt: "2026-07-01T00:00:00.000Z" }),
    ]
    expect(sortMemoryCandidates(candidates).map((c) => c.id)).toEqual(["new", "old"])
  })
})

describe("sanitizeSearchQuery", () => {
  it("strips quotes and parens that could break tsquery parsing", () => {
    expect(sanitizeSearchQuery(`What did I learn about "Spring Security" (recently)?`)).toBe(
      "What did I learn about  Spring Security   recently ?",
    )
  })

  it("caps length", () => {
    expect(sanitizeSearchQuery("a".repeat(300)).length).toBe(200)
  })

  it("trims whitespace", () => {
    expect(sanitizeSearchQuery("  hello  ")).toBe("hello")
  })
})
