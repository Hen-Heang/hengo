// list_tasks / get_goal_tasks — read-only, scoped by RLS (tasks.SELECT
// admits the caller's own tasks, tasks in goals they own, and tasks in goals
// they've been shared into). Status is always the *resolved* workflow status
// (lib/task-status.ts's resolveTaskStatus), not the raw column — `completed`
// stays authoritative on read while Orbit's own writers exist, exactly as
// the rest of the app treats it.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import { addDays, format, parseISO } from "date-fns"
import type { McpContext } from "../context"
import { resolveTaskStatus, taskDueDate, todayInAppTimezone, type TaskStatus } from "@/lib/task-status"
import { ymdSchema } from "./schemas"
import { instrumentedTool } from "./instrument"

// Blueprint: tasksApi.range / goalsApi.getTasks in lib/api/goals.ts —
// re-implemented against the per-request client (see goals.ts's header note).
interface TaskRow {
  id: string
  title: string | null
  description: string
  goal_id: string | null
  start_date: string
  end_date: string
  is_anytime: boolean | null
  duration_minutes: number | null
  completed: boolean
  status: TaskStatus | null
  blocked_reason: string | null
  tags: string[] | null
}

export const taskSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  goalId: z.string().nullable(),
  status: z.enum(["backlog", "scheduled", "in_progress", "blocked", "completed"]),
  startDate: z.string(),
  endDate: z.string(),
  isAnytime: z.boolean(),
  durationMinutes: z.number().nullable(),
  overdue: z.boolean(),
  blockedReason: z.string().nullable(),
  tags: z.array(z.string()),
})

export function toTaskSummary(row: TaskRow, todayYmd: string) {
  const asTaskShape = { completed: row.completed, status: row.status ?? undefined, start_date: row.start_date, end_date: row.end_date }
  const status = resolveTaskStatus(asTaskShape as Parameters<typeof resolveTaskStatus>[0], todayYmd)
  const due = taskDueDate(row)
  return {
    id: row.id,
    title: row.title?.trim() || row.description.slice(0, 60) || "Task",
    description: row.description,
    goalId: row.goal_id,
    status,
    startDate: row.start_date,
    endDate: row.end_date,
    isAnytime: row.is_anytime ?? true,
    durationMinutes: row.duration_minutes,
    overdue: status !== "completed" && due != null && due < todayYmd,
    blockedReason: row.blocked_reason,
    tags: row.tags ?? [],
  }
}

export const TASK_COLUMNS =
  "id, title, description, goal_id, start_date, end_date, is_anytime, duration_minutes, completed, status, blocked_reason, tags"

const MAX_RANGE_DAYS = 180

/** Clamps `to` so a caller can't request an unbounded/huge date span. */
function clampRange(from: string, to: string): string {
  const start = parseISO(from)
  const end = parseISO(to)
  const maxEnd = addDays(start, MAX_RANGE_DAYS)
  return end > maxEnd ? format(maxEnd, "yyyy-MM-dd") : to
}

export function registerTaskTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description:
        "List the signed-in user's tasks in a date range (default: today through the next 14 days, capped at " +
        "180 days). Omit goalId for all tasks, pass null for personal (non-goal) tasks only, or a goal id from " +
        "list_goals to scope to one goal. Each task's status is the resolved workflow status (backlog, " +
        "scheduled, in_progress, blocked, or completed).",
      inputSchema: z.object({
        goalId: z.string().uuid().nullable().optional(),
        from: ymdSchema.optional(),
        to: ymdSchema.optional(),
        status: z.enum(["open", "completed", "all"]).default("open"),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      outputSchema: z.object({
        tasks: z.array(taskSummarySchema),
        total: z.number(),
        truncated: z.boolean(),
        today: z.string(),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "read", "list_tasks", async ({ goalId, from, to, status, limit }) => {
      const today = todayInAppTimezone()
      const rangeFrom = from ?? today
      const rangeTo = clampRange(rangeFrom, to ?? format(addDays(parseISO(rangeFrom), 14), "yyyy-MM-dd"))

      let query = ctx.db
        .from("tasks")
        .select(TASK_COLUMNS, { count: "exact" })
        .gte("end_date", rangeFrom)
        .lte("start_date", rangeTo)
        .order("start_date", { ascending: true })
        .limit(limit)
      if (goalId === null) query = query.is("goal_id", null)
      else if (goalId) query = query.eq("goal_id", goalId)
      if (status !== "all") query = query.eq("completed", status === "completed")

      const { data, error, count } = await query
      if (error) throw new Error("Could not load tasks.")

      const tasks = ((data ?? []) as TaskRow[]).map((row) => toTaskSummary(row, today))
      const total = count ?? tasks.length
      const truncated = total > tasks.length
      return {
        content: [{ type: "text" as const, text: `${total} task${total === 1 ? "" : "s"}${truncated ? ` (showing ${tasks.length})` : ""}.` }],
        structuredContent: { tasks, total, truncated, today },
      }
    }),
  )

  server.registerTool(
    "get_goal_tasks",
    {
      title: "Get a goal's tasks",
      description: "List every task under one goal, oldest first. Obtain the goal id from list_goals first.",
      inputSchema: z.object({
        goalId: z.string().uuid(),
        status: z.enum(["open", "completed", "all"]).default("all"),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      outputSchema: z.object({
        tasks: z.array(taskSummarySchema),
        total: z.number(),
        truncated: z.boolean(),
        today: z.string(),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "read", "get_goal_tasks", async ({ goalId, status, limit }) => {
      const today = todayInAppTimezone()
      let query = ctx.db
        .from("tasks")
        .select(TASK_COLUMNS, { count: "exact" })
        .eq("goal_id", goalId)
        .order("start_date", { ascending: true })
        .limit(limit)
      if (status !== "all") query = query.eq("completed", status === "completed")

      const { data, error, count } = await query
      if (error) throw new Error("Could not load the goal's tasks.")

      const tasks = ((data ?? []) as TaskRow[]).map((row) => toTaskSummary(row, today))
      const total = count ?? tasks.length
      const truncated = total > tasks.length
      return {
        content: [{ type: "text" as const, text: `${total} task${total === 1 ? "" : "s"}${truncated ? ` (showing ${tasks.length})` : ""}.` }],
        structuredContent: { tasks, total, truncated, today },
      }
    }),
  )
}
