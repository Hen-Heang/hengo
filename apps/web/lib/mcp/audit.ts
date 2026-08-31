// Per-call audit trail — one kori_mcp_audit row per tool call, written
// through the same per-request, RLS-scoped client every tool uses. Never
// throws and never logs an access token or user-authored content: only
// shape (tool name, client, kind, outcome, timing), matching recordUsage's
// "a logging failure must not affect the response" rule in
// lib/server/ai-limits.ts.
import type { McpContext } from "./context"

export interface ToolCallRecord {
  toolName: string
  kind: "read" | "write"
  success: boolean
  errorCode?: string | null
  durationMs: number
}

export async function recordToolCall(ctx: McpContext, record: ToolCallRecord): Promise<void> {
  try {
    await ctx.db.from("kori_mcp_audit").insert({
      user_id: ctx.userId,
      client_id: ctx.clientId,
      tool_name: record.toolName,
      kind: record.kind,
      success: record.success,
      error_code: record.errorCode ?? null,
      duration_ms: record.durationMs,
      request_id: ctx.requestId,
    })
  } catch (err) {
    console.error(
      "[mcp-audit] failed to record tool call:",
      err instanceof Error ? err.message : "unknown error",
    )
  }
}
