import { z } from "zod"
import { jsonAiRoute } from "@/lib/server/ai"

const DEFAULT_WINDOW_DAYS = 30

export const POST = jsonAiRoute(
  z.object({
    tasks: z.array(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        start_date: z.string().describe("ISO date"),
        end_date: z.string().describe("ISO date"),
        duration_minutes: z.number().nullable(),
      }),
    ),
  }),
  (body) => {
    const count = Number(body.count) || 5
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = body.targetDate ? new Date(String(body.targetDate)) : null
    const windowDays =
      target && !Number.isNaN(target.getTime())
        ? Math.max(1, Math.round((target.getTime() - today.getTime()) / 86_400_000))
        : DEFAULT_WINDOW_DAYS

    return (
      `You are a goal-planning assistant. Break the user's goal into ${count} concrete, actionable tasks.\n\n` +
      `Goal title: ${String(body.goalTitle)}\n` +
      `Description: ${String(body.goalDescription ?? "(none)")}\n` +
      `Timeframe: ${windowDays} days, starting at day 0 = today (${today.toISOString().slice(0, 10)}).\n` +
      `${body.note ? `Extra instructions: ${String(body.note)}\n` : ""}` +
      "\nRules:\n" +
      "- Each task is a single, specific, achievable action (imperative title, max ~60 chars).\n" +
      `- Spread tasks across the timeframe, ordered by when they should happen (day 0 to day ${windowDays - 1}) — ` +
      "don't cram everything into the first few days.\n" +
      "- start_date and end_date must be realistic ISO dates within that window, consistent with each task's " +
      "place in the sequence (later tasks get later dates).\n" +
      "- duration_minutes is optional; use null for tasks without a fixed time commitment."
    )
  },
  "You are a practical project planner. Make tasks small, ordered, and achievable.",
)
