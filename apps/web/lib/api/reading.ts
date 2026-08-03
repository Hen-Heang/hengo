import type { ReadingUnit, ReadingProgressEntry } from "@/lib/reading"
import { createReadingUnitId } from "@/lib/reading"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Reading units + per-unit progress over Supabase. User-created units are
// stored whole as jsonb (kori_reading_units.payload); progress is a small
// jsonb entry per (user, unit) in kori_reading_progress.

export type ReadingUnitPayload = Omit<ReadingUnit, "id">

export interface ReadingProgressRecord extends ReadingProgressEntry {
  unitId: string
}

async function saveProgress(
  unitId: string,
  patch: Partial<ReadingProgressEntry>,
): Promise<ReadingProgressRecord> {
  const userId = requireUserId()
  const { data: existing, error } = await supabase
    .from("kori_reading_progress")
    .select("entry")
    .eq("unit_id", unitId)
    .maybeSingle()
  if (error) throw error
  const prevEntry = (existing?.entry ?? null) as ReadingProgressEntry | null
  const entry: ReadingProgressEntry = {
    ...prevEntry,
    ...patch,
    status: patch.status ?? prevEntry?.status ?? "not_started",
  }
  const { error: upsertError } = await supabase
    .from("kori_reading_progress")
    .upsert({ user_id: userId, unit_id: unitId, entry })
  if (upsertError) throw upsertError
  return { unitId, ...entry }
}

export const readingApi = {
  getUnits: async (): Promise<ReadingUnit[]> => {
    const { data, error } = await supabase
      .from("kori_reading_units")
      .select("id, payload")
      .order("created_at", { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => ({ ...(r.payload as ReadingUnitPayload), id: r.id }))
  },

  getUnit: async (id: string): Promise<ReadingUnit> => {
    const { data, error } = await supabase
      .from("kori_reading_units")
      .select("id, payload")
      .eq("id", id)
      .single()
    if (error) throw error
    return { ...(data.payload as ReadingUnitPayload), id: data.id }
  },

  createUnit: async (data: ReadingUnitPayload): Promise<ReadingUnit> => {
    const userId = requireUserId()
    const { data: existingIds, error: idsError } = await supabase
      .from("kori_reading_units")
      .select("id")
    if (idsError) throw idsError
    const id = createReadingUnitId(data.title, new Set((existingIds ?? []).map((u) => u.id)))
    const { error } = await supabase
      .from("kori_reading_units")
      .insert({ id, user_id: userId, payload: data })
    if (error) throw error
    return { ...data, id }
  },

  updateUnit: async (id: string, data: ReadingUnitPayload): Promise<ReadingUnit> => {
    const { error } = await supabase
      .from("kori_reading_units")
      .update({ payload: data })
      .eq("id", id)
    if (error) throw error
    return { ...data, id }
  },

  deleteUnit: async (id: string): Promise<{ deleted: boolean }> => {
    const { error } = await supabase.from("kori_reading_units").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // Per-unit progress (read/quiz state), server-backed so it syncs across devices.
  getProgress: async (): Promise<ReadingProgressRecord[]> => {
    const { data, error } = await supabase
      .from("kori_reading_progress")
      .select("unit_id, entry")
    if (error) throw error
    return (data ?? []).map((r) => {
      const entry = r.entry as ReadingProgressEntry
      return { unitId: r.unit_id, ...entry, status: entry?.status ?? "not_started" }
    })
  },

  startUnit: (unitId: string) => saveProgress(unitId, { status: "in_progress" }),

  completeUnit: (unitId: string) =>
    saveProgress(unitId, { status: "completed", completedAt: new Date().toISOString() }),

  submitQuizResult: (unitId: string, score: number, total: number) =>
    saveProgress(unitId, { quizScore: score, quizTotal: total }),

  setUnitPinned: (unitId: string, pinned: boolean) => saveProgress(unitId, { pinned }),
}
