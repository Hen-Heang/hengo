// Allowlist for the OpenAI models the app is allowed to call. Model choice is
// deployment config, not a user setting: every route calls aiModel() with no
// argument and gets DEFAULT_ALLOWED_MODEL. The allowlist stays because the one
// remaining input, the AI_MODEL env var, is still a free-text string that must
// not reach the model factory unchecked — a typo there falls back to the
// default instead of failing every AI request at runtime.
export const ALLOWED_AI_MODELS = ["gpt-5-mini", "gpt-5-nano"] as const

export type AllowedModel = (typeof ALLOWED_AI_MODELS)[number]

function isAllowedModel(value: string): value is AllowedModel {
  return (ALLOWED_AI_MODELS as readonly string[]).includes(value)
}

const ENV_MODEL = process.env.AI_MODEL
export const DEFAULT_ALLOWED_MODEL: AllowedModel =
  ENV_MODEL && isAllowedModel(ENV_MODEL) ? ENV_MODEL : "gpt-5-mini"

/** Resolves a requested model name to one on the allowlist, falling back to
 *  the configured default instead of throwing — "unknown model" always means
 *  "use the default" rather than a hard failure. */
export function resolveAllowedModel(requested?: string | null): AllowedModel {
  if (requested && isAllowedModel(requested)) return requested
  return DEFAULT_ALLOWED_MODEL
}
