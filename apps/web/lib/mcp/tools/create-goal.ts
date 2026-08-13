// create_goal — write, gated on MCP_WRITE_ENABLED. Creates exactly one goal
// per call. `join_goal` is called once, immediately after, to create the
// caller's own creator-membership row — the same second step
// lib/api/goals.ts's goalsApi.create takes. p_user_id is always ctx.userId,
// never taken from input: this is the one sanctioned RPC call from MCP tool
// code (every other SECURITY DEFINER RPC on goals stays off-limits).
//
// Idempotency: a natural-key dedupe on (user_id, title) within a short
// lookback window, same rationale as create_task's.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { ymdSchema } from "./schemas"
import { GOAL_SELECT, type GoalRow, goalDetailSchema, toDetail } from "./goals"
import { instrumentedTool } from "./instrument"

const DEDUPE_WINDOW_MS = 10 * 60 * 1000

export function registerCreateGoalTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "create_goal",
    {
      title: "Create goal",
      description: "Create one new goal owned by the signed-in user. Ask the user before calling this.",
      inputSchema: z.object({
        title: z.string().trim().min(1).max(200),
        description: z.string().max(2000).optional(),
        targetDate: ymdSchema.nullable().optional(),
        status: z.enum(["active", "completed"]).default("active"),
      }),
      outputSchema: z.object({ goal: goalDetailSchema, created: z.boolean(), url: z.string() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "write", "create_goal", async ({ title, description, targetDate, status }) => {
      const { data: existingId, error: dedupeError } = await ctx.db
        .from("goals")
        .select("id")
        .eq("user_id", ctx.userId)
        .eq("title", title)
        .gte("created_at", new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString())
        .maybeSingle()
      if (dedupeError) throw new Error("Could not create the goal.")
      if (existingId) {
        const { data: existing, error: fetchError } = await ctx.db
          .from("goals")
          .select(GOAL_SELECT)
          .eq("id", existingId.id)
          .single<GoalRow>()
        if (fetchError) throw new Error("Could not load the existing goal.")
        const goal = toDetail(existing, ctx.userId)
        return {
          content: [{ type: "text" as const, text: `Already created "${goal.title}" moments ago — no duplicate created.` }],
          structuredContent: { goal, created: false, url: `/goals/${goal.id}` },
        }
      }

      const { data: inserted, error: insertError } = await ctx.db
        .from("goals")
        .insert({
          user_id: ctx.userId,
          title,
          description: description ?? "",
          target_date: targetDate ?? null,
          status,
          metadata: { goal_type: "general" },
        })
        .select("id")
        .single()
      if (insertError) throw new Error("Could not create the goal.")

      const { error: joinError } = await ctx.db.rpc("join_goal", {
        p_goal_id: inserted.id,
        p_user_id: ctx.userId,
        p_role: "creator",
      })
      if (joinError) throw new Error("Created the goal but could not finish setting it up.")

      const { data, error } = await ctx.db.from("goals").select(GOAL_SELECT).eq("id", inserted.id).single<GoalRow>()
      if (error) throw new Error("Created the goal but could not load it back.")

      const goal = toDetail(data, ctx.userId)
      return {
        content: [{ type: "text" as const, text: `Created goal "${goal.title}".` }],
        structuredContent: { goal, created: true, url: `/goals/${goal.id}` },
      }
    }),
  )
}
