// get_today_overview — a single-call snapshot of what's due today, mirroring
// what app/(main)/home/page.tsx assembles client-side (today's tasks + a
// goals count). Habits are deliberately out of scope here — no habit tool
// was requested, and this stays a tasks/goals snapshot.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { todayInAppTimezone } from "@/lib/task-status"
import { TASK_COLUMNS, taskSummarySchema, toTaskSummary } from "./tasks"
import { instrumentedTool } from "./instrument"

export function registerTodayOverviewTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "get_today_overview",
    {
      title: "Get today's overview",
      description:
        "Snapshot of the signed-in user's day: tasks due today (open ones first) and how many active goals " +
        'they have. Use this as the default starting point for "what should I do today" style questions.',
      inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
      outputSchema: z.object({
        today: z.string(),
        tasks: z.array(taskSummarySchema),
        totalTasksToday: z.number(),
        truncated: z.boolean(),
        activeGoalCount: z.number(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    instrumentedTool(ctx, "read", "get_today_overview", async ({ limit }) => {
      const today = todayInAppTimezone()
      const [tasksRes, goalsRes] = await Promise.all([
        ctx.db
          .from("tasks")
          .select(TASK_COLUMNS, { count: "exact" })
          .gte("end_date", today)
          .lte("start_date", today)
          .order("start_date", { ascending: true })
          .limit(limit),
        ctx.db.from("goals").select("id", { count: "exact", head: true }).eq("status", "active"),
      ])
      if (tasksRes.error) throw new Error("Could not load today's tasks.")
      if (goalsRes.error) throw new Error("Could not load goal counts.")

      const tasks = (tasksRes.data ?? []).map((row) =>
        toTaskSummary(row as Parameters<typeof toTaskSummary>[0], today),
      )
      const totalTasksToday = tasksRes.count ?? tasks.length
      const activeGoalCount = goalsRes.count ?? 0
      const truncated = totalTasksToday > tasks.length

      return {
        content: [
          {
            type: "text" as const,
            text: `${totalTasksToday} task${totalTasksToday === 1 ? "" : "s"} due today, ${activeGoalCount} active goal${activeGoalCount === 1 ? "" : "s"}.`,
          },
        ],
        structuredContent: { today, tasks, totalTasksToday, truncated, activeGoalCount },
      }
    }),
  )
}
