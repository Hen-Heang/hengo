// Minimal, single-purpose feature-flag helper — env-driven, no runtime
// toggle/admin override. Add another `isXEnabled()` export here if a second
// flag is ever needed; don't generalize into a registry until there's a
// second real case.

/**
 * Money Flow integration preview card (see docs/money-flow-integration.md).
 * Off by default — this repo has no token-exchange/encryption
 * infrastructure yet, so the card only ever shows mocked example data, and
 * even that stays hidden unless explicitly opted into.
 */
export const isMoneyFlowIntegrationEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_FEATURE_MONEY_FLOW === "true"
