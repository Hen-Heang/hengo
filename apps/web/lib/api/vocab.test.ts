// Read-only tests for vocabApi's collection query.
//
// SAFETY: `@/lib/supabase` is replaced wholesale by an in-memory fake before
// the module under test is imported, so no network client is ever built and
// nothing here can reach a live project. These tests only read.

import { beforeEach, describe, expect, it, vi } from "vitest"

// ── In-memory Supabase fake ─────────────────────────────────────────────────
//
// Models the one PostgREST behaviour that caused the bug: the server refuses
// to return more than `maxRows` rows in a single response, and says nothing
// about it — the client just gets a short array with `error: null`.

type Row = Record<string, unknown>

let tableRows: Row[] = []
let maxRows = 1000
/** Every `.range(from, to)` window the client asked for, in order. */
let requestedRanges: [number, number][] = []

function makeRow(index: number): Row {
  return {
    id: `card-${index}`,
    category: index % 2 === 0 ? "Work" : "Daily life",
    term: `단어${index}`,
    meaning: `word ${index}`,
    pronunciation: null,
    example: null,
    example_translation: null,
    difficulty_level: null,
    tags: [],
    mastery: 0,
    next_review: "2026-09-08T12:00:00.000Z",
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    lapses: 0,
  }
}

vi.mock("@/lib/supabase", () => {
  const builder = {
    select: () => builder,
    order: () => builder,
    lte: () => builder,
    limit: () => Promise.resolve({ data: [], error: null }),
    range: (from: number, to: number) => {
      requestedRanges.push([from, to])
      const requested = tableRows.slice(from, to + 1)
      return Promise.resolve({ data: requested.slice(0, maxRows), error: null })
    },
    // Awaiting the builder with no .range() is the pre-fix code path. It has
    // to be modelled too, or the regression test below would merely crash on
    // the old implementation instead of failing on the wrong row count.
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
      resolve({ data: tableRows.slice(0, maxRows), error: null }),
  }
  return { supabase: { from: () => builder } }
})

// Imported after the mock is registered.
const { vocabApi } = await import("./vocab")

beforeEach(() => {
  tableRows = []
  maxRows = 1000
  requestedRanges = []
})

describe("vocabApi.getSavedWords", () => {
  it("returns the whole collection when it fits in one response", async () => {
    tableRows = Array.from({ length: 42 }, (_, i) => makeRow(i))
    const words = await vocabApi.getSavedWords()
    expect(words).toHaveLength(42)
  })

  // The regression this whole fix exists for: /vocab reported 1,000 saved
  // words next to 1,107 due, because an unbounded select silently stopped at
  // the project's max-rows cap and every client-side statistic was computed
  // over that truncated slice.
  it("pages past the server's row cap instead of silently truncating", async () => {
    tableRows = Array.from({ length: 1107 }, (_, i) => makeRow(i))
    maxRows = 1000

    const words = await vocabApi.getSavedWords()

    expect(words).toHaveLength(1107)
    expect(new Set(words.map((w) => w.id)).size).toBe(1107)
  })

  it("stays correct when the cap is smaller than the page size", async () => {
    tableRows = Array.from({ length: 1250 }, (_, i) => makeRow(i))
    // A project configured well below the requested page size: advancing by a
    // fixed page size instead of by rows-actually-returned would skip rows.
    maxRows = 400

    const words = await vocabApi.getSavedWords()

    expect(words).toHaveLength(1250)
    expect(new Set(words.map((w) => w.id)).size).toBe(1250)
    expect(words.map((w) => w.id)).toEqual(tableRows.map((r) => r.id))
  })

  it("asks for contiguous, non-overlapping windows", async () => {
    tableRows = Array.from({ length: 2500 }, (_, i) => makeRow(i))
    maxRows = 1000

    await vocabApi.getSavedWords()

    // Each window must start exactly where the previous one's rows ran out —
    // no gap (dropped rows) and no overlap (duplicated rows).
    let expectedStart = 0
    for (const [from] of requestedRanges) {
      expect(from).toBe(expectedStart)
      expectedStart += Math.min(1000, Math.max(0, tableRows.length - expectedStart))
    }
    // 0-999, 1000-1999, 2000-2499, then one empty page to learn it is done.
    expect(requestedRanges.map(([from]) => from)).toEqual([0, 1000, 2000, 2500])
  })

  it("stops on an empty page rather than looping", async () => {
    tableRows = []
    const words = await vocabApi.getSavedWords()
    expect(words).toEqual([])
    expect(requestedRanges).toHaveLength(1)
  })
})
