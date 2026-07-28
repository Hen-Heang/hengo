import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import type { JournalEntry, JournalEntryInput } from "@/lib/journal"

// Journal over kori_journal_entries. Mirrors the notesApi/inboxApi shape:
// plain async functions, row<->camelCase mapping here, requireUserId() on writes.

type JournalEntryRow = {
  id: string
  occurred_at: string
  title: string | null
  content: string
  mood: number | null
  energy: number | null
  achievement: string | null
  blocker: string | null
  lesson: string | null
  gratitude: string | null
  tags: string[]
  goal_id: string | null
  habit_id: string | null
  created_at: string
  updated_at: string
}

const SELECT_COLUMNS =
  "id, occurred_at, title, content, mood, energy, achievement, blocker, lesson, gratitude, tags, goal_id, habit_id, created_at, updated_at"

function toJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    title: row.title,
    content: row.content,
    mood: row.mood,
    energy: row.energy,
    achievement: row.achievement,
    blocker: row.blocker,
    lesson: row.lesson,
    gratitude: row.gratitude,
    tags: row.tags ?? [],
    goalId: row.goal_id,
    habitId: row.habit_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface JournalRangeParams {
  from?: string
  to?: string
  limit?: number
}

export const journalApi = {
  list: async (params: JournalRangeParams = {}): Promise<JournalEntry[]> => {
    let query = supabase
      .from("kori_journal_entries")
      .select(SELECT_COLUMNS)
      .order("occurred_at", { ascending: false })
      .limit(params.limit ?? 500)
    if (params.from) query = query.gte("occurred_at", params.from)
    if (params.to) query = query.lte("occurred_at", params.to)
    const { data, error } = await query
    if (error) throw error
    return (data as unknown as JournalEntryRow[]).map(toJournalEntry)
  },

  get: async (id: string): Promise<JournalEntry> => {
    const { data, error } = await supabase
      .from("kori_journal_entries")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .single()
    if (error) throw error
    return toJournalEntry(data as unknown as JournalEntryRow)
  },

  create: async (input: JournalEntryInput): Promise<JournalEntry> => {
    const { data, error } = await supabase
      .from("kori_journal_entries")
      .insert({
        user_id: requireUserId(),
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        title: input.title?.trim() || null,
        content: input.content?.trim() ?? "",
        mood: input.mood ?? null,
        energy: input.energy ?? null,
        achievement: input.achievement?.trim() || null,
        blocker: input.blocker?.trim() || null,
        lesson: input.lesson?.trim() || null,
        gratitude: input.gratitude?.trim() || null,
        tags: input.tags ?? [],
        goal_id: input.goalId ?? null,
        habit_id: input.habitId ?? null,
      })
      .select(SELECT_COLUMNS)
      .single()
    if (error) throw error
    return toJournalEntry(data as unknown as JournalEntryRow)
  },

  update: async (id: string, input: Partial<JournalEntryInput>): Promise<JournalEntry> => {
    const { data, error } = await supabase
      .from("kori_journal_entries")
      .update({
        ...(input.occurredAt !== undefined ? { occurred_at: input.occurredAt } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.mood !== undefined ? { mood: input.mood } : {}),
        ...(input.energy !== undefined ? { energy: input.energy } : {}),
        ...(input.achievement !== undefined ? { achievement: input.achievement } : {}),
        ...(input.blocker !== undefined ? { blocker: input.blocker } : {}),
        ...(input.lesson !== undefined ? { lesson: input.lesson } : {}),
        ...(input.gratitude !== undefined ? { gratitude: input.gratitude } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.goalId !== undefined ? { goal_id: input.goalId } : {}),
        ...(input.habitId !== undefined ? { habit_id: input.habitId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT_COLUMNS)
      .single()
    if (error) throw error
    return toJournalEntry(data as unknown as JournalEntryRow)
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("kori_journal_entries").delete().eq("id", id)
    if (error) throw error
  },
}
