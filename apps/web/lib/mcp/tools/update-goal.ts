// update_goal — write, gated on MCP_WRITE_ENABLED. Owner-only: a goal the
// caller was only shared into is never writable from MCP, even though RLS's
// own tasks policy is looser for goal members (see lib/mcp/tools/ownership.ts).
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { ymdSchema } from "./schemas"
import { GOAL_SELECT, type GoalRow, goalDetailSchema, toDetail } from "./goals"
import { instrumentedTool } from "./instrument"

const inputSchema = z
  .object({
    goalId: z.string().uuid(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    targetDate: ymdSchema.nullable().optional(),
    status: z.enum(["active", "completed"]).optional(),
  })
  .refine(
    (input) =>
      input.title !== undefined ||
      input.description !== undefined ||
      input.targetDate !== undefined ||
      input.status !== undefined,
    { message: "Provide at least one field to change." },
  )

export function registerUpdateGoalTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "update_goal",
    {
      title: "Update goal",
      description:
        "Edit an existing goal the signed-in user owns. Goals only shared with them (not owned) cannot be " +
        "edited from here. Obtain the goal id from list_goals first.",
      inputSchema,
      outputSchema: z.object({ goal: goalDetailSchema, changed: z.literal(true), url: z.string() }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    instrumentedTool(
      ctx,
      "write",
      "update_goal",
      async ({ goalId, title, description, targetDate, status }) => {
        const { data: existing, error: fetchError } = await ctx.db
          .from("goals")
          .select("id, user_id")
          .eq("id", goalId)
          .maybeSingle()
        if (fetchError) throw new Error("Could not load the goal.")
        if (!existing || existing.user_id !== ctx.userId) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: "You don't own a goal with that id." }],
          }
        }

        const patch: Record<string, unknown> = {}
        if (title !== undefined) patch.title = title
        if (description !== undefined) patch.description = description
        if (targetDate !== undefined) patch.target_date = targetDate
        if (status !== undefined) patch.status = status

        const { error: updateError } = await ctx.db.from("goals").update(patch).eq("id", goalId)
        if (updateError) throw new Error("Could not update the goal.")

        const { data, error } = await ctx.db
          .from("goals")
          .select(GOAL_SELECT)
          .eq("id", goalId)
          .single<GoalRow>()
        if (error) throw new Error("Updated the goal but could not load it back.")

        const goal = toDetail(data, ctx.userId)
        return {
          content: [{ type: "text" as const, text: `Updated goal "${goal.title}".` }],
          structuredContent: { goal, changed: true as const, url: `/goals/${goal.id}` },
        }
      },
    ),
  )
}
