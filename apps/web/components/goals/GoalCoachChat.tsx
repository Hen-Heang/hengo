"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { goalsApi, getApiErrorMessage } from "@/lib/api"

interface Msg {
  role: "user" | "assistant"
  content: string
}

const STARTERS = [
  "What should I focus on next?",
  "I'm feeling stuck — any advice?",
  "Break my next task into smaller steps",
]

export function GoalCoachChat({ goalId, goalTitle }: { goalId: string; goalTitle?: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || streaming) return
    setInput("")
    const history = messages.slice(-12)
    setMessages((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: "" }])
    setStreaming(true)
    try {
      await goalsApi.coachStream(
        goalId,
        message,
        history,
        (token) =>
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = {
              role: "assistant",
              content: next[next.length - 1].content + token,
            }
            return next
          }),
        () => {}
      )
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev]
        // drop the empty assistant placeholder on failure
        if (next[next.length - 1]?.role === "assistant" && !next[next.length - 1].content) next.pop()
        return next
      })
      toast.error(getApiErrorMessage(e, "Coach is unavailable right now."))
    } finally {
      setStreaming(false)
    }
  }

  return (
    <Card className="flex h-[clamp(420px,70dvh,640px)] flex-col overflow-hidden rounded-3xl border-border bg-card/50 shadow-sm">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight text-foreground">AI Goal Coach</p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {goalTitle ? `Focused on "${goalTitle}"` : "Grounded in this goal's tasks"}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-xs text-sm font-medium text-muted-foreground">
              Ask the coach for guidance on this goal — it knows your tasks and progress.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                )}
              >
                {m.content || (streaming && i === messages.length - 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                ) : (
                  ""
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="flex shrink-0 items-center gap-2 border-t border-border/60 px-4 py-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          disabled={streaming}
          className="h-11 flex-1 rounded-xl"
        />
        <Button
          type="submit"
          size="icon"
          disabled={streaming || !input.trim()}
          className="h-11 w-11 shrink-0 rounded-xl"
          aria-label="Send message"
        >
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  )
}
