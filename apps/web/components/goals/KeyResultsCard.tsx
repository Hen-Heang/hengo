"use client"

import { useState } from "react"
import { Archive, Check, Loader2, Plus, Target, X } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { keyResultsApi, getApiErrorMessage } from "@/lib/api"
import { keyResultProgress } from "@/lib/goal-progress"
import { KEY_RESULT_METRIC_TYPES, type GoalKeyResult, type KeyResultMetricType } from "@/lib/goal-key-results"

/**
 * Key results for a goal — the measurable proof-of-outcome layer (Goal
 * System v2). Distinct from GoalMilestones (a plain checklist stored in
 * goal.metadata): key results have a metric type, baseline/target/current
 * value, and a weight that feeds the weighted outcome-progress calculation
 * in lib/goal-progress.ts.
 *
 * Manual current-value updates only in this phase — data_source options
 * other than "manual" exist in the schema (see lib/goal-key-results.ts) but
 * aren't wired to a live signal yet.
 */
export function KeyResultsCard({
  goalId,
  keyResults,
  onChanged,
}: {
  goalId: string
  keyResults: GoalKeyResult[]
  onChanged: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    metric_type: "number" as KeyResultMetricType,
    baseline_value: "",
    target_value: "",
    unit: "",
    weight: "1",
  })

  const active = keyResults.filter((kr) => kr.status !== "archived")

  async function createKeyResult() {
    const title = form.title.trim()
    if (!title) return
    setCreating(true)
    try {
      await keyResultsApi.create({
        goal_id: goalId,
        title,
        metric_type: form.metric_type,
        baseline_value: form.baseline_value === "" ? null : Number(form.baseline_value),
        target_value: form.target_value === "" ? null : Number(form.target_value),
        unit: form.unit || null,
        weight: form.weight === "" ? 1 : Number(form.weight),
      })
      onChanged()
      setForm({ title: "", metric_type: "number", baseline_value: "", target_value: "", unit: "", weight: "1" })
      setAdding(false)
      toast.success("Key result added")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't add the key result. Please try again."))
    } finally {
      setCreating(false)
    }
  }

  async function updateCurrentValue(kr: GoalKeyResult, raw: string) {
    if (raw === "") return
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    setSavingId(kr.id)
    try {
      await keyResultsApi.update(kr.id, { current_value: value })
      onChanged()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't update this key result."))
    } finally {
      setSavingId(null)
    }
  }

  async function toggleBoolean(kr: GoalKeyResult) {
    setSavingId(kr.id)
    try {
      await keyResultsApi.update(kr.id, { current_value: kr.current_value ? 0 : 1 })
      onChanged()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't update this key result."))
    } finally {
      setSavingId(null)
    }
  }

  async function archive(kr: GoalKeyResult) {
    setSavingId(kr.id)
    try {
      await keyResultsApi.archive(kr.id)
      onChanged()
      toast.success("Key result archived")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Couldn't archive this key result."))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card className="rounded-3xl border-border bg-card/50 p-6 shadow-sm sm:rounded-3xl sm:p-8">
      <div className="flex items-center gap-2">
        <Target size={15} strokeWidth={2.5} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Key results</h3>
        <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          what proves this goal is working
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {active.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-border bg-background/30 px-4 py-5 text-center text-sm font-medium text-muted-foreground">
            No key results yet. Add one to measure the real outcome instead of just task completion — this
            goal&apos;s progress bar will keep showing legacy task activity until you do.
          </p>
        )}

        {active.map((kr) => {
          const pct = keyResultProgress(kr)
          const isSaving = savingId === kr.id
          return (
            <div key={kr.id} className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{kr.title}</p>
                  {kr.description && (
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">{kr.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isSaving && <Loader2 size={13} className="animate-spin text-muted-foreground/40" />}
                  <button
                    type="button"
                    onClick={() => void archive(kr)}
                    aria-label={`Archive key result: ${kr.title}`}
                    className="rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Archive size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/5"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${kr.title} progress`}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                <span>
                  {kr.metric_type === "boolean"
                    ? kr.current_value
                      ? "Done"
                      : "Not yet"
                    : `${kr.current_value ?? kr.baseline_value ?? 0}${kr.unit ? ` ${kr.unit}` : ""} / ${
                        kr.target_value ?? "—"
                      }${kr.unit ? ` ${kr.unit}` : ""}`}
                  {" · "}
                  {pct}%
                </span>

                {kr.metric_type === "boolean" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg px-2 text-[11px]"
                    onClick={() => void toggleBoolean(kr)}
                  >
                    Mark {kr.current_value ? "not done" : "done"}
                  </Button>
                ) : (
                  <label className="flex items-center gap-1.5">
                    Update:
                    <input
                      type="number"
                      defaultValue={kr.current_value ?? ""}
                      onBlur={(e) => void updateCurrentValue(kr, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                      }}
                      aria-label={`Current value for ${kr.title}`}
                      className="h-7 w-20 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/40"
                    />
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {adding ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-primary/30 bg-primary/[0.03] p-3">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Two-minute work update score"
            aria-label="Key result title"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={form.metric_type}
              onChange={(e) => setForm((f) => ({ ...f, metric_type: e.target.value as KeyResultMetricType }))}
              aria-label="Metric type"
              className="h-9 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/40"
            >
              {KEY_RESULT_METRIC_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {form.metric_type !== "boolean" && (
              <>
                <input
                  type="number"
                  placeholder="Baseline"
                  value={form.baseline_value}
                  onChange={(e) => setForm((f) => ({ ...f, baseline_value: e.target.value }))}
                  aria-label="Baseline value"
                  className="h-9 w-24 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/40"
                />
                <input
                  type="number"
                  placeholder="Target"
                  value={form.target_value}
                  onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
                  aria-label="Target value"
                  className="h-9 w-24 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/40"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  aria-label="Unit"
                  className="h-9 w-20 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/40"
                />
              </>
            )}
            <input
              type="number"
              placeholder="Weight"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              aria-label="Weight"
              className="h-9 w-20 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void createKeyResult()}
              disabled={!form.title.trim() || creating}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="Cancel adding key result"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent active:scale-95"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
        >
          <Plus size={14} strokeWidth={3} /> Add key result
        </button>
      )}
    </Card>
  )
}
