import { streamText } from "ai"
import { AI_PROVIDER_OPTIONS, aiModel, requireUser, sseChunk, sseResponse } from "@/lib/server/ai"

// Per-goal AI coach — ephemeral SSE chat (start → token* → done), history passed
// by the client each turn, nothing persisted. Same event protocol as chat/stream.
export async function POST(req: Request): Promise<Response> {
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { db } = auth

  const { goalId, message, history } = (await req.json().catch(() => ({}))) as {
    goalId?: string
    message?: string
    history?: { role: "user" | "assistant"; content: string }[]
  }
  if (!goalId || !message) {
    return Response.json({ error: "goalId and message are required" }, { status: 400 })
  }

  const [{ data: goal }, { data: tasks }] = await Promise.all([
    db
      .from("goals")
      .select("title, description, target_date, status, metadata")
      .eq("id", goalId)
      .single(),
    db
      .from("tasks")
      .select("title, completed")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: true }),
  ])
  if (!goal) return Response.json({ error: "Goal not found" }, { status: 404 })

  const allTasks = tasks ?? []
  const completedCount = allTasks.filter((t) => t.completed).length
  const pendingTitles = allTasks
    .filter((t) => !t.completed)
    .slice(0, 8)
    .map((t) => `- ${t.title}`)
    .join("\n")

  const system =
    "You are KoriAI's goal coach: an encouraging, practical assistant that helps the user make progress on ONE " +
    "specific goal. Keep replies concise and actionable. Suggest concrete next steps; you may reference their " +
    "tasks. Do not invent facts about their progress beyond what is given.\n\n" +
    "=== Goal ===\n" +
    `Title: ${goal.title}\n` +
    (goal.description ? `Description: ${goal.description}\n` : "") +
    `Status: ${goal.status}\n` +
    (goal.target_date ? `Target date: ${goal.target_date}\n` : "") +
    `Tasks: ${completedCount}/${allTasks.length} completed.\n` +
    (pendingTitles ? `Pending tasks:\n${pendingTitles}\n` : "")

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseChunk("start", {}))
      try {
        const result = streamText({
          model: aiModel(),
          providerOptions: AI_PROVIDER_OPTIONS,
          system,
          messages: [...(history ?? []).slice(-20), { role: "user" as const, content: message }],
        })
        for await (const token of result.textStream) {
          controller.enqueue(sseChunk("token", { token }))
        }
        controller.enqueue(sseChunk("done", {}))
      } catch (err) {
        controller.enqueue(
          sseChunk("error", { message: err instanceof Error ? err.message : "Coach failed" }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}
