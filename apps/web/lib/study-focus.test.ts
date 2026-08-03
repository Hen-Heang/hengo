import { describe, expect, it } from "vitest"

import { getStudyFocus } from "./study-focus"
import type { DashboardStats } from "./types"

function stats(overrides: Partial<DashboardStats>): DashboardStats {
  return {
    streakDays: 0,
    weeklyMinutes: 0,
    wordsSaved: 0,
    correctionsThisWeek: 0,
    dailyGoalProgress: 0,
    reviewsToday: 0,
    correctionsToday: 0,
    dueReviews: 0,
    ...overrides,
  }
}

describe("getStudyFocus", () => {
  it("prioritizes daily momentum when the goal progress is low", () => {
    expect(
      getStudyFocus(
        stats({
          streakDays: 2,
          weeklyMinutes: 25,
          wordsSaved: 20,
          correctionsThisWeek: 5,
          dailyGoalProgress: 15,
        })
      )
    ).toMatchObject({
      ctaHref: "/chat",
      badge: "Start strong",
    })
  })

  it("recommends vocabulary work when the deck is still small", () => {
    expect(
      getStudyFocus(
        stats({
          streakDays: 7,
          weeklyMinutes: 80,
          wordsSaved: 6,
          correctionsThisWeek: 5,
          dailyGoalProgress: 70,
        })
      )
    ).toMatchObject({
      ctaHref: "/vocab",
      badge: "Grow your deck",
    })
  })

  it("falls back to output practice when the learner is already on track", () => {
    expect(
      getStudyFocus(
        stats({
          streakDays: 10,
          weeklyMinutes: 120,
          wordsSaved: 30,
          correctionsThisWeek: 4,
          dailyGoalProgress: 80,
        })
      )
    ).toMatchObject({
      ctaHref: "/practice",
      badge: "Keep momentum",
    })
  })
})
