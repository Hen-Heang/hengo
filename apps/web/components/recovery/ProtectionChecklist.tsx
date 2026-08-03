"use client"

import { useState } from "react"
import { Laptop, Smartphone, SunMedium } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ProtectionItem, ProtectionStatus } from "@/lib/types"
import type { ProtectionItemInput } from "@/lib/recovery-schemas"

const SUGGESTIONS: Array<{ category: ProtectionItem["category"]; label: string }> = [
  { category: "phone", label: "Enable device content restrictions" },
  { category: "phone", label: "Remove private browsers" },
  { category: "phone", label: "Unfollow triggering accounts" },
  { category: "phone", label: "Move distracting apps off the home screen" },
  { category: "phone", label: "Keep the phone away from the bed" },
  { category: "phone", label: "Set downtime hours" },
  { category: "computer", label: "Use a website blocker" },
  { category: "computer", label: "Use separate work and personal profiles" },
  { category: "computer", label: "Disable triggering recommendations" },
  { category: "computer", label: "Add a shutdown routine" },
  { category: "daily_environment", label: "Prepare replacement activities" },
  { category: "daily_environment", label: "Protect sleep" },
  { category: "daily_environment", label: "Schedule exercise" },
  { category: "daily_environment", label: "Plan weekends" },
  { category: "daily_environment", label: "Maintain social connection" },
  { category: "daily_environment", label: "Time-block Korean and development practice" },
]

const STATUS_LABELS: Record<ProtectionStatus, string> = { not_set: "Not set", planned: "Planned", active: "Active", needs_improvement: "Needs improvement" }
const SECTIONS = [
  { category: "phone" as const, label: "Phone", icon: Smartphone },
  { category: "computer" as const, label: "Computer", icon: Laptop },
  { category: "daily_environment" as const, label: "Daily environment", icon: SunMedium },
]

export function ProtectionChecklist({ items, onSave }: { items: ProtectionItem[]; onSave: (input: ProtectionItemInput) => Promise<unknown> }) {
  const [savingLabel, setSavingLabel] = useState<string>()
  const itemFor = (label: string) => items.find((item) => item.label === label)
  const save = async (suggestion: (typeof SUGGESTIONS)[number], status: ProtectionStatus, preferredAction: boolean) => {
    setSavingLabel(suggestion.label)
    try { await onSave({ ...suggestion, status, preferredAction, sortOrder: SUGGESTIONS.indexOf(suggestion) }) } finally { setSavingLabel(undefined) }
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="app-kicker">Environment protection</p><h2 className="mt-1 text-lg font-semibold">Reduce easy access to triggers</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">These are configurable suggestions, not strict instructions. Mark what fits your life.</p>
      <div className="mt-6 space-y-6">{SECTIONS.map(({ category, label, icon: Icon }) => <div key={category}><div className="flex items-center gap-2"><Icon size={17} className="text-primary" /><h3 className="text-sm font-semibold">{label}</h3></div><div className="mt-3 divide-y divide-border rounded-2xl border border-border/70">{SUGGESTIONS.filter((item) => item.category === category).map((suggestion) => { const saved = itemFor(suggestion.label); const status = saved?.status ?? "not_set"; return <div key={suggestion.label} className="grid gap-3 p-3.5 sm:grid-cols-[1fr_10rem_auto] sm:items-center"><p className="text-sm leading-5">{suggestion.label}</p><Select disabled={savingLabel === suggestion.label} value={status} onValueChange={(value) => save(suggestion, value as ProtectionStatus, saved?.preferredAction ?? false)}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectContent></Select><label className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-start"><Switch checked={saved?.preferredAction ?? false} onCheckedChange={(checked) => save(suggestion, status, checked)} aria-label={`Use ${suggestion.label} in Urge Rescue`} />Rescue</label></div>})}</div></div>)}</div>
    </section>
  )
}
