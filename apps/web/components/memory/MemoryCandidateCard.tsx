"use client"

import { useState } from "react"
import { Check, Pencil, RotateCcw, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api"
import { useMemoryMutations } from "@/hooks/useMemory"
import {
  MEMORY_SOURCE_LABELS,
  validateMemoryCandidateInput,
  type MemoryCandidate,
} from "@/lib/memory"

/** One row in the memory-approval queue. AI-proposed rows get Approve/Reject;
 * already-approved rows get Edit/Archive so the user stays in full control of
 * what Ask Hengo treats as known context — never a silent AI write. */
export function MemoryCandidateCard({ candidate }: { candidate: MemoryCandidate }) {
  const { approve, update, reject, archive, remove } = useMemoryMutations()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(candidate.fact)
  const [saving, setSaving] = useState(false)

  const errors = validateMemoryCandidateInput({ fact: draft })

  async function handleApprove() {
    try {
      await approve.mutateAsync({ id: candidate.id })
      toast.success("Added to known context")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't approve that."))
    }
  }

  async function handleSaveEdit() {
    if (Object.keys(errors).length > 0) return
    setSaving(true)
    try {
      if (candidate.status === "proposed") {
        await approve.mutateAsync({ id: candidate.id, editedFact: draft })
      } else {
        await update.mutateAsync({ id: candidate.id, fact: draft })
      }
      toast.success("Saved")
      setEditing(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't save that."))
    } finally {
      setSaving(false)
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync(candidate.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't dismiss that."))
    }
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync(candidate.id)
      toast.success("Archived")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't archive that."))
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(candidate.id)
      toast.success("Deleted")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't delete that."))
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{candidate.category}</Badge>
          <Badge variant="ghost" className="text-muted-foreground">
            {MEMORY_SOURCE_LABELS[candidate.sourceType]}
          </Badge>
          {candidate.status === "proposed" && candidate.confidence < 0.6 && (
            <Badge variant="outline" className="text-muted-foreground">
              Low confidence
            </Badge>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-16"
            maxLength={500}
          />
          {errors.fact && <p className="text-xs text-destructive">{errors.fact}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false)
                setDraft(candidate.fact)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || Object.keys(errors).length > 0}
              onClick={handleSaveEdit}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground">{candidate.fact}</p>
      )}

      {!editing && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-2">
          {candidate.status === "proposed" && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={handleReject}>
                <X size={14} />
                Dismiss
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil size={14} />
                Edit &amp; approve
              </Button>
              <Button type="button" size="sm" onClick={handleApprove}>
                <Check size={14} />
                Approve
              </Button>
            </>
          )}
          {candidate.status === "approved" && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil size={14} />
                Edit
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleArchive}>
                Archive
              </Button>
            </>
          )}
          {(candidate.status === "rejected" || candidate.status === "archived") && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleApprove}>
                <RotateCcw size={14} />
                Restore
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes it. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      )}
    </div>
  )
}
