"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Mic, Square } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage, goalsApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import { useInboxMutations } from "@/hooks/useInbox"
import { INBOX_ITEM_TYPES, parseTagsInput, validateInboxItemInput, type InboxItemType } from "@/lib/inbox"
import { QUICK_CAPTURE_OPEN_EVENT } from "@/lib/quick-capture-bus"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { cn } from "@/lib/utils"

const NO_GOAL = "none"

/**
 * Shared Quick Capture dialog — mounted once in AppShell (see AppShell.tsx),
 * opened from anywhere via `openQuickCapture()` (⌘K action or either top bar)
 * so capturing a thought never requires leaving the current page.
 */
export function QuickCaptureDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [itemType, setItemType] = useState<InboxItemType>("idea")
  const [tagsInput, setTagsInput] = useState("")
  const [eventAt, setEventAt] = useState<Date | null>(null)
  const [goalId, setGoalId] = useState<string>(NO_GOAL)
  const [moreOpen, setMoreOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const { capture } = useInboxMutations()
  const userId = getUserId()
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", userId, "for-inbox-link"],
    queryFn: () => goalsApi.list(),
    enabled: userId != null && moreOpen,
    staleTime: 60_000,
  })

  const speech = useSpeechRecognition({
    lang: "en-US",
    onResult: (transcript) => setContent(transcript),
  })

  useEffect(() => {
    function handleOpen() {
      setOpen(true)
    }
    window.addEventListener(QUICK_CAPTURE_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(QUICK_CAPTURE_OPEN_EVENT, handleOpen)
  }, [])

  function reset() {
    setTitle("")
    setContent("")
    setItemType("idea")
    setTagsInput("")
    setEventAt(null)
    setGoalId(NO_GOAL)
    setMoreOpen(false)
    setSubmitAttempted(false)
    speech.reset()
  }

  function handleOpenChange(next: boolean) {
    if (!next) speech.stop()
    setOpen(next)
    if (!next) reset()
  }

  const errors = validateInboxItemInput({ title, content })

  async function submitCapture() {
    setSubmitAttempted(true)
    if (Object.keys(errors).length > 0 || saving) return
    setSaving(true)
    try {
      await capture.mutateAsync({
        title: title.trim() || null,
        content: content.trim(),
        itemType,
        tags: parseTagsInput(tagsInput),
        eventAt: eventAt ? eventAt.toISOString() : null,
        goalId: goalId === NO_GOAL ? null : goalId,
        source: speech.transcript ? "voice" : "manual",
      })
      toast.success("Captured to your inbox")
      handleOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't save that — try again."))
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void submitCapture()
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      void submitCapture()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-lg p-0">
        <form onSubmit={handleSubmit} className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
            <DialogTitle>Quick capture</DialogTitle>
            <DialogDescription>Jot it down now — organize it later.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="flex items-center gap-2">
              <Select value={itemType} onValueChange={(value) => setItemType(value as InboxItemType)}>
                <SelectTrigger className="w-44" aria-label="Capture type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INBOX_ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {speech.supported && (
                <Button
                  type="button"
                  variant={speech.status === "listening" ? "default" : "outline"}
                  size="sm"
                  className="ml-auto gap-1.5"
                  onClick={() => (speech.status === "listening" ? speech.stop() : speech.start())}
                  aria-pressed={speech.status === "listening"}
                >
                  {speech.status === "listening" ? (
                    <>
                      <Square size={14} /> Stop
                    </>
                  ) : (
                    <>
                      <Mic size={14} /> Dictate
                    </>
                  )}
                </Button>
              )}
            </div>

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title (optional)"
              aria-label="Title"
              aria-invalid={submitAttempted && Boolean(errors.title)}
              maxLength={200}
            />

            <div className="space-y-1.5">
              <Textarea
                autoFocus
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="What's on your mind? An idea, a task, a Korean phrase, a bug you just fixed…"
                aria-label="Content"
                aria-invalid={submitAttempted && Boolean(errors.content)}
                className={cn("min-h-32", submitAttempted && errors.content && "border-destructive")}
              />
              {speech.error && <p className="text-xs text-destructive">{speech.error}</p>}
              {submitAttempted && errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
            </div>

            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="Tags, comma separated (optional)"
              aria-label="Tags"
            />

            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronDown size={14} className={cn("transition-transform", moreOpen && "rotate-180")} />
                  More options
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="quick-capture-event-at" className="text-sm font-medium text-muted-foreground">Event or activity time</label>
                  <DateTimePicker id="quick-capture-event-at" value={eventAt} onChange={setEventAt} granularity="minute" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Related goal</label>
                  <Select value={goalId} onValueChange={setGoalId}>
                    <SelectTrigger className="w-full" aria-label="Related goal">
                      <SelectValue placeholder="No goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GOAL}>No goal</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-muted/30 px-5 py-3">
            <p className="mr-auto hidden text-xs text-muted-foreground sm:block">⌘/Ctrl + Enter to capture</p>
            <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || Object.keys(errors).length > 0}>
              {saving ? "Capturing…" : "Capture"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
