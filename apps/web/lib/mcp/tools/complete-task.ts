// complete_task — write, gated on MCP_WRITE_ENABLED. The one status-changing
// write tool, via taskStatusPatch("completed") — the only sanctioned way to
// set status/completed (lib/task-status.ts). Read-then-compare makes it
// genuinely idempotent: calling it twice never double-writes.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { resolveTaskStatus, taskStatusPatch, todayInAppTimezone } from "@/lib/task-status"
import { TASK_COLUMNS, taskSummarySchema, toTaskSummary } from "./tasks"
import { isTaskWritableBy } from "./ownership"
import { instrumentedTool } from "./instrument"

export function registerCompleteTaskTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "complete_task",
    {
      title: "Complete task",
      description:
        "Mark a task as completed. Safe to call more than once — if the task is already completed, nothing " +
        "is written and changed: false is returned. Obtain the task id from list_tasks or get_goal_tasks first.",
      inputSchema: z.object({ taskId: z.string().uuid() }),
      outputSchema: z.object({
        task: taskSummarySchema,
        previousStatus: z.string(),
        changed: z.boolean(),
        url: z.string(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "write", "complete_task", async ({ taskId }) => {
      // Fetches the full TaskSummary column set up front (not just the
      // ownership/status fields) so the "already completed" branch below can
      // return a complete summary without a second round-trip.
      const { data: existing, error: fetchError } = await ctx.db
        .from("tasks")
        .select(`${TASK_COLUMNS}, user_id`)
        .eq("id", taskId)
        .maybeSingle()
      if (fetchError) throw new Error("Could not load the task.")
      if (!existing || !(await isTaskWritableBy(ctx.db, existing, ctx.userId))) {
        return { isError: true, content: [{ type: "text" as const, text: "No task found with that id." }] }
      }

      const today = todayInAppTimezone()
      const previousStatus = resolveTaskStatus(existing as Parameters<typeof resolveTaskStatus>[0], today)
      const url = existing.goal_id ? `/goals/${existing.goal_id}/tasks` : "/goals/tasks"

      if (previousStatus === "completed") {
        const task = toTaskSummary(existing, today)
        return {
          content: [{ type: "text" as const, text: `"${task.title}" was already completed — no change made.` }],
          structuredContent: { task, previousStatus, changed: false, url },
        }
      }

      const { data, error } = await ctx.db
        .from("tasks")
        .update({ ...taskStatusPatch("completed"), updated_by: ctx.userId })
        .eq("id", taskId)
        .select(TASK_COLUMNS)
        .single()
      if (error) throw new Error("Could not complete the task.")

      const task = toTaskSummary(data, today)
      return {
        content: [{ type: "text" as const, text: `Completed "${task.title}".` }],
        structuredContent: { task, previousStatus, changed: true, url },
      }
    }),
  )
}
