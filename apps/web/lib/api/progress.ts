import type { Achievement, AchievementSummary, DashboardStats, FeatureActivity, LevelInfo, ProgressPoint } from "@/lib/types"
import type { LearningMetric } from "@/lib/goals"
import { supabase } from "@/lib/supabase"
import { requireUserId } from "@/lib/auth-store"
import { getDailyGoalMinutes } from "@/lib/onboarding-store"
import { longestStreak } from "@/lib/habits"

// Dashboard / streak / achievements, computed client-side from Supabase counts
// (the Spring backend used to compose these responses server-side).

function localDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function todayLocal(): string {
  return localDate(new Date().toISOString())
}

// Distinct local activity dates, newest first (bounded fetch is fine for a
// personal-scale app).
async function getActivityDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from("kori_activity_log")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(2000)
  if (error) throw error
  const dates = new Set<string>()
  for (const row of data ?? []) dates.add(localDate(row.created_at))
  return [...dates].sort().reverse()
}

function computeStreak(dates: string[]): { streakDays: number; activityToday: boolean } {
  const set = new Set(dates)
  const today = new Date()
  const activityToday = set.has(todayLocal())
  let streak = 0
  // A streak survives a missing "today" (you haven't practiced yet).
  const cursor = new Date(today)
  if (!activityToday) cursor.setDate(cursor.getDate() - 1)
  while (set.has(localDate(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return { streakDays: streak, activityToday }
}

// ── Achievements / Gamification ─────────────────────────────────────────────
// Catalog lives here now; unlock rows persist in kori_achievements.

type Counts = {
  wordsSaved: number
  streakDays: number
  conversations: number
  corrections: number
  lessonsCompleted: number
  habitsStarted: number
  bestHabitStreak: number
}

const CATALOG: Array<Achievement & { met: (c: Counts) => boolean }> = [
  { code: "FIRST_WORD", title: "First Word", description: "Save your first vocabulary word", icon: "BookOpen", category: "Vocabulary", xp: 10, unlocked: false, met: (c) => c.wordsSaved >= 1 },
  { code: "WORD_COLLECTOR", title: "Word Collector", description: "Save 50 vocabulary words", icon: "Library", category: "Vocabulary", xp: 50, unlocked: false, met: (c) => c.wordsSaved >= 50 },
  { code: "LEXICON_MASTER", title: "Lexicon Master", description: "Save 200 vocabulary words", icon: "GraduationCap", category: "Vocabulary", xp: 150, unlocked: false, met: (c) => c.wordsSaved >= 200 },
  { code: "FIRST_CHAT", title: "First Conversation", description: "Start a conversation with the AI tutor", icon: "MessagesSquare", category: "Conversation", xp: 10, unlocked: false, met: (c) => c.conversations >= 1 },
  { code: "STREAK_3", title: "Warming Up", description: "Practice 3 days in a row", icon: "Flame", category: "Consistency", xp: 30, unlocked: false, met: (c) => c.streakDays >= 3 },
  { code: "STREAK_7", title: "One Week Strong", description: "Practice 7 days in a row", icon: "Flame", category: "Consistency", xp: 70, unlocked: false, met: (c) => c.streakDays >= 7 },
  { code: "STREAK_30", title: "Habit Formed", description: "Practice 30 days in a row", icon: "Trophy", category: "Consistency", xp: 300, unlocked: false, met: (c) => c.streakDays >= 30 },
  { code: "MISTAKE_LEARNER", title: "Learning from Mistakes", description: "Collect 10 corrections", icon: "CheckCheck", category: "Grammar", xp: 40, unlocked: false, met: (c) => c.corrections >= 10 },
  { code: "FOUNDATION_BUILDER", title: "Foundation Builder", description: "Complete 5 foundation lessons", icon: "Blocks", category: "Foundations", xp: 50, unlocked: false, met: (c) => c.lessonsCompleted >= 5 },
  { code: "HABIT_STARTED", title: "New Beginning", description: "Start your first Growth habit", icon: "Sparkles", category: "Growth", xp: 10, unlocked: false, met: (c) => c.habitsStarted >= 1 },
  { code: "HABIT_MONTH", title: "One Month In", description: "Reach a 30-day streak on any habit", icon: "Flame", category: "Growth", xp: 100, unlocked: false, met: (c) => c.bestHabitStreak >= 30 },
]

const LEVELS = [
  { level: 1, name: "Newcomer", xp: 0 },
  { level: 2, name: "Beginner", xp: 50 },
  { level: 3, name: "Student", xp: 150 },
  { level: 4, name: "Conversationalist", xp: 300 },
  { level: 5, name: "Professional", xp: 500 },
  { level: 6, name: "Fluent Colleague", xp: 800 },
]

function levelFromXp(totalXp: number): LevelInfo {
  let current = LEVELS[0]
  let next: (typeof LEVELS)[number] | null = null
  for (const l of LEVELS) {
    if (totalXp >= l.xp) current = l
    else {
      next = l
      break
    }
  }
  return {
    level: current.level,
    name: current.name,
    totalXp,
    xpIntoLevel: totalXp - current.xp,
    xpForNextLevel: next ? next.xp - current.xp : null,
    nextLevelName: next?.name ?? null,
  }
}

// Habit count + best longest-streak across all of the user's habits — cheap
// at personal scale (one query for habit ids, one for their check-ins,
// grouped in memory).
async function getHabitCounts(): Promise<{ habitsStarted: number; bestHabitStreak: number }> {
  const { data: habits, error: habitsError } = await supabase.from("kori_habits").select("id")
  if (habitsError) throw habitsError
  const habitIds = (habits ?? []).map((h) => h.id as string)
  if (habitIds.length === 0) return { habitsStarted: 0, bestHabitStreak: 0 }

  const { data: checkins, error: checkinsError } = await supabase
    .from("kori_habit_checkins")
    .select("habit_id, date, completed")
    .in("habit_id", habitIds)
  if (checkinsError) throw checkinsError

  const byHabit = new Map<string, { completed: boolean; date: string }[]>()
  for (const row of checkins ?? []) {
    const list = byHabit.get(row.habit_id) ?? []
    list.push({ completed: row.completed, date: row.date })
    byHabit.set(row.habit_id, list)
  }

  let bestHabitStreak = 0
  for (const rows of byHabit.values()) {
    const asCheckins = rows.map((r) => ({ id: r.date, habitId: "", date: r.date, completed: r.completed, createdAt: r.date }))
    bestHabitStreak = Math.max(bestHabitStreak, longestStreak(asCheckins))
  }
  return { habitsStarted: habitIds.length, bestHabitStreak }
}

async function getCounts(): Promise<Counts> {
  const [vocab, conversations, corrections, lessons, dates, habitCounts] = await Promise.all([
    supabase.from("kori_vocab_cards").select("id", { count: "exact", head: true }),
    supabase.from("kori_conversations").select("id", { count: "exact", head: true }),
    supabase.from("kori_corrections").select("id", { count: "exact", head: true }),
    supabase
      .from("kori_foundation_progress")
      .select("lesson_id", { count: "exact", head: true })
      .eq("completed", true),
    getActivityDates(),
    getHabitCounts(),
  ])
  return {
    wordsSaved: vocab.count ?? 0,
    conversations: conversations.count ?? 0,
    corrections: corrections.count ?? 0,
    lessonsCompleted: lessons.count ?? 0,
    streakDays: computeStreak(dates).streakDays,
    ...habitCounts,
  }
}

export const achievementsApi = {
  getSummary: async (): Promise<AchievementSummary> => {
    // Sync unlocked rows with current counts first, so XP/level always
    // reflect real activity instead of whatever was last recorded.
    await achievementsApi.check()
    const { data, error } = await supabase
      .from("kori_achievements")
      .select("code, unlocked_at")
    if (error) throw error
    const unlockedAt = new Map((data ?? []).map((a) => [a.code, a.unlocked_at as string]))
    const achievements: Achievement[] = CATALOG.map(({ met: _met, ...a }) => ({
      ...a,
      unlocked: unlockedAt.has(a.code),
      unlockedAt: unlockedAt.get(a.code) ?? null,
    }))
    const totalXp = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0)
    return {
      level: levelFromXp(totalXp),
      unlockedCount: achievements.filter((a) => a.unlocked).length,
      totalCount: achievements.length,
      achievements,
    }
  },

  // Evaluates conditions and records any newly-met achievements; returns them.
  check: async (): Promise<Achievement[]> => {
    const userId = requireUserId()
    const [counts, { data: existing }] = await Promise.all([
      getCounts(),
      supabase.from("kori_achievements").select("code"),
    ])
    const have = new Set((existing ?? []).map((a) => a.code))
    const newlyMet = CATALOG.filter((a) => !have.has(a.code) && a.met(counts))
    if (newlyMet.length > 0) {
      await supabase
        .from("kori_achievements")
        .upsert(newlyMet.map((a) => ({ user_id: userId, code: a.code })))
    }
    return newlyMet.map(({ met: _met, ...a }) => ({ ...a, unlocked: true }))
  },
}

// ── Dashboard / Progress ────────────────────────────────────────────────────

export const progressApi = {
  // Returns { stats, chartData } — the same envelope the Spring dashboard
  // endpoint composed (useProgress consumes both).
  getDashboard: async (): Promise<{ stats: DashboardStats; chartData: ProgressPoint[] }> => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [activityWeek, vocabCount, correctionsWeek, correctionsToday, dueVocab, dueCorrections, dates] =
      await Promise.all([
        supabase.from("kori_activity_log").select("duration_ms, created_at").gte("created_at", weekAgo),
        supabase.from("kori_vocab_cards").select("id", { count: "exact", head: true }),
        supabase.from("kori_corrections").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("kori_corrections").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
        supabase.from("kori_vocab_cards").select("id", { count: "exact", head: true }).lte("next_review", now.toISOString()),
        supabase.from("kori_corrections").select("id", { count: "exact", head: true }).lte("next_review_date", now.toISOString()),
        getActivityDates(),
      ])

    const weekRows = activityWeek.data ?? []
    const weeklyMinutes = Math.round(weekRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / 60000)
    const todayRows = weekRows.filter((r) => r.created_at >= startOfToday)
    const todayMs = todayRows.reduce((s, r) => s + (r.duration_ms ?? 0), 0)
    const reviewsToday = todayRows.length

    // Minutes per day for the last 7 days (accuracy isn't tracked per-day here).
    const chartData: ProgressPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayKey = localDate(day.toISOString())
      const ms = weekRows
        .filter((r) => localDate(r.created_at) === dayKey)
        .reduce((s, r) => s + (r.duration_ms ?? 0), 0)
      chartData.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: Math.round(ms / 60000),
        accuracy: 0,
      })
    }

    const DAILY_GOAL_MINUTES = getDailyGoalMinutes()
    const stats: DashboardStats = {
      streakDays: computeStreak(dates).streakDays,
      weeklyMinutes,
      wordsSaved: vocabCount.count ?? 0,
      correctionsThisWeek: correctionsWeek.count ?? 0,
      dailyGoalProgress: Math.min(100, Math.round((todayMs / 60000 / DAILY_GOAL_MINUTES) * 100)),
      reviewsToday,
      correctionsToday: correctionsToday.count ?? 0,
      dueReviews: (dueVocab.count ?? 0) + (dueCorrections.count ?? 0),
    }
    return { stats, chartData }
  },

  getStreak: async (): Promise<{ streakDays: number; activityToday: boolean }> => {
    return computeStreak(await getActivityDates())
  },

  // Days (YYYY-MM-DD) with any activity in the given month ("YYYY-MM").
  getActivityDays: async (month: string): Promise<string[]> => {
    const dates = await getActivityDates()
    return dates.filter((d) => d.startsWith(month))
  },

  logDuration: async (feature: string, durationMs: number) => {
    const { error } = await supabase.from("kori_activity_log").insert({
      user_id: requireUserId(),
      feature,
      duration_ms: Math.round(durationMs),
    })
    if (error) throw error
  },

  // Per-feature time/session breakdown for the Progress workspace's
  // Statistics page — same kori_activity_log rows useSessionTimer/
  // useLogActivity already write, just grouped by feature instead of summed.
  getFeatureBreakdown: async (days = 30): Promise<FeatureActivity[]> => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from("kori_activity_log")
      .select("feature, duration_ms")
      .gte("created_at", since)
    if (error) throw error
    const byFeature = new Map<string, { totalMs: number; count: number }>()
    for (const row of data ?? []) {
      const entry = byFeature.get(row.feature) ?? { totalMs: 0, count: 0 }
      entry.totalMs += row.duration_ms ?? 0
      entry.count += 1
      byFeature.set(row.feature, entry)
    }
    return [...byFeature.entries()]
      .map(([feature, { totalMs, count }]) => ({
        feature,
        totalMinutes: Math.round(totalMs / 60000),
        sessionCount: count,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
  },

  // Bounded, dated raw rows for the Timeline aggregator (lib/timeline.ts) —
  // distinct from getFeatureBreakdown (which sums into totals, dropping
  // created_at) and getActivityDates (which drops feature and duration).
  getActivityLog: async (params: { from?: string; to?: string } = {}): Promise<
    { feature: string; durationMs: number; createdAt: string }[]
  > => {
    let query = supabase.from("kori_activity_log").select("feature, duration_ms, created_at")
    if (params.from) query = query.gte("created_at", params.from)
    if (params.to) query = query.lte("created_at", params.to)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      feature: row.feature,
      durationMs: row.duration_ms ?? 0,
      createdAt: row.created_at,
    }))
  },

  // Live count backing a goal's optional `metadata.learning_metric` — lets a
  // goal auto-track real learning activity instead of a manual checklist.
  getMetricCount: async (metric: LearningMetric): Promise<number> => {
    const since =
      metric.window === "weekly"
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : metric.window === "daily"
          ? (() => {
              const n = new Date()
              return new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString()
            })()
          : null

    const table =
      metric.source === "vocab_cards"
        ? "kori_vocab_cards"
        : metric.source === "corrections"
          ? "kori_corrections"
          : metric.source === "foundation_lessons"
            ? "kori_foundation_progress"
            : "kori_activity_log"

    let query = supabase.from(table).select("id", { count: "exact", head: true })
    if (metric.source === "foundation_lessons") query = query.eq("completed", true)
    if (metric.source === "activity_sessions" && metric.feature) query = query.eq("feature", metric.feature)
    if (since) query = query.gte("created_at", since)

    const { count, error } = await query
    if (error) throw error
    return count ?? 0
  },
}
