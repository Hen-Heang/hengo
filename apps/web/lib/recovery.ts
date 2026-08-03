import type {
  DailyCheckIn,
  RecoveryDashboardSummary,
  RecoveryEvent,
  RecoveryHabit,
  RecoveryMomentumFactor,
} from "./types"
import { applyRating, type ReviewRating, type SrsCardState, type SrsResult } from "./srs"

// Pure logic for the Recovery module — no React, no Supabase. Korea has no DST,
// so KST day/hour boundaries are a fixed +9h shift rather than a timezone
// library call; this keeps a slip logged at 00:30 KST filed under the
// correct calendar day.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function kstDayNumber(iso: string): number {
  return Math.floor((new Date(iso).getTime() + KST_OFFSET_MS) / DAY_MS)
}

function kstHour(iso: string): number {
  return new Date(new Date(iso).getTime() + KST_OFFSET_MS).getUTCHours()
}

/** Most recent event's timestamp across any kind. Null if never logged. */
export function lastEventTimestamp(events: RecoveryEvent[]): string | null {
  if (events.length === 0) return null
  return events.reduce((latest, e) => (e.occurredAt > latest ? e.occurredAt : latest), events[0].occurredAt)
}

/** Primary metric: days since the most recent event of any kind, in this habit. Null if never logged. */
export function daysSinceLastEvent(events: RecoveryEvent[], now: Date = new Date()): number | null {
  const last = lastEventTimestamp(events)
  if (last === null) return null
  return kstDayNumber(now.toISOString()) - kstDayNumber(last)
}

export interface ElapsedBreakdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Continuous elapsed time since `sinceIso`, broken into whole units — for a
 * live-ticking clock display. Unlike daysSinceLastEvent (calendar-day
 * boundaries, for the headline threshold logic), this is raw wall-clock
 * duration, clamped to zero if `now` is somehow before `sinceIso`.
 */
export function elapsedBreakdown(sinceIso: string, now: Date = new Date()): ElapsedBreakdown {
  const totalSeconds = Math.max(0, Math.floor((now.getTime() - new Date(sinceIso).getTime()) / 1000))
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

/** Secondary metric: urges logged and survived. Grows even on a day with a slip. */
export function rodeOutCount(events: RecoveryEvent[], since?: Date): number {
  return events.filter((e) => e.rodeOut === true && (!since || new Date(e.occurredAt) >= since)).length
}

/** Tertiary metric: the streak chip. Counts from the last slip, or from start if there hasn't been one. */
export function daysSince(startedAt: string, lastSlipAt: string | null, now: Date = new Date()): number {
  const anchor = lastSlipAt ?? startedAt
  return kstDayNumber(now.toISOString()) - kstDayNumber(anchor)
}

/**
 * 0..1 breathing-ring value for the pause timer: t^2 * (1-t)^3 peaks at
 * t=0.4 (a/(a+b) for exponents a=2, b=3), normalized to that peak.
 */
export function pauseCurve(elapsedSeconds: number, totalSeconds: number): number {
  const t = Math.min(1, Math.max(0, elapsedSeconds / totalSeconds))
  const raw = t ** 2 * (1 - t) ** 3
  const peak = 0.4 ** 2 * 0.6 ** 3
  return raw / peak
}

export interface RecoveryPatterns {
  topHour: number | null
  topTriggerId: string | null
  topEmotion: string | null
}

function mostCommon<T>(items: T[]): T | null {
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  let best: T | null = null
  let bestCount = 0
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item
      bestCount = count
    }
  }
  return best
}

/** Most common hour bucket (KST), trigger, and emotion across a habit's events. */
export function topPatterns(events: RecoveryEvent[]): RecoveryPatterns {
  const triggerIds = events.map((e) => e.triggerId).filter((t): t is string => Boolean(t))
  const emotions = events.map((e) => e.emotion).filter((e): e is string => Boolean(e))
  return {
    topHour: mostCommon(events.map((e) => kstHour(e.occurredAt))),
    topTriggerId: mostCommon(triggerIds),
    topEmotion: mostCommon(emotions),
  }
}

