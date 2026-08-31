import type { Habit, HabitCategory, HabitCheckIn } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"

// Habits over kori_habits / kori_habit_checkins. All access goes through
// this file — components and hooks never query Supabase directly.

type HabitRow = {
  id: string
  label: string
  category: HabitCategory
  identity_statement: string | null
  active: boolean
  started_at: string
  created_at: string
}

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    label: row.label,
    category: row.category,
    identityStatement: row.identity_statement ?? undefined,
    active: row.active,
    startedAt: row.started_at,
    createdAt: row.created_at,
  }
}

type CheckInRow = {
  id: string
  habit_id: string
  date: string
  completed: boolean
  note: string | null
  created_at: string
}

function toCheckIn(row: CheckInRow): HabitCheckIn {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: row.completed,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

export const habitsApi = {
  getHabits: async (): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from("kori_habits")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data as HabitRow[]).map(toHabit)
  },

  addHabit: async (data: {
    label: string
    category: HabitCategory
    identityStatement?: string
  }): Promise<Habit> => {
    const { data: row, error } = await supabase
      .from("kori_habits")
      .insert({
        user_id: requireUserId(),
        label: data.label,
        category: data.category,
        identity_statement: data.identityStatement ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return toHabit(row as HabitRow)
  },

  updateHabit: async (
    id: string,
    data: {
      label?: string
      category?: HabitCategory
      identityStatement?: string | null
      active?: boolean
    },
  ): Promise<Habit> => {
    const { data: row, error } = await supabase
      .from("kori_habits")
      .update({
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.identityStatement !== undefined
          ? { identity_statement: data.identityStatement }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return toHabit(row as HabitRow)
  },

  removeHabit: async (id: string) => {
    const { error } = await supabase.from("kori_habits").delete().eq("id", id)
    if (error) throw error
    return { deleted: true }
  },

  // Most recent check-ins first, for a single habit — currentStreak,
  // longestStreak, consistencyPercent, and daysActive (lib/habits.ts) all take
  // this as input; the calendar view filters it down to the displayed month.
  getCheckins: async (habitId: string, limit = 400): Promise<HabitCheckIn[]> => {
    const { data, error } = await supabase
      .from("kori_habit_checkins")
      .select("*")
      .eq("habit_id", habitId)
      .order("date", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data as CheckInRow[]).map(toCheckIn)
  },

  // All habits' check-ins in a date range — for the Timeline aggregator
  // (lib/timeline.ts), which needs check-ins across every habit, not one.
  getCheckinsInRange: async (
    params: { from?: string; to?: string } = {},
  ): Promise<HabitCheckIn[]> => {
    let query = supabase.from("kori_habit_checkins").select("*").order("date", { ascending: false })
    if (params.from) query = query.gte("date", params.from)
    if (params.to) query = query.lte("date", params.to)
    const { data, error } = await query
    if (error) throw error
    return (data as CheckInRow[]).map(toCheckIn)
  },

  // Marks a date as completed — upserts on the (habit_id, date) unique
  // constraint so re-checking an already-completed day is idempotent.
  setCheckin: async (habitId: string, date: string, note?: string): Promise<HabitCheckIn> => {
    const { data: row, error } = await supabase
      .from("kori_habit_checkins")
      .upsert(
        { user_id: requireUserId(), habit_id: habitId, date, completed: true, note: note ?? null },
        { onConflict: "habit_id,date" },
      )
      .select()
      .single()
    if (error) throw error
    return toCheckIn(row as CheckInRow)
  },

  // Un-completing a day just removes its row — no row means "not done",
  // same as a day that was never touched.
  removeCheckin: async (habitId: string, date: string) => {
    const { error } = await supabase
      .from("kori_habit_checkins")
      .delete()
      .eq("habit_id", habitId)
      .eq("date", date)
    if (error) throw error
    return { deleted: true }
  },
}
