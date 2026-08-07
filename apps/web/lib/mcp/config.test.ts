import { afterEach, describe, expect, it } from "vitest"
import { McpConfigError, loadMcpAuthConfig, tryLoadMcpAuthConfig } from "./config"

// The endpoint must fail closed: any missing or malformed setting makes it
// refuse traffic rather than serve it unverified.

const KEYS = [
  "MCP_RESOURCE_URL",
  "SUPABASE_OAUTH_ISSUER",
  "MCP_ALLOWED_CLIENT_IDS",
  "MCP_WRITE_ENABLED",
] as const

const VALID = {
  MCP_RESOURCE_URL: "https://hengo.example.com/mcp",
  SUPABASE_OAUTH_ISSUER: "https://project.supabase.co/auth/v1",
  MCP_ALLOWED_CLIENT_IDS: "client-abc",
}

function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) delete process.env[key]
  for (const [key, value] of Object.entries(values)) process.env[key] = value
}

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe("loadMcpAuthConfig", () => {
  it("derives the Supabase OAuth endpoints from the issuer", () => {
    setEnv(VALID)
    const config = loadMcpAuthConfig()

    expect(config.issuer).toBe("https://project.supabase.co/auth/v1")
    expect(config.jwksUri.toString()).toBe(
      "https://project.supabase.co/auth/v1/.well-known/jwks.json",
    )
    expect(config.authorizationEndpoint).toBe("https://project.supabase.co/auth/v1/oauth/authorize")
    expect(config.tokenEndpoint).toBe("https://project.supabase.co/auth/v1/oauth/token")
  })

  it("binds the expected token audience to the resource identifier", () => {
    setEnv(VALID)
    // Audience must be the resource itself — that is what stops a token minted
    // for anything else being replayed against this endpoint.
    expect(loadMcpAuthConfig().expectedAudience).toBe("https://hengo.example.com/mcp")
  })

  it.each(Object.keys(VALID) as (keyof typeof VALID)[])("throws when %s is missing", (missing) => {
    const env = { ...VALID }
    delete (env as Record<string, string>)[missing]
    setEnv(env)
    expect(() => loadMcpAuthConfig()).toThrow(McpConfigError)
  })

  it("parses a comma-separated client allowlist, trimming whitespace", () => {
    setEnv({ ...VALID, MCP_ALLOWED_CLIENT_IDS: " claude-id , chatgpt-id ,,  " })
    expect(loadMcpAuthConfig().allowedClientIds).toEqual(new Set(["claude-id", "chatgpt-id"]))
  })

  it("rejects an allowlist that is present but empty after trimming", () => {
    setEnv({ ...VALID, MCP_ALLOWED_CLIENT_IDS: " , , " })
    expect(() => loadMcpAuthConfig()).toThrow(McpConfigError)
  })

  it("defaults MCP_WRITE_ENABLED to false when unset", () => {
    setEnv(VALID)
    expect(loadMcpAuthConfig().writeEnabled).toBe(false)
  })

  it.each(["", "false", "1", "yes", "nonsense"])(
    'treats MCP_WRITE_ENABLED=%j as false — it never falls open on an unrecognised value',
    (value) => {
      setEnv({ ...VALID, MCP_WRITE_ENABLED: value })
      expect(loadMcpAuthConfig().writeEnabled).toBe(false)
    },
  )

  it.each(["true", "TRUE", " True "])('enables writes for %j (case/whitespace-insensitive "true")', (value) => {
    setEnv({ ...VALID, MCP_WRITE_ENABLED: value })
    expect(loadMcpAuthConfig().writeEnabled).toBe(true)
  })

  it("rejects a non-https resource URL outside localhost", () => {
    setEnv({ ...VALID, MCP_RESOURCE_URL: "http://hengo.example.com/mcp" })
    expect(() => loadMcpAuthConfig()).toThrow(/https/)
  })

  it("allows http on localhost for development", () => {
    setEnv({ ...VALID, MCP_RESOURCE_URL: "http://localhost:3000/mcp" })
    expect(() => loadMcpAuthConfig()).not.toThrow()
  })

  it("rejects a malformed URL", () => {
    setEnv({ ...VALID, SUPABASE_OAUTH_ISSUER: "not a url" })
    expect(() => loadMcpAuthConfig()).toThrow(McpConfigError)
  })
})

describe("tryLoadMcpAuthConfig", () => {
  it("reports the reason instead of throwing", () => {
    setEnv({})
    const result = tryLoadMcpAuthConfig()
    expect(result).toHaveProperty("error")
  })

  it("returns the config when fully set", () => {
    setEnv(VALID)
    expect(tryLoadMcpAuthConfig()).toHaveProperty("config")
  })
})
