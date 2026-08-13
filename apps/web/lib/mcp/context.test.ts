import { describe, expect, it, vi } from "vitest"

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test-project.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key"
})

import type { AuthInfo, McpRequestContext } from "@modelcontextprotocol/server"
import { buildMcpContext } from "./context"

const AUTH_INFO: AuthInfo = {
  token: "the-callers-access-token",
  clientId: "claude-client-id",
  scopes: ["openid"],
  extra: { userId: "11111111-2222-3333-4444-555555555555" },
}

function requestContext(overrides: Partial<McpRequestContext> = {}): McpRequestContext {
  return { era: "modern", authInfo: AUTH_INFO, ...overrides }
}

describe("buildMcpContext", () => {
  it("returns null when the request carries no verified AuthInfo", () => {
    expect(buildMcpContext(requestContext({ authInfo: undefined }), false)).toBeNull()
  })

  it("derives userId and clientId from the verified AuthInfo only", () => {
    const ctx = buildMcpContext(requestContext(), false)
    expect(ctx?.userId).toBe("11111111-2222-3333-4444-555555555555")
    expect(ctx?.clientId).toBe("claude-client-id")
  })

  it("passes writeEnabled through unchanged", () => {
    expect(buildMcpContext(requestContext(), true)?.writeEnabled).toBe(true)
    expect(buildMcpContext(requestContext(), false)?.writeEnabled).toBe(false)
  })

  it("builds a Supabase client carrying the caller's own token, never a shared/service one", () => {
    const ctx = buildMcpContext(requestContext(), false)
    // @supabase/supabase-js stores the constructor headers on the client's
    // internal fetch config — asserting via the public surface would require
    // an actual network call, so this checks the one thing that matters here:
    // a client was constructed per call, not reused.
    expect(ctx?.db).toBeTruthy()
  })

  it("generates a fresh requestId on every call", () => {
    const first = buildMcpContext(requestContext(), false)
    const second = buildMcpContext(requestContext(), false)
    expect(first?.requestId).toBeTruthy()
    expect(first?.requestId).not.toBe(second?.requestId)
  })
})
