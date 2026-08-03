import { describe, expect, it } from "vitest"
import {
  decodeTaskViewParams,
  encodeTaskViewParams,
  mergeTaskViewParams,
} from "./task-view-params"
import { EMPTY_TASK_FILTERS, NONE_FILTER_VALUE, type TaskFilters } from "./task-views"

const decode = (query: string) => decodeTaskViewParams(new URLSearchParams(query))

const filters = (overrides: Partial<TaskFilters> = {}): TaskFilters => ({
  ...EMPTY_TASK_FILTERS,
  ...overrides,
})

describe("decodeTaskViewParams", () => {
  it("returns the defaults for an empty query", () => {
    expect(decode("")).toEqual({ filters: EMPTY_TASK_FILTERS, sort: "smart" })
  })

  it("reads every supported param", () => {
    const { filters: f, sort } = decode(
      "chip=overdue&q=mock&status=blocked,in_progress&phase=p1,p2&kr=kr1" +
        "&impact=high&sched=unscheduled&from=2026-07-01&to=2026-07-31&evidence=1&source=ai&sort=impact",
    )
    expect(sort).toBe("impact")
    expect(f).toEqual(
      filters({
        chip: "overdue",
        search: "mock",
        statuses: ["blocked", "in_progress"],
        phaseIds: ["p1", "p2"],
        keyResultIds: ["kr1"],
        impacts: ["high"],
        scheduled: "unscheduled",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        evidenceRequired: true,
        sources: ["ai"],
      }),
    )
  })

  it("falls back to defaults for unknown chip, sort and schedule values", () => {
    const { filters: f, sort } = decode("chip=bogus&sort=bogus&sched=bogus")
    expect(f.chip).toBe("all")
    expect(f.scheduled).toBe("any")
    expect(sort).toBe("smart")
  })

  it("drops unknown values from validated lists rather than the whole param", () => {
    expect(decode("status=blocked,bogus").filters.statuses).toEqual(["blocked"])
    expect(decode("impact=high,enormous").filters.impacts).toEqual(["high"])
    expect(decode("source=ai,carrier-pigeon").filters.sources).toEqual(["ai"])
    expect(decode("status=bogus").filters.statuses).toEqual([])
  })

  it("keeps the no-phase / no-key-result sentinel", () => {
    expect(decode(`phase=${NONE_FILTER_VALUE}`).filters.phaseIds).toEqual([NONE_FILTER_VALUE])
    expect(decode(`kr=${NONE_FILTER_VALUE}`).filters.keyResultIds).toEqual([NONE_FILTER_VALUE])
  })

  it("dedupes and trims list values", () => {
    expect(decode("phase=p1, p1 ,p2").filters.phaseIds).toEqual(["p1", "p2"])
    expect(decode("status=blocked,blocked").filters.statuses).toEqual(["blocked"])
  })

  it("ignores malformed dates", () => {
    const { filters: f } = decode("from=07%2F01%2F2026&to=not-a-date")
    expect(f.dateFrom).toBeNull()
    expect(f.dateTo).toBeNull()
  })

  it("drops an inverted date range rather than matching nothing", () => {
    const { filters: f } = decode("from=2026-07-31&to=2026-07-01")
    expect(f.dateFrom).toBe("2026-07-31")
    expect(f.dateTo).toBeNull()
  })

  it("treats any evidence value other than 1 as off", () => {
    expect(decode("evidence=1").filters.evidenceRequired).toBe(true)
    expect(decode("evidence=true").filters.evidenceRequired).toBe(false)
    expect(decode("evidence=0").filters.evidenceRequired).toBe(false)
  })

  it("never throws on hostile input", () => {
    expect(() => decode("chip=&status=&phase=,,,&from=&sort=")).not.toThrow()
    expect(decode("phase=,,,").filters.phaseIds).toEqual([])
  })
})

describe("encodeTaskViewParams", () => {
  it("produces an empty string for the default view", () => {
    expect(encodeTaskViewParams(EMPTY_TASK_FILTERS, "smart")).toBe("")
  })

  it("omits defaults and includes only what changed", () => {
    expect(encodeTaskViewParams(filters({ chip: "overdue" }), "smart")).toBe("chip=overdue")
    expect(encodeTaskViewParams(EMPTY_TASK_FILTERS, "impact")).toBe("sort=impact")
  })

  it("trims the search term and drops a whitespace-only one", () => {
    expect(encodeTaskViewParams(filters({ search: "  mock  " }), "smart")).toBe("q=mock")
    expect(encodeTaskViewParams(filters({ search: "   " }), "smart")).toBe("")
  })

  it("round-trips a fully-populated state", () => {
    const original = filters({
      chip: "open",
      search: "mock interview",
      statuses: ["blocked"],
      phaseIds: ["p1", NONE_FILTER_VALUE],
      keyResultIds: ["kr1"],
      impacts: ["high", "medium"],
      scheduled: "scheduled",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      evidenceRequired: true,
      sources: ["ai", "manual"],
    })
    const { filters: decoded, sort } = decode(encodeTaskViewParams(original, "recently_updated"))
    expect(decoded).toEqual(original)
    expect(sort).toBe("recently_updated")
  })
})

describe("mergeTaskViewParams", () => {
  it("preserves unrelated params", () => {
    const current = new URLSearchParams("task=abc123&chip=overdue")
    const merged = new URLSearchParams(
      mergeTaskViewParams(current, filters({ chip: "completed" }), "smart"),
    )
    expect(merged.get("task")).toBe("abc123")
    expect(merged.get("chip")).toBe("completed")
  })

  it("clears keys that fell back to their default", () => {
    const current = new URLSearchParams("chip=overdue&sort=impact&q=old")
    const merged = new URLSearchParams(mergeTaskViewParams(current, EMPTY_TASK_FILTERS, "smart"))
    expect(merged.get("chip")).toBeNull()
    expect(merged.get("sort")).toBeNull()
    expect(merged.get("q")).toBeNull()
  })

  it("returns an empty string when nothing is left", () => {
    expect(mergeTaskViewParams(new URLSearchParams("chip=overdue"), EMPTY_TASK_FILTERS, "smart")).toBe(
      "",
    )
  })
})
