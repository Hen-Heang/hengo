// capture_korean_phrase — write, gated on MCP_WRITE_ENABLED. Quick-saves a
// word or phrase into the signed-in user's vocab deck (kori_vocab_cards).
// Blueprint: lib/api/vocab.ts's vocabApi.save / autoPronunciation — the SRS
// scheduling columns (mastery, next_review, ease_factor, ...) all have DB
// defaults and are left untouched, exactly as vocabApi.save leaves them.
// `romanize` is imported directly from es-hangul (a plain library, not an
// app module) rather than through lib/api/vocab.ts, which is browser-bound
// and must not be imported server-side (see lib/mcp/server.ts's header).
//
// Idempotency: a natural-key dedupe on (user_id, term, meaning) within a
// short lookback window, same rationale as create_task's.
import { z } from "zod"
import type { McpServer } from "@modelcontextprotocol/server"
import { romanize } from "es-hangul"
import type { McpContext } from "../context"
import { instrumentedTool } from "./instrument"

const DEDUPE_WINDOW_MS = 10 * 60 * 1000

function autoPronunciation(term: string): string | null {
  if (!/[가-힣]/.test(term)) return null
  try {
    return romanize(term)
  } catch {
    return null
  }
}

export function registerCaptureKoreanPhraseTool(server: McpServer, ctx: McpContext): void {
  server.registerTool(
    "capture_korean_phrase",
    {
      title: "Capture Korean phrase",
      description:
        "Save a Korean word or phrase the user wants to remember, with its meaning, into their vocabulary " +
        "deck for later spaced-repetition review.",
      inputSchema: z.object({
        term: z.string().trim().min(1).max(200),
        meaning: z.string().trim().min(1).max(500),
        example: z.string().trim().max(500).optional(),
        category: z.string().trim().min(1).max(60).optional(),
      }),
      outputSchema: z.object({
        phrase: z.object({
          id: z.string(),
          term: z.string(),
          meaning: z.string(),
          category: z.string(),
          pronunciation: z.string().nullable(),
        }),
        created: z.boolean(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    instrumentedTool(
      ctx,
      "write",
      "capture_korean_phrase",
      async ({ term, meaning, example, category }) => {
        const { data: existing, error: dedupeError } = await ctx.db
          .from("kori_vocab_cards")
          .select("id, term, meaning, category, pronunciation")
          .eq("user_id", ctx.userId)
          .eq("term", term)
          .eq("meaning", meaning)
          .gte("created_at", new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString())
          .maybeSingle()
        if (dedupeError) throw new Error("Could not save the phrase.")
        if (existing) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Already saved "${existing.term as string}" moments ago — no duplicate created.`,
              },
            ],
            structuredContent: {
              phrase: {
                id: existing.id as string,
                term: existing.term as string,
                meaning: existing.meaning as string,
                category: existing.category as string,
                pronunciation: (existing.pronunciation as string | null) ?? null,
              },
              created: false,
            },
          }
        }

        const { data, error } = await ctx.db
          .from("kori_vocab_cards")
          .insert({
            user_id: ctx.userId,
            category: category ?? "General",
            term,
            meaning,
            example: example ?? null,
            pronunciation: autoPronunciation(term),
          })
          .select("id, term, meaning, category, pronunciation")
          .single()
        if (error) throw new Error("Could not save the phrase.")

        return {
          content: [
            {
              type: "text" as const,
              text: `Saved "${data.term as string}" — ${data.meaning as string}.`,
            },
          ],
          structuredContent: {
            phrase: {
              id: data.id as string,
              term: data.term as string,
              meaning: data.meaning as string,
              category: data.category as string,
              pronunciation: (data.pronunciation as string | null) ?? null,
            },
            created: true,
          },
        }
      },
    ),
  )
}
