// Money Flow integration — typed summary contract only (see
// docs/money-flow-integration.md for the full architecture). No live fetch
// exists yet: real token exchange needs encryption infrastructure this repo
// doesn't have, so this phase ships only the shape + a mocked example so the
// UI can be previewed behind a feature flag (lib/feature-flags.ts).

export interface MoneyFlowSavingsGoal {
  name: string
  externalId: string
  progressPercentage: number
}

/** Mirrors the future `GET /api/integrations/hengo/summary` response on the
 * Money Flow side — summary-only, never raw transactions/accounts/notes. */
export interface MoneyFlowSummary {
  reportingPeriod: { start: string; end: string }
  transactionTrackingDays: number
  budgetHealthStatus: "on_track" | "attention" | "over_budget"
  budgetsWithinLimit: number
  totalBudgetCount: number
  /** e.g. 0.18 = 18% */
  monthlySavingRate: number
  savingsGoals: MoneyFlowSavingsGoal[]
  generatedAt: string
}

/** Example data for the preview card — never presented as real. */
export const MOCK_MONEY_FLOW_SUMMARY: MoneyFlowSummary = {
  reportingPeriod: { start: "2026-07-01", end: "2026-07-23" },
  transactionTrackingDays: 23,
  budgetHealthStatus: "on_track",
  budgetsWithinLimit: 5,
  totalBudgetCount: 6,
  monthlySavingRate: 0.18,
  savingsGoals: [
    { name: "Emergency fund", externalId: "mock-emergency-fund", progressPercentage: 62 },
    { name: "Korea relocation buffer", externalId: "mock-relocation-buffer", progressPercentage: 34 },
  ],
  generatedAt: "2026-07-23T00:00:00.000Z",
}
