// The single wrapper every registered tool's handler goes through — so
// audit logging, rate limiting, timing, and sanitized errors are each
// implemented exactly once, applied uniformly, and impossible to forget on
// a newly added tool. See lib/mcp/audit.ts, lib/mcp/errors.ts, and
// lib/server/ai-limits.ts (reused as-is, per its own "Existing server
// modules" allowance for lib/mcp/**).
import type { CallToolResult } from "@modelcontextprotocol/server"
import { checkRateLimit, recordUsage, RATE_LIMIT_BUCKETS } from "@/lib/server/ai-limits"
import type { McpContext } from "../context"
import { recordToolCall } from "../audit"
import { sanitizeToolError } from "../errors"

type ToolHandler<Args> = (args: Args) => Promise<CallToolResult>

/**
 * Wraps a tool's handler with: a per-user daily rate limit (checked before
 * the handler runs, so an exhausted bucket never touches Supabase for the
 * real work), audit logging of the outcome to kori_mcp_audit, and a
 * sanitized error message for anything the handler throws. The handler
 * itself is unchanged — it still returns `{ isError: true, ... }` for its
 * own domain errors (not found, forbidden, ...), which this wrapper reports
 * as a failed call but never intercepts or rewrites.
 */
export function instrumentedTool<Args>(
  ctx: McpContext,
  kind: "read" | "write",
  toolName: string,
  handler: ToolHandler<Args>,
): ToolHandler<Args> {
  const feature = `mcp.${toolName}`
  const bucketKey = kind === "read" ? "mcp_read" : "mcp_write"

  return async (args) => {
    const rateStatus = await checkRateLimit(ctx.db, ctx.userId, feature)
    if (!rateStatus.allowed) {
      void recordToolCall(ctx, { toolName, kind, success: false, errorCode: "RATE_LIMITED", durationMs: 0 })
      const bucket = RATE_LIMIT_BUCKETS[bucketKey]
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Daily limit reached for ${bucket.description.toLowerCase()} (${bucket.limit}/day). Try again tomorrow.`,
          },
        ],
      }
    }

    const startedAt = performance.now()
    try {
      const result = await handler(args)
      const durationMs = Math.round(performance.now() - startedAt)
      const success = !result.isError
      void recordUsage(ctx.db, { userId: ctx.userId, feature, model: "mcp", latencyMs: durationMs, success })
      void recordToolCall(ctx, { toolName, kind, success, durationMs })
      return result
    } catch (err) {
      const durationMs = Math.round(performance.now() - startedAt)
      void recordUsage(ctx.db, { userId: ctx.userId, feature, model: "mcp", latencyMs: durationMs, success: false, errorCode: "INTERNAL" })
      void recordToolCall(ctx, { toolName, kind, success: false, errorCode: "INTERNAL", durationMs })
      return { isError: true, content: [{ type: "text" as const, text: sanitizeToolError(err, ctx.requestId) }] }
    }
  }
}
