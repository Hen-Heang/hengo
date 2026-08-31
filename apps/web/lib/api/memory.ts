import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import {
  memoryCandidateFromRow,
  type MemoryCandidate,
  type MemoryCandidateInput,
  type MemoryCandidateRow,
  type MemoryStatus,
} from "@/lib/memory"
import { aiPost } from "./ai-client"

// Memory-candidate approval system over kori_memory_candidates. Mirrors the
// notesApi/inboxApi shape: plain async functions, row<->camelCase mapping in
// lib/memory.ts (shared with the Ask Hengo route), requireUserId() on writes.
const toMemoryCandidate = memoryCandidateFromRow

export interface AskHengoSource {
  type: string
  id: string | null
  title: string
  href: string | null
}

export interface AskHengoAnswer {
  answer: string
  groundedness: "grounded" | "partial" | "insufficient"
  sources: AskHengoSource[]
  proposedMemories: MemoryCandidate[]
}

export const memoryApi = {
  /** Sends a question to /api/ai/memory/ask. The route retrieves the user's
   * own RLS-scoped data, answers with citations, and persists any new memory
   * candidates it noticed (always as status "proposed" — never trusted
   * automatically); those come back already inserted, ready to review. */
  ask: async (question: string): Promise<AskHengoAnswer> =>
    aiPost<AskHengoAnswer>("/memory/ask", { question }),

  listCandidates: async (status?: MemoryStatus | "all"): Promise<MemoryCandidate[]> => {
    let query = supabase
      .from("kori_memory_candidates")
      .select("*")
      .order("created_at", { ascending: false })
    if (status && status !== "all") query = query.eq("status", status)
    const { data, error } = await query
    if (error) throw error
    return (data as MemoryCandidateRow[]).map(toMemoryCandidate)
  },

  /** User-authored memory, added directly rather than proposed by the AI —
   * defaults to "approved" since the user typed it themselves. */
  create: async (
    input: Pick<MemoryCandidateInput, "fact" | "category">,
  ): Promise<MemoryCandidate> => {
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("kori_memory_candidates")
      .insert({
        user_id: userId,
        fact: input.fact.trim(),
        category: input.category || "fact",
        source_type: "manual",
        source_id: null,
        confidence: 1,
        status: "approved",
      })
      .select("*")
      .single()
    if (error) throw error
    return toMemoryCandidate(data as MemoryCandidateRow)
  },

  approve: async (id: string, editedFact?: string): Promise<MemoryCandidate> => {
    const patch: Record<string, unknown> = {
      status: "approved",
      updated_at: new Date().toISOString(),
    }
    if (editedFact !== undefined) patch.fact = editedFact.trim()
    const { data, error } = await supabase
      .from("kori_memory_candidates")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return toMemoryCandidate(data as MemoryCandidateRow)
  },

  update: async (id: string, fact: string): Promise<MemoryCandidate> => {
    const { data, error } = await supabase
      .from("kori_memory_candidates")
      .update({ fact: fact.trim(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return toMemoryCandidate(data as MemoryCandidateRow)
  },

  reject: async (id: string): Promise<MemoryCandidate> => {
    const { data, error } = await supabase
      .from("kori_memory_candidates")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return toMemoryCandidate(data as MemoryCandidateRow)
  },

  archive: async (id: string): Promise<MemoryCandidate> => {
    const { data, error } = await supabase
      .from("kori_memory_candidates")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return toMemoryCandidate(data as MemoryCandidateRow)
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("kori_memory_candidates").delete().eq("id", id)
    if (error) throw error
  },
}
