// Goal task analytics — pure client-side computation ported from Orbit/goalmap's
// smartAnalyticsService. The original's one AI/edge-function call (getAIInsights)
// is dropped; everything here is deterministic stats over the task list.

import type { Task } from "@/lib/tasks"

export interface SmartInsight {
  type: "productivity" | "trend" | "recommendation" | "prediction" | "warning"
  title: string
  description: string
  priority: "high" | "medium" | "low"
}

export interface SmartAnalyticsData {
  insights: SmartInsight[]
  productivityScore: number
  velocityTrend: "increasing" | "stable" | "decreasing"
  estimatedCompletionDate: Date | null
}

const DAY = 1000 * 60 * 60 * 24

/** YYYY-MM-DD in local time (not UTC). */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** When a completed task was finished (updated_at preferred); null if incomplete/invalid. */
function getCompletedAt(task: Task): Date | null {
  if (!task.completed) return null
  const raw = task.updated_at || task.created_at
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function calculateRecentActivity(tasks: Task[]): number {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recent = tasks.filter((t) => {
    const d = getCompletedAt(t)
    return d !== null && d >= sevenDaysAgo
  }).length
  if (tasks.length === 0) return 0
  return Math.min(100, (recent / Math.max(1, tasks.length * 0.3)) * 100)
}

function calculateConsistency(tasks: Task[]): number {
  const completed = tasks.filter((t) => t.completed)
  if (completed.length < 3) return 50
  const dates = completed
    .map((t) => getCompletedAt(t)?.getTime())
    .filter((v): v is number => v !== undefined)
    .sort((a, b) => a - b)
  const intervals: number[] = []
  for (let i = 1; i < dates.length; i++) intervals.push(dates[i] - dates[i - 1])
  if (intervals.length === 0) return 50
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / intervals.length
  return Math.min(100, Math.max(0, 100 - variance / (DAY * 7)))
}

function analyzeVelocityTrend(tasks: Task[]): "increasing" | "stable" | "decreasing" {
  const completed = tasks.filter((t) => t.completed)
  if (completed.length < 4) return "stable"
  const now = Date.now()
  const twoWeeksAgo = new Date(now - 14 * DAY)
  const oneWeekAgo = new Date(now - 7 * DAY)
  const recentWeek = completed.filter((t) => {
    const d = getCompletedAt(t)
    return d !== null && d >= oneWeekAgo
  }).length
  const previousWeek = completed.filter((t) => {
    const d = getCompletedAt(t)
    return d !== null && d >= twoWeeksAgo && d < oneWeekAgo
  }).length
  if (recentWeek > previousWeek * 1.2) return "increasing"
  if (recentWeek < previousWeek * 0.8) return "decreasing"
  return "stable"
}

function estimateCompletion(tasks: Task[], pending: number, targetDate?: string | null): Date | null {
  if (pending === 0) return new Date()
  const completed = tasks.filter((t) => t.completed)
  if (completed.length < 2) return targetDate ? new Date(targetDate) : null
  const times = completed
    .map((t) => getCompletedAt(t)?.getTime())
    .filter((v): v is number => v !== undefined)
    .sort((a, b) => a - b)
  const span = times[times.length - 1] - times[0]
  const perDay = completed.length / (span / DAY)
  if (!isFinite(perDay) || perDay === 0) return null
  const est = new Date()
  est.setDate(est.getDate() + Math.ceil(pending / perDay))
  return est
}

function calculateInactiveDays(tasks: Task[]): number {
  const completed = tasks.filter((t) => t.completed)
  if (completed.length === 0) {
    if (tasks.length > 0 && tasks[0].created_at) {
      const oldest = tasks.reduce((o, t) =>
        new Date(t.created_at || 0) < new Date(o.created_at || 0) ? t : o
      )
      return Math.floor((Date.now() - new Date(oldest.created_at || 0).getTime()) / DAY)
    }
    return 0
  }
  const last = completed.reduce((latest, t) => {
    const d = getCompletedAt(t)
    return d && d.getTime() > latest ? d.getTime() : latest
  }, 0)
  return Math.floor((Date.now() - last) / DAY)
}

/** Core analysis: productivity score, velocity trend, estimated completion, insights. */
export function computeAnalytics(tasks: Task[], targetDate?: string | null): SmartAnalyticsData {
  const insights: SmartInsight[] = []
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length
  const pending = total - completed

  if (total === 0) {
    return {
      insights: [
        {
          type: "recommendation",
          title: "Get started",
          description: "Add tasks to begin tracking your progress.",
          priority: "high",
        },
      ],
      productivityScore: 0,
      velocityTrend: "stable",
      estimatedCompletionDate: null,
    }
  }

  const completionRate = (completed / total) * 100
  const productivityScore = Math.round(
    (completionRate + calculateRecentActivity(tasks) + calculateConsistency(tasks)) / 3
  )
  const velocityTrend = analyzeVelocityTrend(tasks)
  const estimatedCompletionDate = estimateCompletion(tasks, pending, targetDate)

  if (completionRate < 30 && total > 5) {
    insights.push({
      type: "warning",
      title: "Low completion rate",
      description: `Only ${Math.round(completionRate)}% of tasks completed. Try breaking large tasks into smaller pieces.`,
      priority: "high",
    })
  }
  if (velocityTrend === "decreasing") {
    insights.push({
      type: "trend",
      title: "Decreasing velocity",
      description: "Your completion rate is slowing down. Review your workload and priorities.",
      priority: "medium",
    })
  } else if (velocityTrend === "increasing") {
    insights.push({
      type: "trend",
      title: "Momentum building",
      description: "Your completion rate is accelerating. Keep it up!",
      priority: "low",
    })
  }
  if (targetDate && estimatedCompletionDate) {
    const daysRemaining = Math.ceil((new Date(targetDate).getTime() - Date.now()) / DAY)
    const daysToEstimate = Math.ceil((estimatedCompletionDate.getTime() - Date.now()) / DAY)
    if (daysToEstimate > daysRemaining && daysRemaining > 0) {
      insights.push({
        type: "warning",
        title: "Behind schedule",
        description: `At the current pace you'll finish in ~${daysToEstimate} days, but only ${daysRemaining} remain. Increase your daily completions.`,
        priority: "high",
      })
    } else if (daysRemaining > 0 && daysRemaining < 7) {
      insights.push({
        type: "prediction",
        title: "Deadline approaching",
        description: `Only ${daysRemaining} days left — focus on high-priority tasks.`,
        priority: "high",
      })
    }
  }
  const inactiveDays = calculateInactiveDays(tasks)
  if (inactiveDays > 3) {
    insights.push({
      type: "productivity",
      title: "Inactive period",
      description: `No completed tasks for ${inactiveDays} days. Resume work to keep momentum.`,
      priority: "medium",
    })
  }
  if (productivityScore >= 80) {
    insights.push({
      type: "productivity",
      title: "High productivity",
      description: `Excellent — your productivity score is ${productivityScore}/100. You're on track.`,
      priority: "low",
    })
  } else if (productivityScore < 50) {
    insights.push({
      type: "recommendation",
      title: "Productivity boost needed",
      description: `Your productivity score is ${productivityScore}/100. Try time-blocking or Pomodoro to improve focus.`,
      priority: "medium",
    })
  }

  return { insights, productivityScore, velocityTrend, estimatedCompletionDate }
}

/** Daily completed-task counts for the last 30 days. */
export function calculateDailyTrend(tasks: Task[]): Array<{ date: string; completed: number; total: number }> {
  const days = 30
  const out: Array<{ date: string; completed: number; total: number }> = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = toLocalDateStr(date)
    const total = tasks.filter((t) => {
      const td = t.start_date
        ? toLocalDateStr(new Date(t.start_date))
        : t.created_at
          ? toLocalDateStr(new Date(t.created_at))
          : null
      return td === key
    }).length
    const completed = tasks.filter((t) => {
      const d = getCompletedAt(t)
      return d !== null && toLocalDateStr(d) === key
    }).length
    out.push({ date: key, completed, total })
  }
  return out
}

