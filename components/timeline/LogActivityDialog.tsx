"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api"
import { useManualActivityMutations } from "@/hooks/useManualActivities"

const SUGGESTED_CATEGORIES = ["Exercise", "Deep work", "Learning", "Social", "Chore", "Rest", "Creative"]

export function LogActivityDialog() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [category, setCategory] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const { create } = useManualActivityMutations()

  function reset() {
    setLabel("")
    setCategory("")
    setDurationMinutes("")
    setNotes("")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!label.trim() || saving) return
    setSaving(true)
    try {
      await create.mutateAsync({
        label: label.trim(),
        category: category.trim() || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        notes: notes.trim() || null,
      })
      toast.success("Activity logged")
      setOpen(false)
      reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't log that activity."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={16} />
          Log activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log a real-life activity</DialogTitle>
            <DialogDescription>
              Something you actually did — separate from time Hengo tracks automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Went for a run, read a chapter…"
              autoFocus
              required
              maxLength={160}
            />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground data-[active=true]:border-primary/40 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  data-active={category === c}
                >
                  {c}
                </button>
              ))}
            </div>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)" />
            <Input
              type="number"
              min={0}
              max={1440}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="Duration in minutes (optional)"
            />
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="min-h-20" />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !label.trim()}>
              {saving ? "Logging…" : "Log activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
