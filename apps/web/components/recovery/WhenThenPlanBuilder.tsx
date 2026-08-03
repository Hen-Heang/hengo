"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function WhenThenPlanBuilder({ suggestion, onCreate }: { suggestion?: { ifText: string; thenText: string }; onCreate: (input: { ifText: string; thenText: string }) => Promise<unknown> }) {
  const [ifText, setIfText] = useState("")
  const [thenText, setThenText] = useState("")
  const [saving, setSaving] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!ifText.trim() || !thenText.trim() || saving) return
    setSaving(true)
    try { await onCreate({ ifText: ifText.trim(), thenText: thenText.trim() }); setIfText(""); setThenText("") } finally { setSaving(false) }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div><p className="app-kicker">Implementation intention</p><h2 className="mt-1 text-lg font-semibold">Create a When–Then plan</h2><p className="mt-1 text-sm text-muted-foreground">Make the next useful action specific and small.</p></div>
      {suggestion && <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Suggested from your trigger map</p><p className="mt-2 text-sm"><strong>When</strong> {suggestion.ifText}, <strong>then</strong> {suggestion.thenText}.</p><Button type="button" variant="ghost" size="sm" className="mt-2 px-0 text-primary" onClick={() => { setIfText(suggestion.ifText); setThenText(suggestion.thenText) }}>Use this draft</Button></div>}
      <div className="mt-5 space-y-3"><div className="grid grid-cols-[3.5rem_1fr] items-center gap-2"><label htmlFor="plan-when" className="text-sm font-semibold">When</label><Input id="plan-when" value={ifText} onChange={(event) => setIfText(event.target.value)} maxLength={200} placeholder="I notice this situation" /></div><div className="grid grid-cols-[3.5rem_1fr] items-center gap-2"><label htmlFor="plan-then" className="text-sm font-semibold">Then</label><Input id="plan-then" value={thenText} onChange={(event) => setThenText(event.target.value)} maxLength={200} placeholder="I will take one small action" /></div></div>
      <Button type="submit" className="mt-4 w-full" disabled={saving || !ifText.trim() || !thenText.trim()}><Plus size={16} />{saving ? "Saving…" : "Save plan"}</Button>
    </form>
  )
}
