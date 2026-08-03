import { describe, expect, it } from "vitest"

import {
  buildEntryFromTemplate,
  collectJournalTags,
  filterJournalEntries,
  isJournalEntryInputValid,
  sortJournalEntries,
  validateJournalEntryInput,
  type JournalEntry,
} from "./journal"

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "1",
    occurredAt: "2026-07-20T09:00:00.000Z",
    title: null,
    content: "Made progress",
    mood: null,
    energy: null,
    achievement: null,
    blocker: null,
    lesson: null,
    gratitude: null,
    tags: [],
    goalId: null,
    habitId: null,
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
    ...overrides,
  }
}

describe("validateJournalEntryInput", () => {
  it("rejects a completely blank entry", () => {
    expect(validateJournalEntryInput({}).overall).toBeTruthy()
  })

  it("accepts an entry with only a mood rating", () => {
    expect(isJournalEntryInputValid({ mood: 3 })).toBe(true)
  })

  it("accepts an entry with only free content", () => {
    expect(isJournalEntryInputValid({ content: "Quiet day" })).toBe(true)
  })

  it("accepts an entry with only a single structured field", () => {
    expect(isJournalEntryInputValid({ achievement: "Fixed the bug" })).toBe(true)
  })

  it("rejects an out-of-range mood", () => {
    expect(validateJournalEntryInput({ content: "x", mood: 6 }).mood).toBeTruthy()
  })

  it("rejects a non-integer energy value", () => {
    expect(validateJournalEntryInput({ content: "x", energy: 2.5 }).energy).toBeTruthy()
  })
})

describe("buildEntryFromTemplate", () => {
  it("maps achievement/lesson/blocker to their own fields", () => {
    const result = buildEntryFromTemplate({
      achievement: "Shipped the feature",
      lesson: "Learned about generated columns",
      blocker: "Race condition",
    })
    expect(result.achievement).toBe("Shipped the feature")
    expect(result.lesson).toBe("Learned about generated columns")
    expect(result.blocker).toBe("Race condition")
  })

  it("folds the 'tomorrow' answer into content since there's no dedicated column", () => {
    const result = buildEntryFromTemplate({ tomorrow: "Review the PR" })
    expect(result.content).toContain("Review the PR")
  })

  it("omits fields left blank", () => {
    const result = buildEntryFromTemplate({ achievement: "  " })
    expect(result.achievement).toBeUndefined()
  })
})

describe("filterJournalEntries", () => {
  const entries = [
    makeEntry({ id: "a", tags: ["work"], goalId: "g1", content: "Fixed the login bug" }),
    makeEntry({ id: "b", tags: ["korean"], goalId: null, achievement: "Practiced speaking" }),
    makeEntry({ id: "c", tags: ["work", "reflection"], goalId: "g2" }),
  ]

  it("filters by tag", () => {
    expect(filterJournalEntries(entries, { tag: "korean" }).map((e) => e.id)).toEqual(["b"])
  })

  it("filters by goal", () => {
    expect(filterJournalEntries(entries, { goalId: "g1" }).map((e) => e.id)).toEqual(["a"])
  })

  it("matches query against content and structured fields", () => {
    expect(filterJournalEntries(entries, { query: "login" }).map((e) => e.id)).toEqual(["a"])
    expect(filterJournalEntries(entries, { query: "speaking" }).map((e) => e.id)).toEqual(["b"])
  })
})

describe("sortJournalEntries", () => {
  it("sorts newest first", () => {
    const entries = [
      makeEntry({ id: "old", occurredAt: "2026-07-01T00:00:00.000Z" }),
      makeEntry({ id: "new", occurredAt: "2026-07-20T00:00:00.000Z" }),
    ]
    expect(sortJournalEntries(entries).map((e) => e.id)).toEqual(["new", "old"])
  })
})

describe("collectJournalTags", () => {
  it("returns distinct sorted tags", () => {
    const entries = [makeEntry({ tags: ["b", "a"] }), makeEntry({ tags: ["a", "c"] })]
    expect(collectJournalTags(entries)).toEqual(["a", "b", "c"])
  })
})
