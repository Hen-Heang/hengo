// list_goals / get_goal — read-only, scoped by RLS to goals the caller owns
// or has been shared into (see lib/mcp/context.ts and the RLS notes in the
// plan: goals.SELECT admits owner, public, and goal_members rows). isOwner
// is always computed and returned so a shared goal is never presented as the
// caller's own.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { uuidSchema } from "./schemas"
import { instrumentedTool } from "./instrument"

// Blueprint: lib/api/goals.ts's GOAL_SELECT / enrichGoal — re-implemented
// here against the per-request client (lib/api/* is browser-bound and must
// not be imported server-side; see AGENTS.md and lib/mcp/server.ts's header).
// Exported for create-goal.ts / update-goal.ts, which re-fetch the same
// shape after a write so their result matches what list_goals/get_goal report.
export const GOAL_SELECT = "*, goal_stars(user_id), tasks(id, completed), goal_key_results(*)"

export interface GoalRow {
  id: string
  title: string
  description: string
  status: string
  target_date: string | null
  health_status: string | null
  health_reason: string | null
  outcome_statement: string | null
  success_definition: string | null
  motivation: string | null
  review_frequency: string | null
  last_reviewed_at: string | null
  user_id: string
  goal_stars?: { user_id: string }[] | null
  tasks?: { id: string; completed: boolean }[] | null
  goal_key_results?:
    | { id: string; title: string; target_value: number | null; current_value: number | null; unit: string | null }[]
    | null
}

const keyResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetValue: z.number().nullable(),
  currentValue: z.number().nullable(),
  unit: z.string().nullable(),
})

export const goalSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  targetDate: z.string().nullable(),
  healthStatus: z.string().nullable(),
  isOwner: z.boolean(),
  isStarred: z.boolean(),
  taskCounts: z.object({ total: z.number(), completed: z.number(), incomplete: z.number() }),
})

export const goalDetailSchema = goalSummarySchema.extend({
  outcomeStatement: z.string().nullable(),
  successDefinition: z.string().nullable(),
  motivation: z.string().nullable(),
  reviewFrequency: z.string().nullable(),
  healthReason: z.string().nullable(),
  lastReviewedAt: z.string().nullable(),
  keyResults: z.array(keyResultSchema),
})

export function toSummary(row: GoalRow, userId: string) {
  const tasks = row.tasks ?? []
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    targetDate: row.target_date,
    healthStatus: row.health_status,
    isOwner: row.user_id === userId,
    isStarred: Boolean(row.goal_stars?.some((s) => s.user_id === userId)),
    taskCounts: { total, completed, incomplete: total - completed },
  }
}

export function toDetail(row: GoalRow, userId: string) {
  return {
    ...toSummary(row, userId),
    outcomeStatement: row.outcome_statement,
    successDefinition: row.success_definition,
    motivation: row.motivation,
    reviewFrequency: row.review_frequency,
    healthReason: row.health_reason,
    lastReviewedAt: row.last_reviewed_at,
    keyResults: (row.goal_key_results ?? []).map((kr) => ({
      id: kr.id,
      title: kr.title,
      targetValue: kr.target_value,
      currentValue: kr.current_value,
      unit: kr.unit,
    })),
  }
}

export function registerGoalTools(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "list_goals",
    {
      title: "List goals",
      description:
        "List the signed-in user's goals, newest first, with task-count rollups. Includes goals shared with " +
        "the user (flagged isOwner: false) as well as their own — never presents a shared goal as owned. " +
        "Use this before get_goal or get_goal_tasks to find a goal's id.",
      inputSchema: z.object({
        status: z.enum(["active", "completed", "all"]).default("active"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      outputSchema: z.object({
        goals: z.array(goalSummarySchema),
        total: z.number(),
        truncated: z.boolean(),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "read", "list_goals", async ({ status, limit }) => {
      let query = ctx.db
        .from("goals")
        .select(GOAL_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(limit)
      if (status !== "all") query = query.eq("status", status)
      const { data, error, count } = await query
      if (error) throw new Error("Could not load goals.")

      const goals = ((data ?? []) as GoalRow[]).map((row) => toSummary(row, ctx.userId))
      const total = count ?? goals.length
      const truncated = total > goals.length
      return {
        content: [
          {
            type: "text" as const,
            text: `${total} goal${total === 1 ? "" : "s"}${truncated ? ` (showing ${goals.length})` : ""}.`,
          },
        ],
        structuredContent: { goals, total, truncated },
      }
    }),
  )

  server.registerTool(
    "get_goal",
    {
      title: "Get goal details",
      description:
        "Full detail for one goal by id, including its key results. Obtain the id from list_goals first — " +
        "never guess one. Returns an error if the goal doesn't exist or isn't visible to the signed-in user; " +
        "the two cases are indistinguishable by design.",
      inputSchema: z.object({ goalId: uuidSchema }),
      outputSchema: z.object({ goal: goalDetailSchema }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    instrumentedTool(ctx, "read", "get_goal", async ({ goalId }) => {
      const { data, error } = await ctx.db.from("goals").select(GOAL_SELECT).eq("id", goalId).maybeSingle()
      if (error) throw new Error("Could not load the goal.")
      if (!data) {
        return { isError: true, content: [{ type: "text" as const, text: "No goal found with that id." }] }
      }

      const goal = toDetail(data as GoalRow, ctx.userId)
      return {
        content: [
          { type: "text" as const, text: `${goal.title} — ${goal.status}${goal.isOwner ? "" : " (shared with you)"}` },
        ],
        structuredContent: { goal },
      }
    }),
  )
}
