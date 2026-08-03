import { streamText } from "ai"
import { AI_PROVIDER_OPTIONS, DEFAULT_MODEL, aiModel, requireUser, sseChunk, sseResponse, learnerProfileBlock } from "@/lib/server/ai"
import { checkRateLimit, recordUsage } from "@/lib/server/ai-limits"
import { shouldAnalyzeKoreanTurn } from "@/lib/learning/korean-text"
import { runTurnAnalysis } from "@/lib/server/turn-analysis"
import { persistTurnMistakes } from "@/lib/server/corrections-store"
import { buildPhrasebookContextBlock } from "@/lib/server/phrasebook-context"

const MAX_MESSAGE_LENGTH = 4000

// Streaming chat reply. Persists both message rows (RLS via the caller's JWT)
// and emits the same SSE events the Spring /chat/stream endpoint used:
// start { userMessageId } → token { token }* → done { assistantMessageId }.
export async function POST(req: Request): Promise<Response> {
  const requestStartedAt = performance.now()
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, db } = auth

  const body = (await req.json().catch(() => ({}))) as {
    conversationId?: string
    message?: string
    displayMessage?: string
    voiceMode?: boolean
  }
  const conversationId = body.conversationId
  const message = body.message?.trim()
  const voiceMode = body.voiceMode === true
  if (!conversationId || !message) {
    return Response.json({ error: "conversationId and message are required" }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
  }
  const displayMessage = body.displayMessage?.trim() || message

  const rateStatus = await checkRateLimit(db, user.id, "chat")
  if (!rateStatus.allowed) {
    return Response.json(
      { error: `Daily chat limit reached (${rateStatus.limit}/day). Try again tomorrow.` },
      { status: 429 },
    )
  }

  // Conversation must exist and belong to the caller (RLS enforces the latter).
  const { data: conversation, error: convError } = await db
    .from("kori_conversations")
    .select("id, conversation_type")
    .eq("id", conversationId)
    .single()
  if (convError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 })
  }

  const [{ data: historyRows }, { data: profile }, { data: userMessage, error: insertError }, phrasebookBlock] = await Promise.all([
    db
      .from("kori_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(29),
    db
      .from("kori_profiles")
      .select("display_name, korean_level, preferred_model, occupation, learning_goal, native_language, country")
      .maybeSingle(),
    db
      .from("kori_messages")
      .insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: displayMessage })
      .select("id")
      .single(),
    buildPhrasebookContextBlock(db, user.id),
  ])
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  const history = [
    ...((historyRows ?? []).reverse().map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
    }))),
    { role: "user" as const, content: message },
  ]
  const preparedAt = performance.now()

  const learnerName = profile?.display_name || "there"
  const level = profile?.korean_level ?? "BEGINNER"
  const profileBlock = learnerProfileBlock({
    occupation: profile?.occupation,
    learningGoal: profile?.learning_goal,
    nativeLanguage: profile?.native_language,
    country: profile?.country,
  })

  const coachingStyle = voiceMode
    ? "Voice conversation style:\n" +
      "- Reply in natural, contemporary Korean matched to the learner's level. Put the spoken Korean first.\n" +
      "- Sound like a real conversation partner: react directly, vary your openings, and avoid canned praise or lecture-like explanations.\n" +
      "- Keep each turn to 1-3 short speakable sentences and ask exactly one relevant follow-up question.\n" +
      "- Do not use markdown, headings, lists, emoji, or stage directions in a voice reply.\n" +
      "- Then add one EN: subtitle line and one RR: romanization line for the visible learning aids.\n" +
      "- Add a concise FIX: line only when the learner's Korean would sound unnatural or change the intended meaning.\n"
    : "Coaching style:\n" +
      "- Reply in clear, learner-friendly English. Keep it concise (2-5 sentences) unless more is asked.\n" +
      "- If the learner writes Korean with mistakes, gently correct it: show the corrected Korean, then briefly explain the fix in English.\n" +
      "- Whenever you give Korean, include the English translation, and add Revised Romanization for beginner/intermediate learners.\n" +
      "- End with a short natural follow-up question in Korean (with its English translation) to keep them practicing.\n"

  const system =
    `You are Hengo, a warm, encouraging Korean language tutor and conversation coach.\n` +
    `You are helping ${learnerName}, whose Korean level is ${level}. Conversation type: ${conversation.conversation_type}.\n\n` +
    coachingStyle +
    "- Match the Korean difficulty to the learner's level.\n" +
    "- When useful, ground examples in the learner's job and goal so practice is relevant to their real work.\n" +
    "- Stay supportive and motivating without praising the learner automatically on every turn.\n" +
    "- Use the conversation so far for context; do not repeat yourself or forget what was already said.\n\n" +
    (profileBlock ? `${profileBlock}\n\n` : "") +
    (phrasebookBlock ? `${phrasebookBlock}\n\n` : "")

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sseChunk("start", { userMessageId: userMessage.id }))
      let firstTokenAt: number | null = null
      try {
        const result = streamText({
          model: aiModel(profile?.preferred_model),
          providerOptions: AI_PROVIDER_OPTIONS,
          system,
          messages: history,
        })
        let full = ""
        for await (const token of result.textStream) {
          if (firstTokenAt === null) {
            firstTokenAt = performance.now()
          }
          full += token
          controller.enqueue(sseChunk("token", { token }))
        }
        const generationFinishedAt = performance.now()
        const usage = await Promise.resolve(result.usage).catch(() => null)
        void recordUsage(db, {
          userId: user.id,
          feature: "chat",
          model: profile?.preferred_model || DEFAULT_MODEL,
          inputTokens: usage?.inputTokens ?? null,
          outputTokens: usage?.outputTokens ?? null,
          totalTokens: usage?.totalTokens ?? null,
          latencyMs: Math.round(generationFinishedAt - requestStartedAt),
          success: true,
        })
        const [assistantInsert, conversationTouch] = await Promise.all([
          db
            .from("kori_messages")
            .insert({
              conversation_id: conversationId,
              user_id: user.id,
              role: "assistant",
              content: full,
            })
            .select("id")
            .single(),
          db
            .from("kori_conversations")
            .update({ model_used: profile?.preferred_model ?? null })
            .eq("id", conversationId),
        ])
        if (assistantInsert.error) throw assistantInsert.error
        if (conversationTouch.error) throw conversationTouch.error

        // Runs after the visible reply has already fully streamed to the
        // client — analysis/persistence failures are swallowed inside these
        // helpers so they can never fail the chat turn itself.
        if (shouldAnalyzeKoreanTurn(displayMessage)) {
          try {
            const analysis = await runTurnAnalysis({ level, text: displayMessage })
            if (analysis) {
              if (analysis.hasErrors && analysis.mistakes.length > 0) {
                await persistTurnMistakes({
                  db,
                  userId: user.id,
                  sourceFeature: "chat",
                  sourceId: conversationId,
                  mistakes: analysis.mistakes,
                  naturalVersion: analysis.naturalVersion,
                })
              }
              controller.enqueue(sseChunk("turn_analysis", analysis))
            }
          } catch (analysisErr) {
            console.error(
              "[chat-stream] turn analysis failed:",
              analysisErr instanceof Error ? analysisErr.message : "unknown error",
            )
          }
        }

        const completedAt = performance.now()
        console.info("[chat-stream] timings", {
          conversationId,
          historyCount: history.length,
          prepareMs: Math.round(preparedAt - requestStartedAt),
          firstTokenMs: firstTokenAt === null ? null : Math.round(firstTokenAt - requestStartedAt),
          generationMs: Math.round(generationFinishedAt - preparedAt),
          persistMs: Math.round(completedAt - generationFinishedAt),
          totalMs: Math.round(completedAt - requestStartedAt),
        })
        controller.enqueue(sseChunk("done", { assistantMessageId: assistantInsert.data.id }))
      } catch (err) {
        void recordUsage(db, {
          userId: user.id,
          feature: "chat",
          model: profile?.preferred_model || DEFAULT_MODEL,
          latencyMs: Math.round(performance.now() - requestStartedAt),
          success: false,
          errorCode: err instanceof Error ? err.name : "unknown",
        })
        controller.enqueue(
          sseChunk("error", { message: err instanceof Error ? err.message : "Chat failed" }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}

