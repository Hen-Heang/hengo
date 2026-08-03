"use client"

import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { GoalCoachChat } from "@/components/goals/GoalCoachChat"

interface CoachPanelProps {
  isOpen: boolean
  goalId: string
  goalTitle: string
  onClose: () => void
  onDraftPlan: () => void
}

/**
 * AI coach as a side panel rather than a primary tab — it's a tool you reach
 * for, not a place you navigate to (see docs/goal-planning-scheduling-audit.md).
 */
export function CoachPanel({ isOpen, goalId, goalTitle, onClose, onDraftPlan }: CoachPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-violet-500" /> AI coach
          </SheetTitle>
          <SheetDescription className="text-xs">
            Ask about this goal, or have it draft a task plan you review first.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border/60 px-5 py-3">
          <Button
            variant="outline"
            onClick={onDraftPlan}
            className="h-11 w-full gap-2 rounded-xl text-xs font-semibold"
          >
            <Sparkles className="h-4 w-4" /> Draft a task plan
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <GoalCoachChat goalId={goalId} goalTitle={goalTitle} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
