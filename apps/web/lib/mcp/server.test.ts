import { describe, expect, it } from "vitest"
import { createMcpHandler } from "@modelcontextprotocol/server"
import {
  MCP_SERVER_INSTRUCTIONS,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  buildServerInfo,
  createHengoMcpServer,
  formatServerInfo,
  serverInfoSchema,
} from "./server"

// ── JSON-RPC helper ──────────────────────────────────────────────────────────
// Drives the real Streamable HTTP handler the /mcp route uses, so these tests
// cover the transport wiring and not just the server object. Responses may come
// back as a single JSON body or as an SSE stream depending on the exchange.

function makeHandler() {
  return createMcpHandler(() => createHengoMcpServer())
}

async function readBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text()
  if (res.headers.get("content-type")?.includes("text/event-stream")) {
    const line = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"))
    if (!line) throw new Error(`No data frame in SSE response: ${text}`)
    return JSON.parse(line.slice("data:".length).trim())
  }
  return JSON.parse(text)
}

async function rpc(
  handler: ReturnType<typeof makeHandler>,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const res = await handler.fetch(
    new Request("http://localhost:3000/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  )
  expect(res.status).toBe(200)
  return readBody(res)
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
} as const

const PROTOCOL_HEADER = { "mcp-protocol-version": "2025-06-18" }

// ── Identity ─────────────────────────────────────────────────────────────────

describe("server identity", () => {
  it("has a stable name clients can key a stored connection off", () => {
    expect(MCP_SERVER_NAME).toBe("hengo")
  })

  it("has a semver version for the MCP surface", () => {
    expect(MCP_SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it("ships instructions that front-load the load-bearing guidance", () => {
    expect(MCP_SERVER_INSTRUCTIONS.length).toBeGreaterThan(80)
    // Clients commonly truncate around 512 chars; the caveats must land inside
    // that window, not after it.
    const head = MCP_SERVER_INSTRUCTIONS.slice(0, 512)
    expect(head).toMatch(/get_hengo_server_info/)
    expect(head.toLowerCase()).toContain("cannot yet read or write")
  })
})

// ── buildServerInfo / formatServerInfo ───────────────────────────────────────

describe("buildServerInfo", () => {
  const fixedNow = new Date("2026-08-04T09:30:00.000Z")

  it("returns the server name, version, timestamp and status", () => {
    expect(buildServerInfo(fixedNow)).toEqual({
      name: "hengo",
      version: MCP_SERVER_VERSION,
      timestamp: "2026-08-04T09:30:00.000Z",
      status: "ok",
    })
  })

  it("returns those four fields and nothing else", () => {
    // Guard against personal data ever being added to this payload.
    expect(Object.keys(buildServerInfo(fixedNow)).sort()).toEqual([
      "name",
      "status",
      "timestamp",
      "version",
    ])
  })

  it("satisfies the declared output schema", () => {
    expect(serverInfoSchema.safeParse(buildServerInfo(fixedNow)).success).toBe(true)
  })

  it("uses the current clock by default and formats it as ISO-8601 UTC", () => {
    const before = Date.now()
    const { timestamp } = buildServerInfo()
    const parsed = Date.parse(timestamp)
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(parsed).toBeGreaterThanOrEqual(before)
    expect(parsed).toBeLessThanOrEqual(Date.now())
  })

  it("summarises itself for clients that do not render structured output", () => {
    const text = formatServerInfo(buildServerInfo(fixedNow))
    expect(text).toContain("hengo")
    expect(text).toContain(MCP_SERVER_VERSION)
    expect(text).toContain("2026-08-04T09:30:00.000Z")
    expect(text).toContain("ok")
  })
})

// ── Initialization ───────────────────────────────────────────────────────────

describe("createHengoMcpServer", () => {
  it("constructs without touching Supabase, auth or the network", () => {
    expect(() => createHengoMcpServer()).not.toThrow()
  })

  it("returns a fresh instance per call so no state is shared between requests", () => {
    expect(createHengoMcpServer()).not.toBe(createHengoMcpServer())
  })
})

describe("initialize handshake", () => {
  it("reports the server's stable identity and instructions", async () => {
    const handler = makeHandler()
    try {
      const body = await rpc(handler, INIT)
      const result = body.result as {
        serverInfo: { name: string; version: string }
        instructions?: string
        capabilities: Record<string, unknown>
      }
      expect(result.serverInfo.name).toBe(MCP_SERVER_NAME)
      expect(result.serverInfo.version).toBe(MCP_SERVER_VERSION)
      expect(result.instructions).toBe(MCP_SERVER_INSTRUCTIONS)
      expect(result.capabilities).toHaveProperty("tools")
    } finally {
      await handler.close()
    }
  })
})

// ── Tool surface ─────────────────────────────────────────────────────────────

describe("tools/list", () => {
  it("exposes exactly one read-only tool at this stage", async () => {
    const handler = makeHandler()
    try {
      await rpc(handler, INIT)
      const body = await rpc(
        handler,
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
        PROTOCOL_HEADER,
      )
      const tools = (body.result as { tools: { name: string; annotations?: Record<string, unknown> }[] }).tools

      // The foundation build must not grow tools by accident: no write tools,
      // no Supabase-backed reads until their own step lands.
      expect(tools.map((t) => t.name)).toEqual(["get_hengo_server_info"])
      expect(tools[0].annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      })
    } finally {
      await handler.close()
    }
  })
})

describe("tools/call get_hengo_server_info", () => {
  it("returns only the server's own name, version, timestamp and status", async () => {
    const handler = makeHandler()
    try {
      await rpc(handler, INIT)
      const body = await rpc(
        handler,
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "get_hengo_server_info", arguments: {} },
        },
        PROTOCOL_HEADER,
      )
      const result = body.result as {
        isError?: boolean
        structuredContent: unknown
        content: { type: string; text: string }[]
      }

      expect(result.isError).toBeFalsy()

      const parsed = serverInfoSchema.safeParse(result.structuredContent)
      expect(parsed.success).toBe(true)
      if (!parsed.success) return
      expect(parsed.data.name).toBe(MCP_SERVER_NAME)
      expect(parsed.data.version).toBe(MCP_SERVER_VERSION)
      expect(parsed.data.status).toBe("ok")
      expect(Object.keys(parsed.data).sort()).toEqual(["name", "status", "timestamp", "version"])

      expect(result.content[0]).toMatchObject({ type: "text" })
      expect(result.content[0].text).toContain(MCP_SERVER_NAME)
    } finally {
      await handler.close()
    }
  })
})
