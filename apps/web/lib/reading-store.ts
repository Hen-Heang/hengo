// Backend-backed reading-unit store. Postgres (via /api/reading/units) is the
// source of truth; this module keeps an in-memory cache and exposes a
// useSyncExternalStore-compatible API plus async create/update/delete helpers.
import { readingApi, type ReadingUnitPayload } from "@/lib/api"
import type { ReadingUnit } from "@/lib/reading"
import { removeUnitProgress } from "@/lib/reading-progress-store"

export type { ReadingUnitPayload }

const EMPTY: ReadingUnit[] = []

let snapshot: ReadingUnit[] | null = null
let loadedOnce = false
let inflight: Promise<ReadingUnit[]> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/** Fetch all units from the backend (deduped while a request is in flight). */
export function loadReadingUnits(): Promise<ReadingUnit[]> {
  if (inflight) return inflight
  inflight = readingApi
    .getUnits()
    .then((units) => {
      snapshot = units
      loadedOnce = true
      emit()
      return units
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

// ── useSyncExternalStore API ──

export function subscribeReadingUnits(callback: () => void) {
  listeners.add(callback)
  if (!loadedOnce && !inflight) void loadReadingUnits()
  return () => {
    listeners.delete(callback)
  }
}

export function getAllReadingUnits(): ReadingUnit[] {
  return snapshot ?? EMPTY
}

export function getReadingUnitsServerSnapshot(): ReadingUnit[] {
  return EMPTY
}

export function isReadingUnitsLoaded() {
  return loadedOnce
}

// ── Mutations (keep the in-memory cache in sync) ──

export async function createReadingUnit(payload: ReadingUnitPayload): Promise<ReadingUnit> {
  const created = await readingApi.createUnit(payload)
  snapshot = [created, ...(snapshot ?? [])]
  loadedOnce = true
  emit()
  return created
}

export async function updateReadingUnit(
  id: string,
  payload: ReadingUnitPayload
): Promise<ReadingUnit> {
  const updated = await readingApi.updateUnit(id, payload)
  snapshot = (snapshot ?? []).map((u) => (u.id === id ? updated : u))
  emit()
  return updated
}

export async function deleteReadingUnit(id: string): Promise<void> {
  await readingApi.deleteUnit(id)
  snapshot = (snapshot ?? []).filter((u) => u.id !== id)
  removeUnitProgress(id)
  emit()
}
