import { describe, expect, it } from "vitest"
import {
  allKeyResultsAchieved,
  clampPercent,
  computeGoalProgress,
  keyResultProgress,
  legacyActivityProgress,
  weightedKeyResultProgress,
} from "./goal-progress"
import type { GoalKeyResult } from "./goal-key-results"

type KR = Pick<
  GoalKeyResult,
  "metric_type" | "baseline_value" | "current_value" | "target_value" | "weight" | "status"
>

const kr = (overrides: Partial<KR>): KR => ({
  metric_type: "number",
  baseline_value: 0,
  current_value: 0,
  target_value: 100,
  weight: 1,
  status: "active",
  ...overrides,
})

describe("clampPercent", () => {
  it("clamps below 0 and above 100", () => {
    expect(clampPercent(-10)).toBe(0)
    expect(clampPercent(150)).toBe(100)
    expect(clampPercent(42)).toBe(42)
  })

  it("treats non-finite values as 0", () => {
    expect(clampPercent(NaN)).toBe(0)
    expect(clampPercent(Infinity)).toBe(0)
  })
})

describe("keyResultProgress — number/count/duration metrics", () => {
  it("computes baseline→target interpolation", () => {
    expect(keyResultProgress(kr({ baseline_value: 0, current_value: 25, target_value: 100 }))).toBe(25)
    expect(keyResultProgress(kr({ baseline_value: 20, current_value: 60, target_value: 100 }))).toBe(50)
  })

  it("clamps over-target values to 100", () => {
    expect(keyResultProgress(kr({ baseline_value: 0, current_value: 150, target_value: 100 }))).toBe(100)
  })

  it("clamps below-baseline values to 0", () => {
    expect(keyResultProgress(kr({ baseline_value: 50, current_value: 10, target_value: 100 }))).toBe(0)
  })

  it("treats a zero baseline as a real starting point, not a missing one", () => {
    expect(keyResultProgress(kr({ baseline_value: 0, current_value: 50, target_value: 100 }))).toBe(50)
  })

  it("defaults a missing (null) baseline to 0", () => {
    expect(keyResultProgress(kr({ baseline_value: null, current_value: 30, target_value: 100 }))).toBe(30)
  })

  it("returns 0 when target_value is missing", () => {
    expect(keyResultProgress(kr({ current_value: 999, target_value: null }))).toBe(0)
  })

  it("treats a missing current_value as still at baseline", () => {
    expect(keyResultProgress(kr({ baseline_value: 10, current_value: null, target_value: 100 }))).toBe(0)
  })

  it("handles baseline === target as a degenerate done/not-done case", () => {
    expect(keyResultProgress(kr({ baseline_value: 100, current_value: 100, target_value: 100 }))).toBe(100)
    expect(keyResultProgress(kr({ baseline_value: 100, current_value: 50, target_value: 100 }))).toBe(0)
  })
})

describe("keyResultProgress — percentage/score metrics", () => {
  it("behaves the same as number metrics (already 0–100 scale)", () => {
    expect(
      keyResultProgress(kr({ metric_type: "percentage", baseline_value: 0, current_value: 42, target_value: 100 })),
    ).toBe(42)
    expect(
      keyResultProgress(kr({ metric_type: "score", baseline_value: 40, current_value: 70, target_value: 90 })),
    ).toBeCloseTo(60, 5)
  })
})

describe("keyResultProgress — boolean metrics", () => {
  it("ignores baseline/target entirely", () => {
    expect(keyResultProgress(kr({ metric_type: "boolean", current_value: 1, target_value: null }))).toBe(100)
    expect(keyResultProgress(kr({ metric_type: "boolean", current_value: 0, target_value: null }))).toBe(0)
    expect(keyResultProgress(kr({ metric_type: "boolean", current_value: null, target_value: 1 }))).toBe(0)
  })
})

