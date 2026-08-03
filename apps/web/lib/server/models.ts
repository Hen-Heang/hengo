// Allowlist for the OpenAI models the app is allowed to call. Request bodies
// and stored profile preferences carry a free-text model string end to end
// (userApi.updatePreferredModel → kori_profiles.preferred_model → aiModel()),
// so both ends must resolve through here instead of passing the string
// straight into the model factory.
export const ALLOWED_AI_MODELS = ["gpt-5-mini", "gpt-5-nano"] as const

export type AllowedModel = (typeof ALLOWED_AI_MODELS)[number]

function isAllowedModel(value: string): value is AllowedModel {
  return (ALLOWED_AI_MODELS as readonly string[]).includes(value)
}

const ENV_MODEL = process.env.AI_MODEL
export const DEFAULT_ALLOWED_MODEL: AllowedModel =
  ENV_MODEL && isAllowedModel(ENV_MODEL) ? ENV_MODEL : "gpt-5-mini"

/** Resolves a possibly-untrusted requested model name to one on the
 *  allowlist, falling back to the configured default instead of throwing —
 *  callers (chat route, profile update) treat "unknown model" as "use default". */
export function resolveAllowedModel(requested?: string | null): AllowedModel {
  if (requested && isAllowedModel(requested)) return requested
  return DEFAULT_ALLOWED_MODEL
}
