// Per-request MCP context: what a domain tool is allowed to see and do.
//
// `createMcpHandler` (see handler.ts) invokes its server factory once per
// HTTP request with a fresh `McpRequestContext` carrying the already-verified
// `AuthInfo` from the bearer gate. This module turns that into the narrower
// `McpContext` domain tools actually use — never the other way around: a tool
// must never reach past `McpContext` for the raw `AuthInfo`, the request, or
// a token.
import type { McpRequestContext } from "@modelcontextprotocol/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createUserSupabaseClient, principalFromAuthInfo } from "./auth"

/**
 * Everything a registered tool is allowed to use. Built fresh per request —
 * never hoisted, never reused across requests or users.
 */
export interface McpContext {
  /** Verified Supabase auth user id (from the token's `sub` claim only). */
  userId: string
  /** OAuth client the token was issued to (already checked against the allowlist). */
  clientId: string
  /**
   * Per-request Supabase client carrying the caller's own access token — RLS
   * scopes every query to `userId` by construction. No service-role key
   * exists anywhere in this codebase; this must stay the only way tool code
   * reaches Supabase.
   */
  db: SupabaseClient
  /** Whether the write tools should be registered for this request. */
  writeEnabled: boolean
  /** Correlates this call's audit row (Phase 6) with logs — not a secret. */
  requestId: string
}

/**
 * Derives the per-request context from the SDK's server-factory context.
 *
 * Returns `null` when `ctx.authInfo` is absent. That should be unreachable in
 * practice — `requireBearerAuth` (handler.ts) rejects the request before the
 * factory ever runs — but the factory must degrade to "no domain tools"
 * rather than throw into the transport layer if the SDK ever calls it
 * without auth (e.g. an `initialize` probe on some future transport).
 */
export function buildMcpContext(ctx: McpRequestContext, writeEnabled: boolean): McpContext | null {
  if (!ctx.authInfo) return null
  const principal = principalFromAuthInfo(ctx.authInfo)
  return {
    userId: principal.userId,
    clientId: principal.clientId,
    db: createUserSupabaseClient(ctx.authInfo.token),
    writeEnabled,
    requestId: crypto.randomUUID(),
  }
}
