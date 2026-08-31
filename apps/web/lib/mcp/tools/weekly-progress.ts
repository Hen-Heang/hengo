// get_weekly_progress — minutes practiced per day over the last 7 Seoul-
// local days. Blueprint: the weeklyMinutes/chartData half of
// progressApi.getDashboard in lib/api/progress.ts (browser-bound, not
// importable server-side — re-implemented against the per-request client).
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"
import type { McpContext } from "../context"
import { APP_TIMEZONE, todayInAppTimezone } from "@/lib/task-status"
import { instrumentedTool } from "./instrument"

const DAYS = 7

function seoulDaysAgo(n: number): TZDate {
  const zoned = new TZDate(new Date(), APP_TIMEZONE)
  zoned.setDate(zoned.getDate() - n)
  return zoned
}

const dayPointSchema = z.object({
  date: z.string(),
  day: z.string(),
  minutes: z.number(),
})

export function registerWeeklyProgressTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "get_weekly_progress",
    {
      title: "Get weekly progress",
      description:
        "Minutes of practice per day for the signed-in user over the last 7 days (Seoul-local calendar days), " +
        "oldest first, plus the 7-day total.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        totalMinutes: z.number(),
        days: z.array(dayPointSchema),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    instrumentedTool(ctx, "read", "get_weekly_progress", async () => {
      // A same-time-of-day lower bound is enough: rows are bucketed below by
      // exact Seoul-calendar day, so anything outside the 7 kept buckets is
      // simply never read back out of `byDay`.
      const windowStart = seoulDaysAgo(DAYS - 1)
      const { data, error } = await ctx.db
        .from("kori_activity_log")
        .select("duration_ms, created_at")
        .gte("created_at", windowStart.toISOString())
      if (error) throw new Error("Could not load activity history.")

      const rows = (data ?? []) as { duration_ms: number | null; created_at: string }[]
      const byDay = new Map<string, number>()
      for (const row of rows) {
        const key = todayInAppTimezone(new Date(row.created_at), APP_TIMEZONE)
        byDay.set(key, (byDay.get(key) ?? 0) + (row.duration_ms ?? 0))
      }

      const days = Array.from({ length: DAYS }, (_, i) => {
        const dayDate = seoulDaysAgo(DAYS - 1 - i)
        const key = todayInAppTimezone(dayDate, APP_TIMEZONE)
        return {
          date: key,
          day: format(dayDate, "EEE"),
          minutes: Math.round((byDay.get(key) ?? 0) / 60000),
        }
      })
      const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0)

      return {
        content: [
          {
            type: "text" as const,
            text: `${totalMinutes} minutes practiced over the last ${DAYS} days.`,
          },
        ],
        structuredContent: { totalMinutes, days },
      }
    }),
  )
}