/** Tasks completed per week (last 8 weeks, week starting Monday). */
export function calculateVelocityData(tasks: Task[]): Array<{ week: string; velocity: number }> {
  const completed = tasks.filter((t) => t.completed)
  if (completed.length === 0) return []
  const weeks = new Map<string, number>()
  completed.forEach((t) => {
    const date = getCompletedAt(t)
    if (!date) return
    const dow = date.getDay()
    const start = new Date(date)
    start.setDate(date.getDate() - dow + (dow === 0 ? -6 : 1))
    const key = toLocalDateStr(start)
    weeks.set(key, (weeks.get(key) || 0) + 1)
  })
  return Array.from(weeks.entries())
    .map(([week, velocity]) => ({ week, velocity }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)
}

export interface ProductivityBreakdown {
  completionRate: number
  recentActivity: number
  consistency: number
  overall: number
}

export function getProductivityBreakdown(tasks: Task[]): ProductivityBreakdown {
  if (tasks.length === 0) return { completionRate: 0, recentActivity: 0, consistency: 0, overall: 0 }
  const completed = tasks.filter((t) => t.completed).length
  const completionRate = Math.round((completed / tasks.length) * 100)
  const recentActivity = Math.round(calculateRecentActivity(tasks))
  const consistency = Math.round(calculateConsistency(tasks))
  return {
    completionRate,
    recentActivity,
    consistency,
    overall: Math.round((completionRate + recentActivity + consistency) / 3),
  }
}

/** Current + longest streak of consecutive days with completions. */
export function calculateStreak(tasks: Task[]): { current: number; longest: number } {
  const completed = tasks.filter((t) => t.completed)
  if (completed.length === 0) return { current: 0, longest: 0 }
  const dates = new Set(
    completed
      .map((t) => {
        const d = getCompletedAt(t)
        return d ? toLocalDateStr(d) : undefined
      })
      .filter((d): d is string => d !== undefined)
  )
  const sorted = Array.from(dates).sort()
  const today = toLocalDateStr(new Date())
  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const yestStr = toLocalDateStr(yest)

  let current = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = toLocalDateStr(d)
    if (dates.has(key)) current++
    else {
      if (i === 0 && !dates.has(today) && dates.has(yestStr)) continue
      break
    }
  }
  let longest = sorted.length ? 1 : 0
  let temp = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.floor((new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / DAY)
    if (diff === 1) {
      temp++
      longest = Math.max(longest, temp)
    } else temp = 1
  }
  return { current, longest: Math.max(longest, current) }
}
