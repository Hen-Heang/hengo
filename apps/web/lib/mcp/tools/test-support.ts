// Test-only helpers shared across lib/mcp/tools/*.test.ts and
// lib/mcp/server.test.ts — not itself a test file, so vitest never collects
// it as a suite.
import type { McpServer, ToolAnnotations } from "@modelcontextprotocol/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { McpContext } from "../context"

export interface CapturedTool {
  name: string
  config: { inputSchema?: unknown; outputSchema?: unknown; annotations?: ToolAnnotations }
  handler: (args: Record<string, unknown>) => Promise<{
    isError?: boolean
    content: { type: string; text: string }[]
    structuredContent?: unknown
  }>
}

/** Stands in for McpServer just well enough to record what registerTool was
 * called with — no real transport, no JSON-RPC. */
export function captureRegisteredTools(): {
  fakeServer: McpServer
  tools: Map<string, CapturedTool>
} {
  const tools = new Map<string, CapturedTool>()
  const fakeServer = {
    registerTool(name: string, config: CapturedTool["config"], handler: CapturedTool["handler"]) {
      tools.set(name, { name, config, handler })
    },
  } as unknown as McpServer
  return { fakeServer, tools }
}

/** A chainable stub matching the subset of the query-builder surface the
 * tools use (select/eq/order/limit/gte/lte/is/insert/update/rpc/...) —
 * every chain method returns itself, and awaiting it resolves to `result`. */
export function fakeQuery(result: { data: unknown; error: unknown; count?: number | null }) {
  const builder: Record<string, unknown> = {}
  for (const method of [
    "select",
    "eq",
    "order",
    "limit",
    "gte",
    "lte",
    "is",
    "in",
    "insert",
    "update",
  ]) {
    builder[method] = () => builder
  }
  builder.maybeSingle = () => Promise.resolve(result)
  builder.single = () => Promise.resolve(result)
  builder.then = (onResolve: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(onResolve)
  return builder
}

export function fakeDb(
  tableResults: Record<string, ReturnType<typeof fakeQuery>>,
  rpcResults: Record<string, { data: unknown; error: unknown }> = {},
): SupabaseClient {
  return {
    // Every real tool call now goes through instrumentedTool (instrument.ts),
    // which reads/writes kori_ai_usage and kori_mcp_audit on every call — a
    // test that only cares about one table's query shouldn't have to also
    // stub those out, so an unlisted table gets a harmless "empty, allowed"
    // default instead of undefined.
    from: (table: string) => tableResults[table] ?? fakeQuery({ data: [], error: null, count: 0 }),
    rpc: (fn: string) => Promise.resolve(rpcResults[fn] ?? { data: null, error: null }),
  } as unknown as SupabaseClient
}

export function fakeContext(db: SupabaseClient, overrides: Partial<McpContext> = {}): McpContext {
  return {
    userId: "user-1",
    clientId: "client-1",
    db,
    writeEnabled: false,
    requestId: "req-1",
    ...overrides,
  }
}
