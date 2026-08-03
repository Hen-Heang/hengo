import { streamObject } from "ai"
import { z } from "zod"
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_MODEL,
  FORMALITY_LABELS,
  aiModel,
  requireUser,
  sseChunk,
  sseResponse,
} from "@/lib/server/ai"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"

const inputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  source: z.string().max(100).optional(),
})

const schema = z.object({
  originalText: z.string(),
  literalMeaning: z.string(),
  naturalMeaning: z.string(),
  businessContext: z.string(),
  politenessLevel: z.string(),
  tone: z.string(),
  breakdown: z.array(z.object({ fragment: z.string(), meaning: z.string(), note: z.string() })),
  suggestedReplies: z.array(
    z.object({ korean: z.string(), english: z.string(), formality: z.string() }),
  ),
  modelUsed: z.string(),
})

const ANALYZER_SYSTEM =
  "You are a Korean workplace communication analyst helping a foreign software engineer fully understand real " +
  "Korean messages from coworkers (Slack, KakaoTalk, meeting notes, team chat)."

// Streams the analysis as it's generated (start → partial* → done → error),
// same SSE event shape as chat/stream and goals/coach, so the UI can render
// each field/breakdown item as soon as the model produces it instead of
// waiting ~8s for the whole structured object at once.
export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, db } = auth

  const rateStatus = await checkRateLimit(db, user.id, "analyzer")
  if (!rateStatus.allowed) {
    return Response.json({ error: `Daily limit reached for AI grading / generation requests (${rateStatus.limit}/day). Try again tomorrow.` }, { status: 429 })
  }

  const rawBody = await req.json().catch(() => ({}))
  const parsed = inputSchema.safeParse(rawBody)
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.issues.map((i) => i.message) }, { status: 400 })
  }
  const { text, source } = parsed.data

  const prompt =
    "Analyze the message below in EXTREME detail so a non-native engineer understands exactly what was meant, " +
    "how it lands socially, and how they should respond.\n" +
    "Rules:\n" +
    "- \"breakdown\" must cover EVERY meaningful phrase/honorific in the message so nothing is left unexplained.\n" +
    "- Pay special attention to honorifics (-시-, -습니다, -드리다, 분, 님) and explain the social signal each sends.\n" +
    `- \"politenessLevel\" must be exactly one of ${FORMALITY_LABELS}, followed by a short English note on who it's appropriate for.\n` +
    `- Provide 2-3 \"suggestedReplies\" ranging across formality (each formality exactly one of ${FORMALITY_LABELS}) unless a reply would be inappropriate, then return [].\n` +
    "- All explanations must be in English.\n\n" +
    `Analyze this Korean workplace message a developer received${source ? ` (via ${source})` : ""}:\n` +
    `"${text}"\n\n` +
    "Give: literal meaning, natural meaning, the business context/subtext, politeness level, tone, " +
    `the fragment breakdown, and suggested replies. Set modelUsed to "${DEFAULT_MODEL}".`

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseChunk("start", {}))
      try {
        const result = streamObject({
          model: aiModel(),
          providerOptions: AI_PROVIDER_OPTIONS,
          schema,
          system: ANALYZER_SYSTEM,
          prompt,
        })
        for await (const partial of result.partialObjectStream) {
          controller.enqueue(sseChunk("partial", partial))
        }
        const object = await result.object
        const usage = await Promise.resolve(result.usage).catch(() => null)
        void recordUsage(db, {
          userId: user.id,
          feature: "analyzer",
          model: DEFAULT_MODEL,
          inputTokens: usage?.inputTokens ?? null,
          outputTokens: usage?.outputTokens ?? null,
          totalTokens: usage?.totalTokens ?? null,
          latencyMs: Math.round(performance.now() - startedAt),
          success: true,
        })
        controller.enqueue(sseChunk("done", object))
      } catch (err) {
        void recordUsage(db, {
          userId: user.id,
          feature: "analyzer",
          model: DEFAULT_MODEL,
          latencyMs: Math.round(performance.now() - startedAt),
          success: false,
          errorCode: err instanceof Error ? err.name : "unknown",
        })
        controller.enqueue(
          sseChunk("error", { message: err instanceof Error ? err.message : "Analysis failed" }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}
