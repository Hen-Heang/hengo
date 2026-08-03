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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api"
import { useMemoryMutations } from "@/hooks/useMemory"
import { MEMORY_CATEGORY_SUGGESTIONS, validateMemoryCandidateInput } from "@/lib/memory"

/** Lets the user tell Hengo something directly, skipping the AI-proposal
 * queue entirely (source_type "manual", saved as already "approved" since
 * they typed it themselves). */
export function AddMemoryDialog() {
  const { create } = useMemoryMutations()
  const [open, setOpen] = useState(false)
  const [fact, setFact] = useState("")
  const [category, setCategory] = useState<string>("preference")
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const errors = validateMemoryCandidateInput({ fact })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitAttempted(true)
    if (Object.keys(errors).length > 0) return
    try {
      await create.mutateAsync({ fact: fact.trim(), category })
      toast.success("Remembered")
      setFact("")
      setSubmitAttempted(false)
      setOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't save that."))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus size={14} />
          Add a memory
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tell Hengo something</DialogTitle>
            <DialogDescription>Saved directly as known context — no approval needed since you wrote it.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Textarea
              aria-label="Memory fact"
              value={fact}
              onChange={(e) => setFact(e.target.value)}
              placeholder="e.g. I prefer concise answers with code examples"
              className="min-h-20"
              maxLength={500}
            />
            {submitAttempted && errors.fact && <p role="alert" className="text-sm text-destructive">{errors.fact}</p>}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full" aria-label="Memory category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMORY_CATEGORY_SUGGESTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
