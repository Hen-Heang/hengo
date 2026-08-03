import { describe, expect, it } from "vitest"

import {
  appendScorecard,
  computeOverall,
  mergeScorecards,
  toScorecardRecord,
  type ScorecardRecord,
} from "./interview-history"
import type { InterviewAttempt } from "./api/interview"
import type { InterviewEvaluation } from "./interview"

const evalWith = (scores: [string, number][]): InterviewEvaluation => ({
  scores: scores.map(([label, score]) => ({ label, score, max: 5 })),
  summary: "",
  advice: [],
})

describe("computeOverall", () => {
  it("averages the criteria on a 0–5 scale", () => {
    expect(computeOverall([
      { label: "Speaking", score: 4, max: 5 },
      { label: "Pronunciation", score: 3, max: 5 },
      { label: "Vocabulary", score: 5, max: 5 },
      { label: "Confidence", score: 4, max: 5 },
    ])).toBe(4) // (4+3+5+4)/4
  })

  it("normalises mixed maxes before averaging", () => {
    // 2/4 -> 2.5/5, and 5/5 -> 5/5 ; average = 3.75
    expect(computeOverall([
      { label: "A", score: 2, max: 4 },
      { label: "B", score: 5, max: 5 },
    ])).toBe(3.8) // 3.75 rounded to 1 dp
  })

  it("returns 0 for no scores", () => {
    expect(computeOverall([])).toBe(0)
  })
})

describe("appendScorecard", () => {
  it("appends a dated record with the computed overall", () => {
    const now = new Date("2026-07-01T10:00:00Z")
    const next = appendScorecard([], evalWith([["Speaking", 4], ["Confidence", 4]]), now)
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ overall: 4, date: now.toISOString() })
    expect(next[0].scores).toHaveLength(2)
  })

  it("ignores an evaluation with no scores", () => {
    const history = appendScorecard([], evalWith([["Speaking", 4]]))
    expect(appendScorecard(history, evalWith([]))).toBe(history)
  })

  it("caps history to the 50 most recent", () => {
    let history = appendScorecard([], evalWith([["Speaking", 3]]))
    for (let i = 0; i < 60; i++) {
      history = appendScorecard(history, evalWith([["Speaking", 4]]))
    }
    expect(history).toHaveLength(50)
    // The oldest (the first 3/5) has been dropped.
    expect(history.every((r) => r.overall === 4)).toBe(true)
  })

  it("uses the provided id and mode when given", () => {
    const next = appendScorecard(
      [],
      evalWith([["Speaking", 4]]),
      new Date("2026-07-14T10:00:00Z"),
      "fixed-id",
      "exam"
    )
    expect(next[0].id).toBe("fixed-id")
    expect(next[0].mode).toBe("exam")
  })
})

const record = (id: string, date: string, overall = 4): ScorecardRecord => ({
  id,
  date,
  overall,
  scores: [{ label: "Speaking", score: overall, max: 5 }],
})

describe("mergeScorecards", () => {
  it("keeps local-only records and dedupes shared ids (remote wins)", () => {
    const local = [record("a", "2026-07-01T10:00:00Z", 3), record("b", "2026-07-02T10:00:00Z", 4)]
    const remote = [record("b", "2026-07-02T10:00:00Z", 5), record("c", "2026-07-03T10:00:00Z", 4)]
    const merged = mergeScorecards(local, remote)
    expect(merged.map((r) => r.id)).toEqual(["a", "b", "c"])
    // Shared id "b" took the remote copy.
    expect(merged[1].overall).toBe(5)
  })

  it("sorts by date ascending regardless of input order", () => {
    const merged = mergeScorecards(
      [record("late", "2026-07-05T10:00:00Z")],
      [record("early", "2026-07-01T10:00:00Z")]
    )
    expect(merged.map((r) => r.id)).toEqual(["early", "late"])
  })

  it("caps the merged list to 50, dropping the oldest", () => {
    const local = Array.from({ length: 30 }, (_, i) =>
      record(`l${i}`, `2026-06-${String(i + 1).padStart(2, "0")}T10:00:00Z`)
    )
    const remote = Array.from({ length: 30 }, (_, i) =>
      record(`r${i}`, `2026-07-${String(i + 1).padStart(2, "0")}T10:00:00Z`)
    )
    const merged = mergeScorecards(local, remote)
    expect(merged).toHaveLength(50)
    // The newest record survives; the oldest local ones were dropped.
    expect(merged[merged.length - 1].id).toBe("r29")
    expect(merged.some((r) => r.id === "l0")).toBe(false)
  })
})

describe("toScorecardRecord", () => {
  it("maps a Supabase attempt into the trend's record shape", () => {
    const attempt: InterviewAttempt = {
      id: "att-1",
      mode: "exam",
      topicId: "weather",
      scores: [{ label: "Speaking", score: 4, max: 5 }],
      overall: 4,
      summary: "Good.",
      advice: ["Keep going."],
      analytics: null,
      questionCount: 6,
      durationSeconds: 540,
      createdAt: "2026-07-14T09:00:00Z",
    }
    expect(toScorecardRecord(attempt)).toEqual({
      id: "att-1",
      date: "2026-07-14T09:00:00Z",
      overall: 4,
      scores: [{ label: "Speaking", score: 4, max: 5 }],
      mode: "exam",
    })
  })
})
