// Bearer-token verification for the MCP endpoint.
//
// The MCP server is an OAuth 2.1 *resource server*: Supabase Auth issues the
// tokens, and this module's only job is to prove a presented token is genuine,
// unexpired, minted by that issuer, and bound to this resource — then hand back
// the user identity it carries.
//
// Verification is local, against the issuer's published JWKS (the project signs
// with ES256). Nothing here trusts a claim it has not checked the signature
// over, and there is no code path that returns an AuthInfo without a successful
// verification.
//
// Server-only. Must never import @/lib/api/* or @/lib/auth-store — those are
// browser-bound and fail silently on the server (docs §5).
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { OAuthError, OAuthErrorCode, type AuthInfo, type OAuthTokenVerifier } from "@modelcontextprotocol/server"
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase"
import type { McpAuthConfig } from "./config"

/**
 * Signature algorithms accepted for an access token.
 *
 * Pinned to asymmetric algorithms only. Without this, a token signed with the
 * project's symmetric secret — or, in the classic attack, `alg: none` — would
 * be accepted by a verifier that trusts the header's own algorithm claim.
 */
const ALLOWED_ALGORITHMS = ["ES256", "RS256"]

/** Identity and grant carried by a verified token. */
export interface McpPrincipal {
  /** Supabase auth user id, taken from the verified `sub` claim. */
  userId: string
  /** OAuth client the token was issued to. */
  clientId: string
  scopes: string[]
  expiresAt: number
}

function invalidToken(message: string): OAuthError {
  // Every failure is reported as invalid_token so the response is a uniform
  // 401 + WWW-Authenticate. The reason is never echoed to the caller in a way
  // that distinguishes "expired" from "wrong audience" from "bad signature" —
  // that would let an unauthenticated caller probe the configuration.
  return new OAuthError(OAuthErrorCode.InvalidToken, message)
}

function toScopes(payload: JWTPayload): string[] {
  const raw = payload.scope ?? payload.scp
  if (typeof raw === "string") return raw.split(/\s+/).filter(Boolean)
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === "string")
  return []
}

/**
 * Verifies Supabase-issued access tokens for one configured resource.
 *
 * The JWKS is fetched lazily and cached by `jose` (with its own re-fetch on
 * unknown `kid`), so steady-state verification costs no network round-trip —
 * unlike `supabase.auth.getUser()`, which calls the auth server per request.
 */
export class SupabaseMcpTokenVerifier implements OAuthTokenVerifier {
  private readonly jwks: JWTVerifyGetKey

  constructor(
    private readonly config: McpAuthConfig,
    jwks?: JWTVerifyGetKey,
  ) {
    // The injectable JWKS keeps tests on real signature verification against a
    // locally generated key pair rather than a stubbed-out verifier.
    this.jwks = jwks ?? createRemoteJWKSet(config.jwksUri)
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    let payload: JWTPayload
    try {
      const verified = await jwtVerify(token, this.jwks, {
        algorithms: ALLOWED_ALGORITHMS,
        issuer: this.config.issuer,
        audience: this.config.expectedAudience,
        // `jose` enforces exp/nbf itself; no clock skew is granted.
      })
      payload = verified.payload
    } catch {
      throw invalidToken("The access token is not valid for this resource.")
    }

    const userId = typeof payload.sub === "string" ? payload.sub.trim() : ""
    if (!userId) throw invalidToken("The access token carries no subject.")

    // Supabase cannot express custom scopes, so the client_id claim is the
    // only authorization granularity available (docs §4.2).
    const clientId = typeof payload.client_id === "string" ? payload.client_id : ""
    if (!clientId || clientId !== this.config.allowedClientId) {
      throw invalidToken("The access token was not issued to a permitted client.")
    }

    if (typeof payload.exp !== "number") {
      throw invalidToken("The access token has no expiry.")
    }

    return {
      token,
      clientId,
      scopes: toScopes(payload),
      expiresAt: payload.exp,
      resource: this.config.resourceUrl,
      extra: { userId } satisfies Pick<McpPrincipal, "userId">,
    }
  }
}

/**
 * The verified user identity behind a request.
 *
 * Identity comes from the token's `sub` claim and nothing else — never from a
 * tool argument. A tool that accepted a `user_id` parameter would let one
 * authenticated caller address another user's rows, and RLS could not tell the
 * difference because the JWT would still be the caller's own.
 */
export function principalFromAuthInfo(authInfo: AuthInfo): McpPrincipal {
  const userId = (authInfo.extra as { userId?: unknown } | undefined)?.userId
  if (typeof userId !== "string" || !userId) {
    throw new Error("AuthInfo is missing a verified user id — refusing to proceed.")
  }
  return {
    userId,
    clientId: authInfo.clientId,
    scopes: authInfo.scopes,
    expiresAt: authInfo.expiresAt ?? 0,
  }
}

/**
 * Per-request Supabase client carrying the caller's access token.
 *
 * Identical in shape to `requireUser` in lib/server/ai.ts: the token rides in
 * the Authorization header, so `auth.uid()` resolves to the caller and RLS —
 * not this process — decides what the query returns.
 *
 * There is no service-role key here or anywhere else in the repository, and
 * none must be introduced: it would bypass RLS entirely and turn a token-scoped
 * request into a whole-database one.
 *
 * Never hoist the result into module scope — one client per request, or a
 * user's token leaks into another user's request.
 */
export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
