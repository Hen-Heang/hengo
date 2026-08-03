import type { SupabaseClient } from "@supabase/supabase-js"

// Lightweight "Ask Hengo" context injection: a compact, RLS-scoped summary
// of the learner's due Phrasebook cards, spliced into the chat system prompt
// the same way learnerProfileBlock personalizes it. This is intentionally
// not a retrieval tool with citations — see
// docs/korean-phrasebook-implementation.md §2 for why that's deferred.
// Never throws — a failed lookup here must not break the chat turn.

const MAX_CARDS = 5

interface PhraseQuestionShape {
  korean: string
  english: string
}

export async function buildPhrasebookContextBlock(db: SupabaseClient, userId: string): Promise<string> {
  try {
    const { data: dueRows } = await db
      .from("kori_phrase_progress")
      .select("phrase_id")
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(MAX_CARDS)

    const phraseIds = (dueRows ?? []).map((r) => r.phrase_id as string)
    if (phraseIds.length === 0) return ""

    const { data: cards } = await db.from("kori_phrase_cards").select("question, category, situation").in("id", phraseIds)
    if (!cards || cards.length === 0) return ""

    const lines = cards.map((c) => {
      const question = c.question as PhraseQuestionShape
      return `- "${question.korean}" (${question.english}) — ${c.category}/${c.situation}`
    })

    return (
      "The learner has these Phrasebook Q&A cards due for review right now (from /phrasebook). You may mention " +
      "them naturally if relevant to the conversation (e.g. suggesting they practice one), reference their Korean " +
      "text, and link to /phrasebook — but never claim a phrase is saved in their Phrasebook, or invent new " +
      "Phrasebook entries, unless it's literally listed below:\n" +
      lines.join("\n")
    )
  } catch {
    return ""
  }
}
