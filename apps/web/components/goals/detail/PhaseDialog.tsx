"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage, planPhasesApi } from "@/lib/api"
import {
  PHASE_STATUSES,
  phaseInputSchema,
  type GoalPlanPhase,
  type PhaseStatus,
} from "@/lib/goal-plan-phases"

interface PhaseDialogProps {
  isOpen: boolean
  goalId: string
  phase: GoalPlanPhase | null
  /** Goal window — the date inputs are bounded by it. */
  goalStartDate?: string | null
  goalTargetDate?: string | null
  onClose: () => void
  onSaved: () => void
}

const emptyForm = {
  title: "",
  objective: "",
  start_date: "",
  end_date: "",
  status: "planned" as PhaseStatus,
}

/** Create/edit one plan phase. Validation is the shared Zod schema. */
export function PhaseDialog({
  isOpen,
  goalId,
  phase,
  goalStartDate,
  goalTargetDate,
  onClose,
  onSaved,
}: PhaseDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setForm(
      phase
        ? {
            title: phase.title,
            objective: phase.objective ?? "",
            start_date: phase.start_date ?? "",
            end_date: phase.end_date ?? "",
            status: phase.status,
          }
        : { ...emptyForm, start_date: goalStartDate ?? "" },
    )
  }, [isOpen, phase, goalStartDate])

  const save = async () => {
    const payload = {
      title: form.title,
      objective: form.objective.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
    }
    const parsed = phaseInputSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the phase details.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (phase) await planPhasesApi.update(phase.id, parsed.data)
      else await planPhasesApi.create({ goal_id: goalId, ...parsed.data })
      onSaved()
      onClose()
      toast.success(phase ? "Phase updated" : "Phase added")
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't save this phase. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[480px] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <div className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="text-base font-semibold">
            {phase ? "Edit phase" : "Add phase"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs">
            A phase is an ordered stage of this goal&apos;s plan — tasks group under it.
          </DialogDescription>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="phase-title">Title</Label>
            <Input
              id="phase-title"
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Build the baseline"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phase-objective">Objective (optional)</Label>
            <Textarea
              id="phase-objective"
              value={form.objective}
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
              placeholder="What must be true when this phase ends?"
              className="min-h-20 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phase-start">Starts</Label>
              <Input
                id="phase-start"
                type="date"
                value={form.start_date}
                min={goalStartDate ?? undefined}
                max={goalTargetDate ?? undefined}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phase-end">Ends</Label>
              <Input
                id="phase-end"
                type="date"
                value={form.end_date}
                min={form.start_date || goalStartDate || undefined}
                max={goalTargetDate ?? undefined}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phase-status">Status</Label>
            <select
              id="phase-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PhaseStatus }))}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary/40"
            >
              {PHASE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-border/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 flex-1 rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={saving || !form.title.trim()}
            className="h-11 flex-[2] rounded-xl"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {phase ? "Save phase" : "Add phase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
