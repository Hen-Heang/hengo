// capture_reflection — write, gated on MCP_WRITE_ENABLED. Insert-only into
// kori_journal_entries: appends a reflection the user later sees in the app.
// Deliberately has no matching read tool — this satisfies "capture a
// reflection" without opening the private-journal domain to MCP reads,
// keeping the read tools' "no journal" rule intact even though this write
// touches the same table (see lib/mcp/server.ts's header and the plan §4).
//
// Idempotency: exact-content dedupe within a short lookback window — same
// rationale as create_task's, sized for personal-scale content lengths so an
// exact-match query is cheap without needing a hash column.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { instrumentedTool } from "./instrument"

const DEDUPE_WINDOW_MS = 10 * 60 * 1000

export function registerCaptureReflectionTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "capture_reflection",
    {
      title: "Capture reflection",
      description:
        "Save a short reflection note (and, optionally, a mood/energy rating from 1-5) to the signed-in " +
        "user's private journal. Write-only — this server cannot read journal entries back.",
      inputSchema: z.object({
        content: z.string().trim().min(1).max(4000),
        mood: z.number().int().min(1).max(5).optional(),
        energy: z.number().int().min(1).max(5).optional(),
      }),
      outputSchema: z.object({
        reflection: z.object({ id: z.string(), occurredAt: z.string() }),
        created: z.boolean(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "write", "capture_reflection", async ({ content, mood, energy }) => {
      const { data: existing, error: dedupeError } = await ctx.db
        .from("kori_journal_entries")
        .select("id, occurred_at")
        .eq("user_id", ctx.userId)
        .eq("content", content)
        .gte("occurred_at", new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString())
        .maybeSingle()
      if (dedupeError) throw new Error("Could not save the reflection.")
      if (existing) {
        return {
          content: [{ type: "text" as const, text: "Already captured moments ago — no duplicate created." }],
          structuredContent: {
            reflection: { id: existing.id as string, occurredAt: existing.occurred_at as string },
            created: false,
          },
        }
      }

      const occurredAt = new Date().toISOString()
      const { data, error } = await ctx.db
        .from("kori_journal_entries")
        .insert({
          user_id: ctx.userId,
          occurred_at: occurredAt,
          content,
          mood: mood ?? null,
          energy: energy ?? null,
        })
        .select("id, occurred_at")
        .single()
      if (error) throw new Error("Could not save the reflection.")

      return {
        content: [{ type: "text" as const, text: "Reflection saved." }],
        structuredContent: {
          reflection: { id: data.id as string, occurredAt: data.occurred_at as string },
          created: true,
        },
      }
    }),
  )
}
