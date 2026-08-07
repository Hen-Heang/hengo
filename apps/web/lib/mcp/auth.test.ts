import { beforeAll, describe, expect, it, vi } from "vitest"
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair, type CryptoKey, type JWK } from "jose"

// The end-to-end tests below drive the real pipeline through buildMcpContext,
// which builds a genuine SupabaseClient (auth.ts's createUserSupabaseClient)
// from these env vars at module-evaluation time — unlike Next's dev/build,
// Vitest does not load .env.local. `vi.hoisted` runs this before "./auth" and
// "./handler" (and, transitively, @/lib/supabase) are imported below; setting
// it any later would be too late, since those modules read process.env once
// at import time. No test here issues a query, so a syntactically valid but
// inert pair is enough.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test-project.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key"
})

import { SupabaseMcpTokenVerifier, principalFromAuthInfo } from "./auth"
import { createAuthenticatedMcpHandler } from "./handler"
import type { McpAuthConfig } from "./config"

// Real ES256 signatures over a locally generated key pair — the same algorithm
// the Supabase project publishes in its JWKS. Nothing here stubs the verifier
// or short-circuits verification, so a regression that weakens signature,
// issuer, audience or expiry checking fails these tests.

const ISSUER = "https://project.supabase.co/auth/v1"
const RESOURCE = "https://hengo.example.com/mcp"
const CLIENT_ID = "chatgpt-connector-client-id"
const USER_ID = "11111111-2222-3333-4444-555555555555"

const config: McpAuthConfig = {
  resourceUrl: new URL(RESOURCE),
  issuer: ISSUER,
  jwksUri: new URL(`${ISSUER}/.well-known/jwks.json`),
  authorizationEndpoint: `${ISSUER}/oauth/authorize`,
  tokenEndpoint: `${ISSUER}/oauth/token`,
  expectedAudience: RESOURCE,
  allowedClientIds: new Set([CLIENT_ID, "another-allowed-client-id"]),
  writeEnabled: false,
}

let privateKey: CryptoKey
let publicJwk: JWK
let otherPrivateKey: CryptoKey
let jwks: ReturnType<typeof createLocalJWKSet>

beforeAll(async () => {
  const pair = await generateKeyPair("ES256", { extractable: true })
  privateKey = pair.privateKey
  publicJwk = { ...(await exportJWK(pair.publicKey)), alg: "ES256", kid: "test-key" }
  jwks = createLocalJWKSet({ keys: [publicJwk] })

  // A second key that the JWKS does not contain — stands in for a token signed
  // by anyone other than the real issuer.
  otherPrivateKey = (await generateKeyPair("ES256", { extractable: true })).privateKey
})

interface TokenOverrides {
  sub?: string
  aud?: string
  iss?: string
  clientId?: string | null
  expiresIn?: string | number
  scope?: string
  signWith?: "issuer" | "attacker"
}

async function mintToken(overrides: TokenOverrides = {}): Promise<string> {
  const claims: Record<string, unknown> = {
    scope: overrides.scope ?? "openid",
    role: "authenticated",
  }
  if (overrides.clientId !== null) claims.client_id = overrides.clientId ?? CLIENT_ID

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setSubject(overrides.sub ?? USER_ID)
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? RESOURCE)
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? "10m")
    .sign(overrides.signWith === "attacker" ? otherPrivateKey : privateKey)
}

function verifier() {
  return new SupabaseMcpTokenVerifier(config, jwks)
}

// ── Token verification ───────────────────────────────────────────────────────

