// Backend-backed reading PROGRESS store. The backend (/api/reading/progress)
// is the source of truth so completion/quiz state syncs across devices; this
// module keeps an in-memory cache and exposes a useSyncExternalStore-compatible
// API plus async mutation helpers. Mirrors lib/reading-store.ts (units).
import { readingApi } from "@/lib/api"
import type { ReadingProgressEntry } from "@/lib/reading"

const EMPTY: Record<string, ReadingProgressEntry> = {}

let snapshot: Record<string, ReadingProgressEntry> | null = null
let loadedOnce = false
let inflight: Promise<Record<string, ReadingProgressEntry>> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function toMap(records: ({ unitId: string } & ReadingProgressEntry)[]) {
  const map: Record<string, ReadingProgressEntry> = {}
  for (const r of records) {
    map[r.unitId] = {
      status: r.status,
      quizScore: r.quizScore,
      quizTotal: r.quizTotal,
      completedAt: r.completedAt,
      pinned: r.pinned,
    }
  }
  return map
}

/** Fetch all progress from the backend (deduped while a request is in flight). */
export function loadReadingProgress(): Promise<Record<string, ReadingProgressEntry>> {
  if (inflight) return inflight
  inflight = readingApi
    .getProgress()
    .then((records) => {
      snapshot = toMap(records)
      loadedOnce = true
      emit()
      return snapshot
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

// ── useSyncExternalStore API ──

export function subscribeReadingProgress(callback: () => void) {
  listeners.add(callback)
  if (!loadedOnce && !inflight) void loadReadingProgress()
  return () => {
    listeners.delete(callback)
  }
}

export function getReadingProgress(): Record<string, ReadingProgressEntry> {
  return snapshot ?? EMPTY
}

export function getReadingProgressServerSnapshot(): Record<string, ReadingProgressEntry> {
  return EMPTY
}

export function getUnitProgress(unitId: string): ReadingProgressEntry {
  return getReadingProgress()[unitId] ?? { status: "not_started" }
}

// ── Mutations (keep the in-memory cache in sync) ──

export async function markUnitStarted(unitId: string) {
  const current = getUnitProgress(unitId)
  if (current.status === "completed" || current.status === "in_progress") return
  const record = await readingApi.startUnit(unitId)
  snapshot = { ...getReadingProgress(), [unitId]: record }
  loadedOnce = true
  emit()
}

export async function markUnitCompleted(unitId: string) {
  const record = await readingApi.completeUnit(unitId)
  snapshot = { ...getReadingProgress(), [unitId]: record }
  loadedOnce = true
  emit()
}

export async function markUnitQuizResult(unitId: string, score: number, total: number) {
  const record = await readingApi.submitQuizResult(unitId, score, total)
  snapshot = { ...getReadingProgress(), [unitId]: record }
  loadedOnce = true
  emit()
  return record.status === "completed"
}

export async function toggleUnitPinned(unitId: string) {
  const pinned = !getUnitProgress(unitId).pinned
  const record = await readingApi.setUnitPinned(unitId, pinned)
  snapshot = { ...getReadingProgress(), [unitId]: record }
  loadedOnce = true
  emit()
  return pinned
}

/** Drop the cached progress for a unit (used when the unit is deleted). */
export function removeUnitProgress(unitId: string) {
  const current = getReadingProgress()
  if (!current[unitId]) return
  const progress = { ...current }
  delete progress[unitId]
  snapshot = progress
  emit()
}
