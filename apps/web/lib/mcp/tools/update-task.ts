// update_task — write, gated on MCP_WRITE_ENABLED. Field edits only: title,
// description, dates, tags, duration. Never touches status/completed (that's
// complete_task's job — see lib/task-status.ts's "write" rule) and never
// reschedule_count (owned solely by the app's own reschedule flow).
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { todayInAppTimezone } from "@/lib/task-status"
import { ymdSchema } from "./schemas"
import { TASK_COLUMNS, taskSummarySchema, toTaskSummary } from "./tasks"
import { isTaskWritableBy } from "./ownership"
import { instrumentedTool } from "./instrument"

const inputSchema = z
  .object({
    taskId: z.string().uuid(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    startDate: ymdSchema.optional(),
    endDate: ymdSchema.optional(),
    durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  })
  .refine(
    (input) => input.title !== undefined || input.description !== undefined || input.startDate !== undefined ||
      input.endDate !== undefined || input.durationMinutes !== undefined || input.tags !== undefined,
    { message: "Provide at least one field to change." },
  )

export function registerUpdateTaskTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "update_task",
    {
      title: "Update task",
      description:
        "Edit an existing task's title, description, dates, duration, or tags. Does not change its workflow " +
        "status — use complete_task to mark it done. Obtain the task id from list_tasks or get_goal_tasks first.",
      inputSchema,
      outputSchema: z.object({ task: taskSummarySchema, changed: z.literal(true), url: z.string() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    instrumentedTool(ctx, "write", "update_task", async ({ taskId, title, description, startDate, endDate, durationMinutes, tags }) => {
      const { data: existing, error: fetchError } = await ctx.db
        .from("tasks")
        .select("id, user_id, goal_id")
        .eq("id", taskId)
        .maybeSingle()
      if (fetchError) throw new Error("Could not load the task.")
      if (!existing || !(await isTaskWritableBy(ctx.db, existing, ctx.userId))) {
        return { isError: true, content: [{ type: "text" as const, text: "No task found with that id." }] }
      }

      const today = todayInAppTimezone()
      const patch: Record<string, unknown> = { updated_by: ctx.userId }
      if (title !== undefined) patch.title = title
      if (description !== undefined) patch.description = description
      if (startDate !== undefined) patch.start_date = startDate
      if (endDate !== undefined) patch.end_date = endDate
      if (durationMinutes !== undefined) patch.duration_minutes = durationMinutes
      if (tags !== undefined) patch.tags = tags

      const { data, error } = await ctx.db.from("tasks").update(patch).eq("id", taskId).select(TASK_COLUMNS).single()
      if (error) throw new Error("Could not update the task.")

      const task = toTaskSummary(data, today)
      const url = task.goalId ? `/goals/${task.goalId}/tasks` : "/goals/tasks"
      return {
        content: [{ type: "text" as const, text: `Updated task "${task.title}".` }],
        structuredContent: { task, changed: true as const, url },
      }
    }),
  )
}
