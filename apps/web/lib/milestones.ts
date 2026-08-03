// Shared identity-phase framing for Growth-workspace modules (Habits,
// Recovery) — a meaningful phase name reads calmer than a raw day count and
// keeps both modules' progress language in sync from one place.
export type MilestonePhase =
  | "detox"
  | "momentum"
  | "foundation"
  | "consistency"
  | "identity"
  | "lifestyle"
  | "mastery"

export const MILESTONE_LABELS: Record<MilestonePhase, string> = {
  detox: "Detox",
  momentum: "Momentum",
  foundation: "Foundation",
  consistency: "Consistency",
  identity: "Identity",
  lifestyle: "Lifestyle",
  mastery: "Mastery",
}

// Ascending day thresholds — the day a phase begins.
const THRESHOLDS: Array<{ phase: MilestonePhase; fromDay: number }> = [
  { phase: "detox", fromDay: 0 },
  { phase: "momentum", fromDay: 4 },
  { phase: "foundation", fromDay: 14 },
  { phase: "consistency", fromDay: 30 },
  { phase: "identity", fromDay: 60 },
  { phase: "lifestyle", fromDay: 100 },
  { phase: "mastery", fromDay: 180 },
]

export function milestonePhase(daysActive: number): MilestonePhase {
  const days = Math.max(0, daysActive)
  let current: MilestonePhase = THRESHOLDS[0].phase
  for (const { phase, fromDay } of THRESHOLDS) {
    if (days >= fromDay) current = phase
    else break
  }
  return current
}

/** The next phase and how many days away it is, or null once at Mastery. */
export function nextMilestone(daysActive: number): { phase: MilestonePhase; daysRemaining: number } | null {
  const days = Math.max(0, daysActive)
  const next = THRESHOLDS.find((t) => t.fromDay > days)
  if (!next) return null
  return { phase: next.phase, daysRemaining: next.fromDay - days }
}
