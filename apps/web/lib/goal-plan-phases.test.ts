import { describe, expect, it } from "vitest"
import {
  addDaysYmd,
  milestonesToPhaseDrafts,
  movePhase,
  normalizePositions,
  phaseInputSchema,
  sortPhases,
} from "./goal-plan-phases"

const phase = (id: string, position: number, created_at = "2026-07-01T00:00:00Z") => ({
  id,
  position,
  created_at,
})

describe("phase ordering", () => {
  it("sorts by position, then created_at, then id", () => {
    const phases = [
      phase("c", 2),
      phase("a", 0),
      phase("b2", 1, "2026-07-02T00:00:00Z"),
      phase("b1", 1, "2026-07-01T00:00:00Z"),
    ]
    expect(sortPhases(phases).map((p) => p.id)).toEqual(["a", "b1", "b2", "c"])
  })

  it("normalises sparse or duplicate positions to a dense sequence", () => {
    const phases = [phase("a", 7), phase("b", 7, "2026-07-02T00:00:00Z"), phase("c", 99)]
    expect(normalizePositions(phases)).toEqual([
      { id: "a", position: 0 },
      { id: "b", position: 1 },
      { id: "c", position: 2 },
    ])
  })

  it("moves a phase up one slot", () => {
    const phases = [phase("a", 0), phase("b", 1), phase("c", 2)]
    expect(movePhase(phases, "c", "up")).toEqual([
      { id: "a", position: 0 },
      { id: "c", position: 1 },
      { id: "b", position: 2 },
    ])
  })

  it("moves a phase down one slot", () => {
    const phases = [phase("a", 0), phase("b", 1), phase("c", 2)]
    expect(movePhase(phases, "a", "down")).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
      { id: "c", position: 2 },
    ])
  })

  it("is a no-op at the ends and for unknown ids", () => {
    const phases = [phase("a", 0), phase("b", 1)]
    const identity = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
    ]
    expect(movePhase(phases, "a", "up")).toEqual(identity)
    expect(movePhase(phases, "b", "down")).toEqual(identity)
    expect(movePhase(phases, "nope", "up")).toEqual(identity)
  })
})

describe("legacy milestone conversion", () => {
  it("orders dated milestones chronologically and tiles the timeline", () => {
    const drafts = milestonesToPhaseDrafts(
      [
        { title: "Script final draft", due_date: "2026-08-19" },
        { title: "Baseline mock", due_date: "2026-07-15" },
      ],
      { goalStartDate: "2026-07-01", goalTargetDate: "2026-09-01" },
    )
    expect(drafts).toEqual([
      {
        title: "Baseline mock",
        objective: null,
        start_date: "2026-07-01",
        end_date: "2026-07-15",
        status: "planned",
        position: 0,
      },
      {
        title: "Script final draft",
        objective: null,
        start_date: "2026-07-16",
        end_date: "2026-08-19",
        status: "planned",
        position: 1,
      },
    ])
  })

  it("marks done milestones as completed phases", () => {
    const [draft] = milestonesToPhaseDrafts([{ title: "Kickoff", due_date: "2026-07-05", done: true }])
    expect(draft.status).toBe("completed")
  })

  it("puts undated milestones after dated ones and gives the last one the goal target", () => {
    const drafts = milestonesToPhaseDrafts(
      [{ title: "Someday" }, { title: "Dated", due_date: "2026-07-10" }],
      { goalStartDate: "2026-07-01", goalTargetDate: "2026-08-01" },
    )
    expect(drafts.map((d) => d.title)).toEqual(["Dated", "Someday"])
    expect(drafts[1].end_date).toBe("2026-08-01")
  })

  it("drops empty titles and never throws on malformed dates", () => {
    const drafts = milestonesToPhaseDrafts([
      { title: "  " },
      { title: "Real", due_date: "not-a-date" },
    ])
    expect(drafts).toHaveLength(1)
    expect(drafts[0].title).toBe("Real")
    expect(drafts[0].end_date).toBeNull()
  })

  it("never emits an inverted date range", () => {
    const drafts = milestonesToPhaseDrafts(
      [{ title: "Before the goal even starts", due_date: "2026-06-01" }],
      { goalStartDate: "2026-07-01" },
    )
    expect(drafts[0].start_date).toBeNull()
    expect(drafts[0].end_date).toBe("2026-06-01")
  })

  it("returns an empty list for an empty checklist", () => {
    expect(milestonesToPhaseDrafts([])).toEqual([])
  })
})

describe("phaseInputSchema", () => {
  it("requires a title", () => {
    expect(phaseInputSchema.safeParse({ title: "" }).success).toBe(false)
  })

  it("rejects an end date before the start date", () => {
    expect(
      phaseInputSchema.safeParse({
        title: "Phase 1",
        start_date: "2026-07-10",
        end_date: "2026-07-01",
      }).success,
    ).toBe(false)
  })

  it("rejects a negative position and a malformed date", () => {
    expect(phaseInputSchema.safeParse({ title: "P", position: -1 }).success).toBe(false)
    expect(phaseInputSchema.safeParse({ title: "P", start_date: "07/01/2026" }).success).toBe(false)
  })
})

describe("addDaysYmd", () => {
  it("crosses month and year boundaries in UTC", () => {
    expect(addDaysYmd("2026-07-31", 1)).toBe("2026-08-01")
    expect(addDaysYmd("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDaysYmd("2026-03-01", -1)).toBe("2026-02-28")
  })
})
