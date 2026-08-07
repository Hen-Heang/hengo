// create_task — write, gated on MCP_WRITE_ENABLED. Creates exactly one task
// per call (no batch input). If goalId is given, the goal must be owned by
// the caller — RLS would also allow writing into a goal the caller was only
// shared into, which lib/mcp/tools/ownership.ts closes off for MCP writes.
//
// Idempotency: a natural-key dedupe on (user_id, title, start_date, goal_id)
// within a short lookback window — an agent retry after a timeout produces
// the identical insert, and returns the existing task (created: false)
// instead of a duplicate. Best-effort (a check-then-insert race can still
// double-write under true concurrency), same caveat as every other
// natural-key dedupe in this server.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { deriveStatusFromSchedule, taskStatusPatch, todayInAppTimezone } from "@/lib/task-status"
import { ymdSchema } from "./schemas"
import { TASK_COLUMNS, taskSummarySchema, toTaskSummary } from "./tasks"
import { isGoalOwnedBy } from "./ownership"
import { instrumentedTool } from "./instrument"

// Covers an agent retry after a dropped response without blocking a
// legitimately re-created same-titled task hours or days later.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000

const inputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    goalId: z.string().uuid().nullable().optional(),
    startDate: ymdSchema,
    endDate: ymdSchema.optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  })
  .refine((input) => (input.endDate ?? input.startDate) >= input.startDate, {
    message: "endDate must be on or after startDate.",
    path: ["endDate"],
  })

export function registerCreateTaskTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "create_task",
    {
      title: "Create task",
      description:
        "Create one new task for the signed-in user, either standalone or under a goal they own — obtain the " +
        "goal id from list_goals first. Creates exactly one task per call. Ask the user before calling this.",
      inputSchema,
      outputSchema: z.object({ task: taskSummarySchema, created: z.boolean(), url: z.string() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "write", "create_task", async ({ title, description, goalId, startDate, endDate, durationMinutes, tags }) => {
      if (goalId && !(await isGoalOwnedBy(ctx.db, goalId, ctx.userId))) {
        return { isError: true, content: [{ type: "text" as const, text: "You don't own a goal with that id." }] }
      }

      const today = todayInAppTimezone()
      const resolvedEndDate = endDate ?? startDate

      let existingQuery = ctx.db
        .from("tasks")
        .select(TASK_COLUMNS)
        .eq("user_id", ctx.userId)
        .eq("title", title)
        .eq("start_date", startDate)
        .gte("created_at", new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString())
      existingQuery = goalId ? existingQuery.eq("goal_id", goalId) : existingQuery.is("goal_id", null)
      const { data: existing, error: dedupeError } = await existingQuery.maybeSingle()
      if (dedupeError) throw new Error("Could not create the task.")
      if (existing) {
        const task = toTaskSummary(existing, today)
        const url = task.goalId ? `/goals/${task.goalId}/tasks` : "/goals/tasks"
        return {
          content: [{ type: "text" as const, text: `Already created "${task.title}" moments ago — no duplicate created.` }],
          structuredContent: { task, created: false, url },
        }
      }

      const { data, error } = await ctx.db
        .from("tasks")
        .insert({
          user_id: ctx.userId,
          goal_id: goalId ?? null,
          title,
          description: description ?? "",
          start_date: startDate,
          end_date: resolvedEndDate,
          duration_minutes: durationMinutes ?? null,
          tags: tags ?? [],
          is_anytime: true,
          source: "manual",
          scheduling_source: "manual",
          ...taskStatusPatch(deriveStatusFromSchedule({ start_date: startDate, end_date: resolvedEndDate }, today)),
        })
        .select(TASK_COLUMNS)
        .single()
      if (error) throw new Error("Could not create the task.")

      const task = toTaskSummary(data, today)
      const url = task.goalId ? `/goals/${task.goalId}/tasks` : "/goals/tasks"
      return {
        content: [{ type: "text" as const, text: `Created task "${task.title}" (${task.status}).` }],
        structuredContent: { task, created: true, url },
      }
    }),
  )
}
