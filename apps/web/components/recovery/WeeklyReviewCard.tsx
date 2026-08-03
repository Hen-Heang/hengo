"use client"

import { useState } from "react"
import { Check, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { averageTimeToReturnHours, averageUrgeIntensity, copingEffectiveness, highestRiskTimeRange, weeklyUrgeTrend } from "@/lib/recovery"
import type { DailyCheckIn, RecoveryEvent, RecoveryTrigger, WeeklyReview } from "@/lib/types"

function weekStart(): string {
  const date = new Date()
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
}
function hourLabel(hour: number): string { return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(new Date(2026, 0, 1, hour)) }
function includesAny(value: string, words: string[]) { const normalized = value.toLowerCase(); return words.some((word) => normalized.includes(word)) }

export function WeeklyReviewCard({ events, checkIns, triggers, previousReview, aiConsent, onSave }: { events: RecoveryEvent[]; checkIns: DailyCheckIn[]; triggers: RecoveryTrigger[]; previousReview?: WeeklyReview; aiConsent: boolean; onSave: (input: Pick<WeeklyReview, "weekStart" | "statistics" | "summary" | "experiment">) => Promise<unknown> }) {
  const now = Date.now()
  const since = now - 7 * 86_400_000
  const recentEvents = events.filter((event) => new Date(event.occurredAt).getTime() >= since)
  const recentCheckIns = checkIns.filter((checkIn) => new Date(`${checkIn.date}T00:00:00`).getTime() >= since)
  const [summary, setSummary] = useState(previousReview?.summary ?? "")
  const [experiment, setExperiment] = useState(previousReview?.experiment ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const stats = (() => {
    const triggerCounts = triggers.map((trigger) => ({ label: trigger.label, count: recentEvents.filter((event) => event.triggerId === trigger.id).length })).sort((a, b) => b.count - a.count)
    const coping = copingEffectiveness(recentEvents)[0]
    const risk = highestRiskTimeRange(recentEvents)
    const averageSleepValues = recentCheckIns.map((item) => item.sleepQuality).filter((item): item is number => typeof item === "number")
    const averageSleep = averageSleepValues.length ? Math.round((averageSleepValues.reduce((sum, value) => sum + value, 0) / averageSleepValues.length) * 10) / 10 : null
    const moods = recentCheckIns.map((item) => item.mood).filter((item): item is string => Boolean(item))
    const commonMood = moods.sort((a, b) => moods.filter((item) => item === b).length - moods.filter((item) => item === a).length)[0]
    const healthy = recentCheckIns.flatMap((item) => item.healthyHabitsCompleted)
    const actions = recentEvents.map((event) => event.actionTaken ?? "")
    return {
      managed: recentEvents.filter((event) => event.rodeOut || event.kind === "win").length,
      slips: recentEvents.filter((event) => event.kind === "slip").length,
      checkInDays: new Set(recentCheckIns.map((item) => item.date)).size,
      averageUrge: averageUrgeIntensity(recentEvents),
      averageReturn: averageTimeToReturnHours(recentEvents),
      trend: weeklyUrgeTrend(events),
      topTrigger: triggerCounts[0]?.count ? triggerCounts[0].label : null,
      coping,
      risk,
      averageSleep,
      commonMood,
      korean: [...healthy, ...actions].filter((item) => includesAny(item, ["korean", "vocab", "speaking", "study"])).length,
      development: [...healthy, ...actions].filter((item) => includesAny(item, ["development", "coding", "focus", "task", "deep work"])).length,
      exercise: healthy.filter((item) => includesAny(item, ["exercise", "walk", "gym", "running"])).length,
      social: healthy.filter((item) => includesAny(item, ["social", "friend", "family", "connection"])).length,
    }
  })()
  const sections = [
    ["What improved", stats.trend === "improving" ? "Average urge intensity moved lower than the previous week." : stats.managed > 0 ? `You managed ${stats.managed} difficult moment${stats.managed === 1 ? "" : "s"}.` : "Keep recording small wins; there is not enough data for a trend yet."],
    ["Difficult moments", stats.risk ? `The most recorded window was ${hourLabel(stats.risk.startHour)}–${hourLabel(stats.risk.endHour)}.` : "No clear time pattern appeared this week."],
    ["Common trigger", stats.topTrigger ?? "No trigger was recorded often enough to highlight."],
    ["Most effective coping action", stats.coping ? `${stats.coping.action} helped in ${stats.coping.successRate}% of ${stats.coping.attempts} recorded attempts.` : "Complete a replacement action in Rescue Mode to compare what works."],
    ["Sleep & mood", `${stats.averageSleep ? `Average sleep rating: ${stats.averageSleep}/5.` : "No sleep rating yet."} ${stats.commonMood ? `Most recorded mood: ${stats.commonMood}.` : "No mood pattern yet."}`],
    ["Korean learning", `${stats.korean} recorded Korean-learning replacement action${stats.korean === 1 ? "" : "s"}.`],
    ["Development focus", `${stats.development} recorded development or focus action${stats.development === 1 ? "" : "s"}.`],
    ["Exercise & connection", `${stats.exercise} exercise action${stats.exercise === 1 ? "" : "s"} and ${stats.social} connection action${stats.social === 1 ? "" : "s"} recorded.`],
    ["Lapses & lessons", stats.slips ? `${stats.slips} slip${stats.slips === 1 ? "" : "s"} recorded. Historical progress and skill achievements remain intact.${stats.averageReturn != null ? ` Average return time: ${stats.averageReturn} hours.` : ""}` : "No slips were recorded this week."],
  ]
  const save = async () => { setSaving(true); try { await onSave({ weekStart: weekStart(), statistics: { managed: stats.managed, slips: stats.slips, checkInDays: stats.checkInDays, averageUrge: stats.averageUrge, averageReturn: stats.averageReturn, koreanActions: stats.korean, developmentActions: stats.development }, summary: summary.trim() || undefined, experiment: experiment.trim() || undefined }); setSaved(true) } finally { setSaving(false) } }
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{[["Check-in days", stats.checkInDays], ["Urges managed", stats.managed], ["Average urge", stats.averageUrge == null ? "—" : `${stats.averageUrge}/10`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-card p-4"><p className="font-mono text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div><div className="grid gap-3 sm:grid-cols-2">{sections.map(([title, copy]) => <div key={title} className="rounded-2xl border border-border bg-card p-4"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>)}</div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex gap-3"><Lightbulb size={18} className="mt-0.5 shrink-0 text-primary" /><div><h2 className="text-base font-semibold">One experiment for next week</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose one small change you can actually test.</p></div></div><Input className="mt-4" value={experiment} onChange={(event) => setExperiment(event.target.value)} maxLength={240} placeholder="e.g. keep my phone outside the bedroom after 11 PM" /><label htmlFor="weekly-note" className="mt-4 block text-sm font-medium">Lessons to remember <span className="font-normal text-muted-foreground">(optional)</span></label><Textarea id="weekly-note" className="mt-2" rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={600} /><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Button type="button" onClick={save} disabled={saving}>{saved ? <Check size={16} /> : null}{saving ? "Saving…" : saved ? "Review saved" : "Save weekly review"}</Button><p className="text-xs leading-5 text-muted-foreground">{aiConsent ? "AI consent is enabled, but this review remains deterministic until you explicitly request a summary." : "AI summary is off. Enable consent in Privacy Settings only if you want it."}</p></div></div><p className="text-xs leading-5 text-muted-foreground">Patterns in this review are descriptive, not medical conclusions.</p></div>
}
