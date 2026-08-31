// MCP authentication configuration — resolved from the environment, fail-closed.
//
// Every value here is required. There is deliberately no "skip the check"
// default and no escape hatch: a missing or malformed setting makes the MCP
// endpoint refuse all traffic rather than serve it unauthenticated. See
// docs/chatgpt-mcp-integration.md §3 and §4.

/** Resolved, validated configuration for the authenticated MCP endpoint. */
export interface McpAuthConfig {
  /**
   * RFC 8707 resource identifier for this MCP server — the public URL of the
   * endpoint (e.g. https://hengo.example.com/mcp). Published as `resource` in
   * the protected-resource metadata and required in every token's audience.
   */
  resourceUrl: URL
  /** Supabase Auth issuer, e.g. https://<ref>.supabase.co/auth/v1 */
  issuer: string
  /** JWKS endpoint used to verify token signatures. Derived from the issuer. */
  jwksUri: URL
  /** Supabase OAuth authorization endpoint. Derived from the issuer. */
  authorizationEndpoint: string
  /** Supabase OAuth token endpoint. Derived from the issuer. */
  tokenEndpoint: string
  /**
   * Audience value every access token must carry. Bound to the resource URL
   * so a token minted for something else cannot be replayed against this
   * endpoint (docs §3.6, risk R1).
   */
  expectedAudience: string
  /**
   * The OAuth clients permitted to call this endpoint (e.g. one id for
   * Claude, one for ChatGPT). Tokens carrying any other `client_id` are
   * rejected — Supabase cannot express custom scopes, so client identity is
   * the authorization granularity (docs §4.2). Always non-empty: an empty
   * allowlist is a configuration error, not "allow everyone".
   */
  allowedClientIds: Set<string>
  /**
   * Whether the write tools (§8) register at all. Defaults to `false` — an
   * unset or unparseable value never falls open. Flip explicitly per
   * deployment once the read tools have been verified end to end.
   */
  writeEnabled: boolean
}

export class McpConfigError extends Error {}

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new McpConfigError(
      `${name} is not set. The MCP endpoint refuses all requests until it is configured.`,
    )
  }
  return value
}

/**
 * Parses a comma-separated client allowlist. Fails closed: an empty result
 * (unset, blank, or only commas/whitespace) is a configuration error — it
 * must never be read as "no restriction".
 */
function parseAllowedClientIds(name: string): Set<string> {
  const raw = required(name)
  const ids = new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  )
  if (ids.size === 0) {
    throw new McpConfigError(`${name} must contain at least one non-empty client id.`)
  }
  return ids
}

/** `MCP_WRITE_ENABLED` defaults to `false` on missing or unparseable input — never to `true`. */
function parseWriteEnabled(value: string | undefined): boolean {
  return (value?.trim().toLowerCase() ?? "") === "true"
}

function parseUrl(name: string, value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new McpConfigError(`${name} is not a valid absolute URL.`)
  }
  // An http:// resource identifier would let a token be bound to an
  // interceptable origin, so it is rejected outright rather than warned about.
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new McpConfigError(`${name} must use https (localhost excepted for development).`)
  }
  return url
}

/**
 * Reads and validates the configuration.
 *
 * Throws `McpConfigError` when anything is missing or malformed — callers turn
 * that into a 503, never into a request served without verification.
 *
 * Not memoised: route handlers are long-lived and a cached failure would
 * outlive the fix.
 */
export function loadMcpAuthConfig(): McpAuthConfig {
  const resourceUrl = parseUrl("MCP_RESOURCE_URL", required("MCP_RESOURCE_URL"))
  const issuerUrl = parseUrl("SUPABASE_OAUTH_ISSUER", required("SUPABASE_OAUTH_ISSUER"))
  const issuer = issuerUrl.toString().replace(/\/$/, "")

  return {
    resourceUrl,
    issuer,
    jwksUri: new URL(`${issuer}/.well-known/jwks.json`),
    authorizationEndpoint: `${issuer}/oauth/authorize`,
    tokenEndpoint: `${issuer}/oauth/token`,
    // The resource identifier is the audience. Supabase must be configured to
    // mint this value via a Custom Access Token Hook; until it is, no token
    // validates — which is the intended fail-closed behaviour.
    expectedAudience: resourceUrl.toString(),
    allowedClientIds: parseAllowedClientIds("MCP_ALLOWED_CLIENT_IDS"),
    writeEnabled: parseWriteEnabled(process.env.MCP_WRITE_ENABLED),
  }
}

/** Non-throwing variant for callers that need to branch on availability. */
export function tryLoadMcpAuthConfig(): { config: McpAuthConfig } | { error: string } {
  try {
    return { config: loadMcpAuthConfig() }
  } catch (err) {
    return {
      error: err instanceof McpConfigError ? err.message : "MCP configuration is unavailable.",
    }
  }
}
