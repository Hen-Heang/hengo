"use client"

import { useState } from "react"
import { Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"

const FRAMES = [
  { label: "Direct answer", text: "___\uC740/\uB294 ___\uC2B5\uB2C8\uB2E4. \uD2B9\uD788 ___\uC2B5\uB2C8\uB2E4." },
  { label: "Comparison", text: "A\uB294 ___\uD55C \uBC18\uBA74\uC5D0 B\uB294 ___\uD569\uB2C8\uB2E4." },
  { label: "Reason", text: "___\uAE30 \uB54C\uBB38\uC5D0 ___\uD569\uB2C8\uB2E4." },
  { label: "Personal experience", text: "\uCC98\uC74C\uC5D0\uB294 ___\uC9C0\uB9CC \uC9C0\uAE08\uC740 ___\uC2B5\uB2C8\uB2E4." },
  { label: "Opinion", text: "\uC800\uB294 ___\uB2E4\uACE0 \uC0DD\uAC01\uD569\uB2C8\uB2E4. \uC65C\uB0D0\uD558\uBA74 ___\uAE30 \uB54C\uBB38\uC785\uB2C8\uB2E4." },
]

export function AnswerFrameHint() {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  if (!open) {
    return (
      <Button type="button" variant="ghost" onClick={() => setOpen(true)} className="h-10 rounded-xl px-3 text-sm">
        <Lightbulb className="mr-2 size-4" />Reveal a short answer frame
      </Button>
    )
  }

  const frame = FRAMES[index]
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{frame.label}</p>
          <p lang="ko" className="mt-1 text-sm font-semibold leading-relaxed text-foreground">{frame.text}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIndex((value) => (value + 1) % FRAMES.length)} className="rounded-lg">
          Another frame
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">This is structure only, not the complete model answer.</p>
    </div>
  )
}
