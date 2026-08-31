import { describe, expect, it, vi } from "vitest"
import type { CallToolResult } from "@modelcontextprotocol/server"
import { instrumentedTool } from "./instrument"
import { fakeContext, fakeDb, fakeQuery } from "./test-support"

function textOf(result: CallToolResult): string {
  const first = result.content[0]
  return first.type === "text" ? first.text : ""
}

/** Captures every row passed to `.insert()` on this table, otherwise behaves
 * like fakeQuery — needed to assert what audit/usage rows actually contain. */
function fakeInsertSpy(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const rows: Record<string, unknown>[] = []
  const builder: Record<string, unknown> = {
    insert: (row: Record<string, unknown>) => {
      rows.push(row)
      return builder
    },
  }
  for (const method of ["select", "order", "eq", "limit", "gte", "lte", "in"]) {
    builder[method] = () => builder
  }
  builder.single = () => Promise.resolve(result)
  builder.maybeSingle = () => Promise.resolve(result)
  builder.then = (onResolve: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(onResolve)
  return { builder, rows }
}

const okHandler = vi.fn(async () => ({
  content: [{ type: "text" as const, text: "ok" }],
  structuredContent: { done: true },
}))

describe("instrumentedTool", () => {
  it("runs the handler and reports success to both kori_ai_usage and kori_mcp_audit", async () => {
    const usage = fakeInsertSpy()
    const audit = fakeInsertSpy()
    const ctx = fakeContext(
      fakeDb({
        kori_ai_usage: usage.builder as ReturnType<typeof fakeQuery>,
        kori_mcp_audit: audit.builder as ReturnType<typeof fakeQuery>,
      }),
    )
    okHandler.mockClear()

    const wrapped = instrumentedTool(ctx, "read", "list_goals", okHandler)
    const result = await wrapped({})

    expect(result.structuredContent).toEqual({ done: true })
    expect(okHandler).toHaveBeenCalledOnce()
    // Rate-limit bookkeeping: a real attempt must land in kori_ai_usage under
    // the "mcp.<tool>" feature name, or the bucket never fills and the limit
    // is a no-op.
    expect(usage.rows).toHaveLength(1)
    expect(usage.rows[0]).toMatchObject({
      user_id: "user-1",
      feature: "mcp.list_goals",
      model: "mcp",
      success: true,
    })
    expect(audit.rows).toHaveLength(1)
    expect(audit.rows[0]).toMatchObject({
      user_id: "user-1",
      client_id: "client-1",
      tool_name: "list_goals",
      kind: "read",
      success: true,
      request_id: "req-1",
    })
  })

  it("never calls the handler once the daily bucket is exhausted, and returns a retryable-sounding message", async () => {
    // count >= limit (mcp_read is 200/day) trips checkRateLimit's !allowed branch.
    const exhausted = fakeQuery({ data: [], error: null, count: 200 })
    const audit = fakeInsertSpy()
    const ctx = fakeContext(
      fakeDb({
        kori_ai_usage: exhausted,
        kori_mcp_audit: audit.builder as ReturnType<typeof fakeQuery>,
      }),
    )
    okHandler.mockClear()

    const wrapped = instrumentedTool(ctx, "read", "list_goals", okHandler)
    const result = await wrapped({})

    expect(okHandler).not.toHaveBeenCalled()
    expect(result.isError).toBe(true)
    expect(textOf(result).toLowerCase()).toContain("limit")
    expect(audit.rows[0]).toMatchObject({ success: false, error_code: "RATE_LIMITED" })
  })

  it("never leaks a thrown error's message to the client — only a fixed sentence plus the request id", async () => {
    const ctx = fakeContext(fakeDb({}))
    const throwingHandler = vi.fn(async (): Promise<never> => {
      throw new Error('relation "kori_super_secret_internal_table" does not exist')
    })

    const wrapped = instrumentedTool(ctx, "write", "create_task", throwingHandler)
    const result = await wrapped({})

    expect(result.isError).toBe(true)
    expect(textOf(result)).not.toContain("kori_super_secret_internal_table")
    expect(textOf(result)).toContain(ctx.requestId)
  })

  it("audit and usage rows carry only shape — never a token, header, or arbitrary field a future edit might add", async () => {
    const usage = fakeInsertSpy()
    const audit = fakeInsertSpy()
    const ctx = fakeContext(
      fakeDb({
        kori_ai_usage: usage.builder as ReturnType<typeof fakeQuery>,
        kori_mcp_audit: audit.builder as ReturnType<typeof fakeQuery>,
      }),
    )
    okHandler.mockClear()

    await instrumentedTool(ctx, "read", "list_goals", okHandler)({})

    expect(Object.keys(usage.rows[0]).sort()).toEqual(
      [
        "user_id",
        "feature",
        "model",
        "input_tokens",
        "output_tokens",
        "total_tokens",
        "latency_ms",
        "success",
        "error_code",
      ].sort(),
    )
    expect(Object.keys(audit.rows[0]).sort()).toEqual(
      [
        "user_id",
        "client_id",
        "tool_name",
        "kind",
        "success",
        "error_code",
        "duration_ms",
        "request_id",
      ].sort(),
    )
  })
})
