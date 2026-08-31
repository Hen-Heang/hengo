// get_learning_progress — a bounded snapshot of Korean-learning activity:
// daily-practice streak, saved words, and what's due for review. Blueprint:
// progressApi.getDashboard / achievementsApi.getCounts in lib/api/progress.ts
// (browser-bound, not importable server-side — re-implemented against the
// per-request client). Deliberately excludes the recovery/mood/journal
// domain entirely, per lib/mcp/server.ts's header note.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { APP_TIMEZONE, todayInAppTimezone } from "@/lib/task-status"
import { TZDate } from "@date-fns/tz"
import { instrumentedTool } from "./instrument"

// Bounded fetch of recent activity dates, same cap as the blueprint — cheap
// at this app's personal-scale per-user data volume.
const ACTIVITY_LOOKBACK_ROWS = 2000

function seoulYmd(iso: string): string {
  return todayInAppTimezone(new Date(iso), APP_TIMEZONE)
}

/** Current streak of consecutive Seoul-local days with any activity. A
 * streak survives a missing "today" (the user simply hasn't practiced yet
 * today) — mirrors lib/api/progress.ts's computeStreak. */
function computeStreak(activityDates: Set<string>): { streakDays: number; activityToday: boolean } {
  const today = todayInAppTimezone()
  const activityToday = activityDates.has(today)
  let streak = 0
  const cursor = new TZDate(new Date(), APP_TIMEZONE)
  if (!activityToday) cursor.setDate(cursor.getDate() - 1)
  while (activityDates.has(todayInAppTimezone(cursor, APP_TIMEZONE))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return { streakDays: streak, activityToday }
}

export function registerLearningProgressTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "get_learning_progress",
    {
      title: "Get learning progress",
      description:
        "Snapshot of the signed-in user's Korean-learning activity: current daily-practice streak, total " +
        "words saved, and how many vocabulary cards and corrections are due for review right now.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        streakDays: z.number(),
        activityToday: z.boolean(),
        wordsSaved: z.number(),
        dueVocabCount: z.number(),
        dueCorrectionsCount: z.number(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    instrumentedTool(ctx, "read", "get_learning_progress", async () => {
      const nowIso = new Date().toISOString()
      const [activityRes, vocabCountRes, dueVocabRes, dueCorrectionsRes] = await Promise.all([
        ctx.db
          .from("kori_activity_log")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(ACTIVITY_LOOKBACK_ROWS),
        ctx.db.from("kori_vocab_cards").select("id", { count: "exact", head: true }),
        ctx.db
          .from("kori_vocab_cards")
          .select("id", { count: "exact", head: true })
          .lte("next_review", nowIso),
        ctx.db
          .from("kori_corrections")
          .select("id", { count: "exact", head: true })
          .lte("next_review_date", nowIso),
      ])
      if (activityRes.error) throw new Error("Could not load activity history.")
      if (vocabCountRes.error || dueVocabRes.error)
        throw new Error("Could not load vocabulary counts.")
      if (dueCorrectionsRes.error) throw new Error("Could not load correction counts.")

      const activityDates = new Set(
        (activityRes.data ?? []).map((row) => seoulYmd(row.created_at as string)),
      )
      const { streakDays, activityToday } = computeStreak(activityDates)

      const result = {
        streakDays,
        activityToday,
        wordsSaved: vocabCountRes.count ?? 0,
        dueVocabCount: dueVocabRes.count ?? 0,
        dueCorrectionsCount: dueCorrectionsRes.count ?? 0,
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `${result.streakDays}-day streak, ${result.wordsSaved} words saved, ${result.dueVocabCount + result.dueCorrectionsCount} reviews due.`,
          },
        ],
        structuredContent: result,
      }
    }),
  )
}
