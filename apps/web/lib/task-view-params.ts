// URL <-> task filter/sort state for the All Tasks page.
//
// Pure and total: `decode` never throws and never returns a partially-valid
// shape — unknown chips, statuses, sorts and malformed dates fall back to the
// default rather than producing a filter nothing can match. That matters
// because these values arrive from a pasted link, not from our own UI.
//
// Only non-default values are written, so a clean view has a clean URL.

import {
  EMPTY_TASK_FILTERS,
  TASK_CHIPS,
  TASK_SORTS,
  type TaskChip,
  type TaskFilters,
  type TaskSort,
} from "@/lib/task-views"
import { TASK_STATUSES, type TaskStatus } from "@/lib/task-status"

export const TASK_VIEW_PARAM_KEYS = [
  "chip",
  "q",
  "status",
  "phase",
  "kr",
  "impact",
  "sched",
  "from",
  "to",
  "evidence",
  "source",
  "sort",
] as const

const YMD = /^\d{4}-\d{2}-\d{2}$/
const IMPACTS = ["low", "medium", "high"] as const
const SOURCES = ["manual", "ai", "template"] as const
const SCHEDULED = ["any", "scheduled", "unscheduled"] as const

type ReadableParams = Pick<URLSearchParams, "get">

/** Split a comma-separated param and keep only values in `allowed`. */
function decodeList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  const permitted = new Set<string>(allowed)
  return [...new Set(raw.split(",").map((v) => v.trim()).filter((v) => permitted.has(v)))] as T[]
}

/** Same split/dedupe, but for opaque ids we can't validate against a list. */
function decodeOpaqueList(raw: string | null): string[] {
  if (!raw) return []
  return [...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean))]
}

const decodeYmd = (raw: string | null): string | null => (raw && YMD.test(raw) ? raw : null)

export function decodeTaskViewParams(params: ReadableParams): {
  filters: TaskFilters
  sort: TaskSort
} {
  const chipRaw = params.get("chip")
  const chip = (TASK_CHIPS.some((c) => c.value === chipRaw) ? chipRaw : "all") as TaskChip

  const sortRaw = params.get("sort")
  const sort = (TASK_SORTS.some((s) => s.value === sortRaw) ? sortRaw : "smart") as TaskSort

  const dateFrom = decodeYmd(params.get("from"))
  let dateTo = decodeYmd(params.get("to"))
  // An inverted range would silently match nothing; drop the bound rather than
  // showing an empty list with no explanation.
  if (dateFrom && dateTo && dateFrom > dateTo) dateTo = null

  const scheduledRaw = params.get("sched")
  const scheduled = (
    SCHEDULED.includes(scheduledRaw as (typeof SCHEDULED)[number]) ? scheduledRaw : "any"
  ) as TaskFilters["scheduled"]

  return {
    sort,
    filters: {
      chip,
      search: params.get("q") ?? "",
      statuses: decodeList<TaskStatus>(params.get("status"), TASK_STATUSES),
      // Phase/key-result ids are opaque, so any non-empty token is accepted.
      // One that no longer exists simply matches nothing — the honest result
      // for a stale link, and cheaper than validating against a list this pure
      // function doesn't have.
      phaseIds: decodeOpaqueList(params.get("phase")),
      keyResultIds: decodeOpaqueList(params.get("kr")),
      impacts: decodeList(params.get("impact"), IMPACTS),
      scheduled,
      dateFrom,
      dateTo,
      evidenceRequired: params.get("evidence") === "1",
      sources: decodeList(params.get("source"), SOURCES),
    },
  }
}

/**
 * Encode to a query string, omitting anything at its default so an unfiltered
 * view produces an empty string (and a clean URL).
 */
export function encodeTaskViewParams(filters: TaskFilters, sort: TaskSort): string {
  const params = new URLSearchParams()
  const setList = (key: string, values: string[]) => {
    if (values.length > 0) params.set(key, values.join(","))
  }

  if (filters.chip !== EMPTY_TASK_FILTERS.chip) params.set("chip", filters.chip)
  if (filters.search.trim()) params.set("q", filters.search.trim())
  setList("status", filters.statuses)
  setList("phase", filters.phaseIds)
  setList("kr", filters.keyResultIds)
  setList("impact", filters.impacts)
  if (filters.scheduled !== "any") params.set("sched", filters.scheduled)
  if (filters.dateFrom) params.set("from", filters.dateFrom)
  if (filters.dateTo) params.set("to", filters.dateTo)
  if (filters.evidenceRequired) params.set("evidence", "1")
  setList("source", filters.sources)
  if (sort !== "smart") params.set("sort", sort)

  return params.toString()
}

/**
 * Merge encoded task-view state into an existing query string, preserving
 * unrelated params (e.g. `?task=` deep links) and clearing keys that fell back
 * to their default.
 */
export function mergeTaskViewParams(
  current: ReadableParams & Iterable<[string, string]>,
  filters: TaskFilters,
  sort: TaskSort,
): string {
  const next = new URLSearchParams()
  for (const [key, value] of current) {
    if (!(TASK_VIEW_PARAM_KEYS as readonly string[]).includes(key)) next.append(key, value)
  }
  for (const [key, value] of new URLSearchParams(encodeTaskViewParams(filters, sort))) {
    next.set(key, value)
  }
  return next.toString()
}
