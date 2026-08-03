"use client"

import { createContext, useContext } from "react"

import type { GoalDetail } from "@/hooks/useGoalDetail"

export interface GoalDetailShell {
  /** Open the Add Task dialog, optionally pre-assigned to a phase. */
  openAddTask: (phaseId: string | null) => void
  openCoach: () => void
  openAiPlan: () => void
  openManagement: () => void
}

const ShellContext = createContext<GoalDetailShell | null>(null)

export const GoalDetailShellProvider = ShellContext.Provider

/**
 * Lets a route open one of the shell's dialogs. The dialogs live in the layout
 * (so they survive navigation between the five goal routes) while the buttons
 * that open them live in the pages.
 */
export function useGoalDetailShell(): GoalDetailShell {
  const shell = useContext(ShellContext)
  if (!shell) {
    throw new Error("useGoalDetailShell must be used inside the goal detail layout")
  }
  return shell
}

/** Convenience alias so pages read as `useGoalDetailData()` next to the shell. */
export type { GoalDetail }