// Rating adapter (Step 1, option 2): plans are rehearsed if-then statements,
// not vocab cards, so "was this EASY?" doesn't read right. This is the only
// place PlanOutcome <-> ReviewRating translation happens; lib/srs.ts stays
// generic and vocab-shaped.
export type PlanOutcome = "skipped" | "struggled" | "followed" | "followed_easily"

const OUTCOME_TO_RATING: Record<PlanOutcome, ReviewRating> = {
  skipped: "AGAIN",
  struggled: "HARD",
  followed: "GOOD",
  followed_easily: "EASY",
}

export function ratePlan(plan: SrsCardState, outcome: PlanOutcome): SrsResult {
  return applyRating(plan, OUTCOME_TO_RATING[outcome])
}

// ── Recovery analytics ──────────────────────────────────────────────────────

const DEFAULT_TIME_ZONE = "Asia/Seoul"

function zonedParts(iso: string, timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(new Date(iso))
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    weekday: value("weekday"),
  }
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

function dayDifference(fromIso: string, toIso: string, timeZone = DEFAULT_TIME_ZONE): number {
  return Math.max(0, dayNumber(zonedParts(toIso, timeZone).date) - dayNumber(zonedParts(fromIso, timeZone).date))
}

function targetEvents(events: RecoveryEvent[], habitId?: string): RecoveryEvent[] {
  return habitId ? events.filter((event) => event.habitId === habitId) : events
}

/** Current uninterrupted calendar-day streak. Historical records are never mutated. */
export function currentRecoveryStreak(
  events: RecoveryEvent[],
  startedAt: string,
  now: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  habitId?: string,
): number {
  const latestSlip = targetEvents(events, habitId)
    .filter((event) => event.kind === "slip")
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]
  return dayDifference(latestSlip?.occurredAt ?? startedAt, now.toISOString(), timeZone)
}

/** Longest uninterrupted streak, including the current in-progress segment. */
export function bestRecoveryStreak(
  events: RecoveryEvent[],
  startedAt: string,
  now: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  habitId?: string,
): number {
  const slips = targetEvents(events, habitId)
    .filter((event) => event.kind === "slip" && event.occurredAt >= startedAt && event.occurredAt <= now.toISOString())
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  let anchor = startedAt
  let best = 0
  for (const slip of slips) {
    best = Math.max(best, dayDifference(anchor, slip.occurredAt, timeZone))
    anchor = slip.occurredAt
  }
  return Math.max(best, dayDifference(anchor, now.toISOString(), timeZone))
}

/** Days with an honest record and no slip, rather than treating missing days as success. */
export function recoveryDaysThisMonth(
  events: RecoveryEvent[],
  now: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  habitId?: string,
): number {
  const month = zonedParts(now.toISOString(), timeZone).date.slice(0, 7)
  const byDay = new Map<string, RecoveryEvent[]>()
  for (const event of targetEvents(events, habitId)) {
    const date = zonedParts(event.occurredAt, timeZone).date
    if (!date.startsWith(month)) continue
    byDay.set(date, [...(byDay.get(date) ?? []), event])
  }
  return [...byDay.values()].filter((dayEvents) => !dayEvents.some((event) => event.kind === "slip")).length
}