describe("SupabaseMcpTokenVerifier", () => {
  it("accepts a well-formed token and derives identity from the subject claim", async () => {
    const authInfo = await verifier().verifyAccessToken(await mintToken())

    expect(authInfo.clientId).toBe(CLIENT_ID)
    expect(authInfo.resource?.toString()).toBe(RESOURCE)
    expect(authInfo.scopes).toEqual(["openid"])
    expect(authInfo.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    // Identity comes from the verified token, never from request input.
    expect(principalFromAuthInfo(authInfo).userId).toBe(USER_ID)
  })

  it("derives a different identity from a different subject, with no other input changing", async () => {
    const other = "99999999-8888-7777-6666-555555555555"
    const authInfo = await verifier().verifyAccessToken(await mintToken({ sub: other }))
    expect(principalFromAuthInfo(authInfo).userId).toBe(other)
  })

  it("rejects a token signed by the wrong key", async () => {
    await expect(
      verifier().verifyAccessToken(await mintToken({ signWith: "attacker" })),
    ).rejects.toThrow()
  })

  it("rejects an expired token", async () => {
    await expect(
      verifier().verifyAccessToken(await mintToken({ expiresIn: "-1m" })),
    ).rejects.toThrow()
  })

  it("rejects a token from another issuer", async () => {
    await expect(
      verifier().verifyAccessToken(await mintToken({ iss: "https://evil.example.com/auth/v1" })),
    ).rejects.toThrow()
  })

  it("rejects a token minted for a different audience", async () => {
    // The replay case: a valid Supabase session token for the web app carries
    // aud "authenticated", not this resource, and must not open the MCP endpoint.
    await expect(
      verifier().verifyAccessToken(await mintToken({ aud: "authenticated" })),
    ).rejects.toThrow()
  })

  it("rejects a token issued to a different OAuth client", async () => {
    await expect(
      verifier().verifyAccessToken(await mintToken({ clientId: "some-other-client" })),
    ).rejects.toThrow()
  })

  it("accepts a token issued to any client on the allowlist, not just the first", async () => {
    // Simulates two registered connectors (e.g. Claude and ChatGPT) sharing
    // one endpoint — both ids in config.allowedClientIds must work.
    const authInfo = await verifier().verifyAccessToken(await mintToken({ clientId: "another-allowed-client-id" }))
    expect(authInfo.clientId).toBe("another-allowed-client-id")
  })

  it("rejects a token with no client_id claim", async () => {
    await expect(verifier().verifyAccessToken(await mintToken({ clientId: null }))).rejects.toThrow()
  })

  it("rejects a structurally invalid token", async () => {
    await expect(verifier().verifyAccessToken("not-a-jwt")).rejects.toThrow()
  })
})

describe("principalFromAuthInfo", () => {
  it("refuses to produce a principal without a verified user id", () => {
    expect(() =>
      principalFromAuthInfo({ token: "t", clientId: CLIENT_ID, scopes: [], extra: {} }),
    ).toThrow(/verified user id/)
  })
})

// ── End-to-end through the gated endpoint ────────────────────────────────────

function mcpRequest(body: Record<string, unknown>, token?: string): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-06-18",
  }
  if (token) headers.authorization = `Bearer ${token}`
  return new Request(RESOURCE, { method: "POST", headers, body: JSON.stringify(body) })
}

/** The handler answers with either a JSON body or an SSE stream depending on
 *  the exchange; both carry the same JSON-RPC payload. */
async function readRpcBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  if (res.headers.get("content-type")?.includes("text/event-stream")) {
    const frame = text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("data:"))
    if (!frame) throw new Error(`No data frame in SSE response: ${text}`)
    return JSON.parse(frame.slice("data:".length).trim())
  }
  return JSON.parse(text)
}

const INIT = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "hengo-tests", version: "1.0.0" },
  },
}

async function withHandler<T>(fn: (h: ReturnType<typeof createAuthenticatedMcpHandler>) => Promise<T>) {
  const handler = createAuthenticatedMcpHandler(config, verifier())
  try {
    return await fn(handler)
  } finally {
    await handler.close()
  }
}

describe("authenticated MCP endpoint", () => {
  it("returns 401 with an RFC 9728 challenge when the token is missing", async () => {
    await withHandler(async (handler) => {
      const res = await handler.fetch(mcpRequest(INIT))
      expect(res.status).toBe(401)
      const challenge = res.headers.get("www-authenticate") ?? ""
      expect(challenge).toMatch(/^Bearer/)
      // The challenge must point at the path-suffixed metadata document so a
      // client can discover the authorization server.
      expect(challenge).toContain(
        "https://hengo.example.com/.well-known/oauth-protected-resource/mcp",
      )
    })
  })

  it("returns 401 for an invalid token", async () => {
    await withHandler(async (handler) => {
      const res = await handler.fetch(mcpRequest(INIT, "not-a-jwt"))
      expect(res.status).toBe(401)
    })
  })

  it("returns 401 for a token signed by the wrong key", async () => {
    await withHandler(async (handler) => {
      const res = await handler.fetch(mcpRequest(INIT, await mintToken({ signWith: "attacker" })))
      expect(res.status).toBe(401)
    })
  })

  it("returns 401 for an expired token", async () => {
    await withHandler(async (handler) => {
      const res = await handler.fetch(mcpRequest(INIT, await mintToken({ expiresIn: "-5m" })))
      expect(res.status).toBe(401)
    })
  })

  it("does not leak the tool list to an unauthenticated caller", async () => {
    await withHandler(async (handler) => {
      const res = await handler.fetch(
        mcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
      )
      expect(res.status).toBe(401)
      expect(await res.text()).not.toContain("get_hengo_server_info")
    })
  })

  it("serves a valid authenticated request", async () => {
    await withHandler(async (handler) => {
      const res = await handler.fetch(mcpRequest(INIT, await mintToken()))
      expect(res.status).toBe(200)
      const body = (await readRpcBody(res)) as unknown as {
        result: { serverInfo: { name: string } }
      }
      expect(body.result.serverInfo.name).toBe("hengo")
    })
  })

  it("serves an authenticated tools/call", async () => {
    await withHandler(async (handler) => {
      const token = await mintToken()
      await handler.fetch(mcpRequest(INIT, token))
      const res = await handler.fetch(
        mcpRequest(
          {
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: { name: "get_hengo_server_info", arguments: {} },
          },
          token,
        ),
      )
      expect(res.status).toBe(200)
      const body = (await readRpcBody(res)) as unknown as {
        result: { structuredContent: { name: string; status: string } }
      }
      expect(body.result.structuredContent.status).toBe("ok")
    })
  })
})
