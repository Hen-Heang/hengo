// Tracks whether the first-run onboarding wizard has been shown. Client-only,
// scoped per user id so a shared browser doesn't leak state across accounts.
//
// The daily-target the wizard collects used to live here too, in
// localStorage under "hengo:daily-goal-minutes" with a default of 15 — which
// is where /home's "Today's Korean · 15 min" came from. It is now
// kori_korean_coach_preferences.daily_practice_goal_minutes, the same value
// /korean-coach/preferences edits, so there is one daily goal instead of a
// per-browser one and a server one that never agreed.
const ONBOARDING_KEY_PREFIX = "hengo:onboarding:"

export function hasCompletedOnboarding(userId: string | null): boolean {
  if (typeof window === "undefined" || !userId) return true
  return window.localStorage.getItem(ONBOARDING_KEY_PREFIX + userId) === "done"
}

export function markOnboardingComplete(userId: string | null) {
  if (typeof window === "undefined" || !userId) return
  window.localStorage.setItem(ONBOARDING_KEY_PREFIX + userId, "done")
}
