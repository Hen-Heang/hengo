"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Copy, Link2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { goalsApi, getApiErrorMessage } from "@/lib/api"

interface ShareGoalCardProps {
  goalId: string
  /** Current share code from the loaded goal (goal.share_code). */
  shareCode?: string
  /** Called after regenerate so the parent can refresh the goal. */
  onRegenerated?: (code: string) => void
}

/**
 * Owner-only sharing panel: shows the join link built from the goal's share code,
 * with copy + regenerate. Anyone who opens the link can join via /goals/join/[code]
 * (backend POST /goals/by-share-code/{code}/join).
 */
export function ShareGoalCard({ goalId, shareCode, onRegenerated }: ShareGoalCardProps) {
  const [code, setCode] = useState(shareCode)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => setCode(shareCode), [shareCode])
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  const link = code ? `${origin}/goals/join/${code}` : ""

  const copy = useCallback(async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — select and copy manually")
    }
  }, [link])

  const regenerate = useCallback(async () => {
    setRegenerating(true)
    try {
      const { shareCode: next } = await goalsApi.regenerateShareCode(goalId)
      setCode(next)
      onRegenerated?.(next)
      toast.success("New link generated", { description: "The old link no longer works." })
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not regenerate the link"))
    } finally {
      setRegenerating(false)
    }
  }, [goalId, onRegenerated])

  return (
    <Card className="rounded-3xl border-border bg-card/50 p-6 shadow-sm sm:p-8">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Link2 size={14} /> Share link
      </h3>
      <p className="mt-2 mb-5 text-sm font-medium leading-relaxed text-muted-foreground">
        Anyone with this link can open and join this goal.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="Generating…"
          className="h-11 flex-1 font-mono text-xs"
        />
        <div className="flex gap-2">
          <Button onClick={copy} disabled={!link} className="h-11 shrink-0 gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            onClick={regenerate}
            disabled={regenerating}
            className="h-11 shrink-0 gap-2"
            title="Generate a new link and invalidate the old one"
          >
            <RefreshCw size={16} className={regenerating ? "animate-spin" : undefined} />
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}
