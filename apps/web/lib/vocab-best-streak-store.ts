// Backend-backed store for the all-time best vocab quiz/recall streak
// (/api/vocab/best-streak), so it syncs across devices instead of living only
// in localStorage. Mirrors lib/reading-progress-store.ts's pattern.
import { vocabApi } from "@/lib/api"

let snapshot: number | null = null
let inflight: Promise<number> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/** Fetch the stored best streak from the backend (deduped while in flight). */
export function loadBestStreak(): Promise<number> {
  if (inflight) return inflight
  inflight = vocabApi
    .getBestStreak()
    .then(({ bestStreak }) => {
      snapshot = bestStreak
      emit()
      return bestStreak
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

// ── useSyncExternalStore API ──
// `null` (both as the live and server snapshot) means "not loaded yet" —
// callers render a placeholder ("—") instead of flashing 0 before the real
// value arrives, avoiding a hydration mismatch.

export function subscribeBestStreak(callback: () => void) {
  listeners.add(callback)
  if (snapshot === null && !inflight) void loadBestStreak()
  return () => {
    listeners.delete(callback)
  }
}

export function getBestStreak(): number | null {
  return snapshot
}

export function getBestStreakServerSnapshot(): number | null {
  return null
}

/** A submitted streak only ever raises the stored best; returns the resulting best. */
export async function submitBestStreak(streak: number): Promise<number> {
  const { bestStreak } = await vocabApi.submitBestStreak(streak)
  snapshot = bestStreak
  emit()
  return bestStreak
}