describe("weightedKeyResultProgress", () => {
  it("returns null for an empty list", () => {
    expect(weightedKeyResultProgress([])).toBeNull()
  })

  it("returns null when every key result is archived", () => {
    expect(
      weightedKeyResultProgress([kr({ current_value: 100, target_value: 100, status: "archived" })]),
    ).toBeNull()
  })

  it("averages equally-weighted key results", () => {
    const result = weightedKeyResultProgress([
      kr({ current_value: 0, target_value: 100 }), // 0%
      kr({ current_value: 100, target_value: 100 }), // 100%
    ])
    expect(result).toBe(50)
  })

  it("applies weights so a heavier key result dominates the average", () => {
    const result = weightedKeyResultProgress([
      kr({ current_value: 0, target_value: 100, weight: 3 }), // 0%, weight 3
      kr({ current_value: 100, target_value: 100, weight: 1 }), // 100%, weight 1
    ])
    // (0*3 + 100*1) / 4 = 25
    expect(result).toBe(25)
  })

  it("excludes archived key results from both numerator and weight", () => {
    const result = weightedKeyResultProgress([
      kr({ current_value: 0, target_value: 100, weight: 10, status: "archived" }),
      kr({ current_value: 100, target_value: 100, weight: 1 }),
    ])
    expect(result).toBe(100)
  })

  it("clamps a negative or zero total weight to null rather than dividing by it", () => {
    expect(weightedKeyResultProgress([kr({ current_value: 50, target_value: 100, weight: 0 })])).toBeNull()
  })
})

describe("legacyActivityProgress", () => {
  it("labels the fallback percentage from task counts", () => {
    expect(legacyActivityProgress({ total: 4, completed: 2 })).toEqual({
      total: 4,
      completed: 2,
      percentage: 50,
    })
  })

  it("returns 0% for a goal with no tasks at all (not NaN)", () => {
    expect(legacyActivityProgress({ total: 0, completed: 0 })).toEqual({
      total: 0,
      completed: 0,
      percentage: 0,
    })
  })

  it("treats missing task counts (legacy goal shape) as zero", () => {
    expect(legacyActivityProgress(null)).toEqual({ total: 0, completed: 0, percentage: 0 })
    expect(legacyActivityProgress(undefined)).toEqual({ total: 0, completed: 0, percentage: 0 })
  })
})

describe("computeGoalProgress", () => {
  it("keeps outcome and activity progress separate for a goal with key results", () => {
    const result = computeGoalProgress({ total: 10, completed: 10 }, [
      kr({ current_value: 20, target_value: 100 }),
    ])
    expect(result.hasActiveKeyResults).toBe(true)
    expect(result.outcomeProgress).toBe(20)
    expect(result.activityProgress.percentage).toBe(100)
  })

  it("falls back to legacy activity-only progress for a goal with no key results", () => {
    const result = computeGoalProgress({ total: 5, completed: 3 }, [])
    expect(result.hasActiveKeyResults).toBe(false)
    expect(result.outcomeProgress).toBeNull()
    expect(result.activityProgress).toEqual({ total: 5, completed: 3, percentage: 60 })
  })
})

describe("allKeyResultsAchieved", () => {
  it("is false for a goal with no key results (never auto-completes from tasks alone)", () => {
    expect(allKeyResultsAchieved([])).toBe(false)
  })

  it("is true only once every active key result is at or past its target", () => {
    expect(
      allKeyResultsAchieved([
        kr({ current_value: 100, target_value: 100 }),
        kr({ current_value: 50, target_value: 100 }),
      ]),
    ).toBe(false)
    expect(
      allKeyResultsAchieved([
        kr({ current_value: 100, target_value: 100 }),
        kr({ status: "achieved", current_value: 10, target_value: 100 }),
      ]),
    ).toBe(true)
  })

  it("ignores archived key results", () => {
    expect(
      allKeyResultsAchieved([
        kr({ current_value: 100, target_value: 100 }),
        kr({ current_value: 0, target_value: 100, status: "archived" }),
      ]),
    ).toBe(true)
  })
})
