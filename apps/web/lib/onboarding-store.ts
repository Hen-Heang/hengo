// Tracks whether the first-run onboarding wizard has been shown, and holds the
// daily-target preference it collects. Both are client-only (no backend column
// for either), scoped per user id so a shared browser doesn't leak state
// across accounts. The daily goal minutes value also feeds
// progressApi.getDashboard's "Daily Goal" ring.
const ONBOARDING_KEY_PREFIX = "hengo:onboarding:"
const DAILY_GOAL_KEY = "hengo:daily-goal-minutes"

export const DEFAULT_DAILY_GOAL_MINUTES = 15

export function hasCompletedOnboarding(userId: string | null): boolean {
  if (typeof window === "undefined" || !userId) return true
  return window.localStorage.getItem(ONBOARDING_KEY_PREFIX + userId) === "done"
}

export function markOnboardingComplete(userId: string | null) {
  if (typeof window === "undefined" || !userId) return
  window.localStorage.setItem(ONBOARDING_KEY_PREFIX + userId, "done")
}

export function getDailyGoalMinutes(): number {
  if (typeof window === "undefined") return DEFAULT_DAILY_GOAL_MINUTES
  const raw = window.localStorage.getItem(DAILY_GOAL_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_GOAL_MINUTES
}

export function setDailyGoalMinutes(minutes: number) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DAILY_GOAL_KEY, String(minutes))
}