export function averageUrgeIntensity(events: RecoveryEvent[], habitId?: string): number | null {
  const values = targetEvents(events, habitId)
    .map((event) => event.intensity)
    .filter((value): value is number => typeof value === "number")
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export interface RiskWindow {
  startHour: number
  endHour: number
  count: number
}

/** Most frequent two-hour event bucket. A pattern, not a causal conclusion. */
export function highestRiskTimeRange(
  events: RecoveryEvent[],
  timeZone = DEFAULT_TIME_ZONE,
  habitId?: string,
): RiskWindow | null {
  const counts = new Map<number, number>()
  for (const event of targetEvents(events, habitId)) {
    const startHour = Math.floor(zonedParts(event.occurredAt, timeZone).hour / 2) * 2
    counts.set(startHour, (counts.get(startHour) ?? 0) + 1)
  }
  let result: RiskWindow | null = null
  for (const [startHour, count] of counts) {
    if (!result || count > result.count || (count === result.count && startHour < result.startHour)) {
      result = { startHour, endHour: (startHour + 2) % 24, count }
    }
  }
  return result
}

export interface CopingEffectiveness {
  action: string
  attempts: number
  successful: number
  successRate: number
}

export function copingEffectiveness(events: RecoveryEvent[], habitId?: string): CopingEffectiveness[] {
  const actions = new Map<string, { attempts: number; successful: number }>()
  for (const event of targetEvents(events, habitId)) {
    const action = event.actionTaken?.trim()
    if (!action) continue
    const current = actions.get(action) ?? { attempts: 0, successful: 0 }
    current.attempts += 1
    if (event.rodeOut === true || event.kind === "win" || event.healthyActionCompleted === true) current.successful += 1
    actions.set(action, current)
  }
  return [...actions.entries()]
    .map(([action, value]) => ({
      action,
      ...value,
      successRate: Math.round((value.successful / value.attempts) * 100),
    }))
    .sort((a, b) => b.successRate - a.successRate || b.attempts - a.attempts || a.action.localeCompare(b.action))
}

export function returnTimesAfterLapses(events: RecoveryEvent[], habitId?: string): number[] {
  const ordered = targetEvents(events, habitId).slice().sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  const returns: number[] = []
  ordered.forEach((event, index) => {
    if (event.kind !== "slip") return
    const next = ordered.slice(index + 1).find((candidate) => candidate.kind !== "slip")
    if (!next) return
    returns.push(Math.max(0, (new Date(next.occurredAt).getTime() - new Date(event.occurredAt).getTime()) / 3_600_000))
  })
  return returns
}

export function averageTimeToReturnHours(events: RecoveryEvent[], habitId?: string): number | null {
  const values = returnTimesAfterLapses(events, habitId)
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function recentDateThreshold(now: Date, days: number, timeZone: string): number {
  return dayNumber(zonedParts(now.toISOString(), timeZone).date) - (days - 1)
}

export function checkInCompletionPercent(
  checkIns: DailyCheckIn[],
  days = 7,
  now: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  habitId?: string,
): number {
  const threshold = recentDateThreshold(now, days, timeZone)
  const completedDays = new Set(
    checkIns
      .filter((checkIn) => (!habitId || checkIn.habitId === habitId) && dayNumber(checkIn.date) >= threshold)
      .map((checkIn) => checkIn.date),
  )
  return Math.min(100, Math.round((completedDays.size / days) * 100))
}

/** Positive means fewer slips than baseline; negative means frequency increased. */
export function frequencyReductionPercent(
  baselinePerWeek: number,
  events: RecoveryEvent[],
  windowDays = 28,
  now: Date = new Date(),
  habitId?: string,
): number | null {
  if (baselinePerWeek <= 0 || windowDays <= 0) return null
  const since = now.getTime() - windowDays * DAY_MS
  const slips = targetEvents(events, habitId).filter(
    (event) => event.kind === "slip" && new Date(event.occurredAt).getTime() >= since,
  ).length
  const currentPerWeek = slips * (7 / windowDays)
  return Math.round(((baselinePerWeek - currentPerWeek) / baselinePerWeek) * 100)
}

export type WeeklyTrendDirection = "improving" | "steady" | "higher"

export function weeklyUrgeTrend(
  events: RecoveryEvent[],
  now: Date = new Date(),
  habitId?: string,
): WeeklyTrendDirection {
  const end = now.getTime()
  const midpoint = end - 7 * DAY_MS
  const start = end - 14 * DAY_MS
  const averages = (from: number, to: number) => {
    const values = targetEvents(events, habitId)
      .filter((event) => {
        const time = new Date(event.occurredAt).getTime()
        return time >= from && time < to && typeof event.intensity === "number"
      })
      .map((event) => event.intensity as number)
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  }
  const previous = averages(start, midpoint)
  const current = averages(midpoint, end + 1)
  if (previous == null || current == null || Math.abs(current - previous) < 0.5) return "steady"
  return current < previous ? "improving" : "higher"
}

export function recoveryMomentum(
  events: RecoveryEvent[],
  checkIns: DailyCheckIn[],
  now: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  habitId?: string,
): { score: number; factors: RecoveryMomentumFactor[] } {
  const threshold = recentDateThreshold(now, 7, timeZone)
  const recentEvents = targetEvents(events, habitId).filter(
    (event) => dayNumber(zonedParts(event.occurredAt, timeZone).date) >= threshold,
  )
  const checkInPoints = Math.round((checkInCompletionPercent(checkIns, 7, now, timeZone, habitId) / 100) * 25)
  const managedPoints = Math.min(25, recentEvents.filter((event) => event.rodeOut === true || event.kind === "win").length * 5)
  const actionPoints = Math.min(20, recentEvents.filter((event) => event.healthyActionCompleted === true).length * 4)
  const reflectionPoints = Math.min(15, recentEvents.filter((event) => event.kind === "slip" && Boolean(event.note?.trim())).length * 5)
  const fastReturnPoints = Math.min(15, returnTimesAfterLapses(recentEvents, habitId).filter((hours) => hours <= 24).length * 5)
  const factors: RecoveryMomentumFactor[] = [
    { key: "check_ins", label: "Check-ins", points: checkInPoints, maximum: 25, explanation: "Up to 25 points for showing up across the last seven days." },
    { key: "managed_urges", label: "Managed moments", points: managedPoints, maximum: 25, explanation: "5 points for each moment managed, up to 25." },
    { key: "healthy_actions", label: "Healthy actions", points: actionPoints, maximum: 20, explanation: "4 points for each completed replacement action, up to 20." },
    { key: "honest_reflections", label: "Honest reflections", points: reflectionPoints, maximum: 15, explanation: "Honest reflection only adds points; reporting a slip never removes them." },
    { key: "fast_returns", label: "Fast returns", points: fastReturnPoints, maximum: 15, explanation: "5 points for returning to the plan within 24 hours, up to 15." },
  ]
  return { score: factors.reduce((sum, factor) => sum + factor.points, 0), factors }
}

export function buildRecoveryDashboardSummary(
  target: RecoveryHabit,
  events: RecoveryEvent[],
  checkIns: DailyCheckIn[],
  now: Date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
): RecoveryDashboardSummary {
  const scoped = targetEvents(events, target.id)
  const scopedCheckIns = checkIns.filter((checkIn) => checkIn.habitId === target.id)
  const momentum = recoveryMomentum(scoped, scopedCheckIns, now, timeZone, target.id)
  return {
    currentStreak: currentRecoveryStreak(scoped, target.startedAt, now, timeZone, target.id),
    bestStreak: bestRecoveryStreak(scoped, target.startedAt, now, timeZone, target.id),
    recoveryDaysThisMonth: recoveryDaysThisMonth(scoped, now, timeZone, target.id),
    urgesManaged: scoped.filter((event) => event.rodeOut === true || event.kind === "win").length,
    healthyActionsCompleted: scoped.filter((event) => event.healthyActionCompleted === true).length,
    checkInConsistency: checkInCompletionPercent(scopedCheckIns, 7, now, timeZone, target.id),
    momentum: momentum.score,
    momentumFactors: momentum.factors,
    averageUrgeIntensity: averageUrgeIntensity(scoped, target.id),
    highestRiskWindow: highestRiskTimeRange(scoped, timeZone, target.id),
    averageReturnHours: averageTimeToReturnHours(scoped, target.id),
  }
}
