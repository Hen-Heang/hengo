"use client"

import Link from "next/link"
import { useMemo } from "react"
import { motion, type Variants } from "motion/react"
import { BrainCircuit, Sparkles, Target, TreeDeciduous } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { TodayHabitCheckins } from "@/components/home/TodayHabitCheckins"
import { TodayTasksCard } from "@/components/home/TodayTasksCard"
import { useGoals } from "@/hooks/useGoals"
import { calculateGoalDeadlineInfo } from "@/lib/goals"
import { getLastVisited } from "@/lib/last-visited"
import { cn } from "@/lib/utils"

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getTodayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

type Shortcut = {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
  badgeTone?: "default" | "warning"
}

// Small "continue where you left off" tiles into the other workspaces — not
// a data section of their own, so no dedicated loading state; the Goals
// badge below reuses useGoals' already-cached list (shares its query key
// with useTodaysTasks, so this never triggers a second goals fetch).
function WorkspaceShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {shortcuts.map((s) => (
        <motion.div
          key={s.href}
          variants={fadeUp}
          whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 22 } }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href={s.href}
            className="flex min-h-11 flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 shadow-sm outline-none transition-[background-color,box-shadow] hover:bg-accent/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-900/40"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon size={18} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-foreground">{s.label}</span>
            {s.badge && (
              <motion.span
                key={s.badge}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-xs font-medium",
                  s.badgeTone === "warning"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-foreground/[0.04] text-muted-foreground"
                )}
              >
                {s.badge}
              </motion.span>
            )}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default function HomePage() {
  const { sortedGoals } = useGoals()

  const goalsBadge = useMemo(() => {
    const active = sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived")
    const overdue = active.filter((g) => calculateGoalDeadlineInfo(g).status === "overdue")
    if (active.length === 0) return undefined
    return overdue.length > 0
      ? { text: `${overdue.length} overdue`, tone: "warning" as const }
      : { text: `${active.length} active`, tone: "default" as const }
  }, [sortedGoals])

  const shortcuts: Shortcut[] = [
    {
      href: getLastVisited("plan", "/goals"),
      label: "Goals",
      icon: Target,
      badge: goalsBadge?.text,
      badgeTone: goalsBadge?.tone,
    },
    { href: getLastVisited("grow", "/growth/recovery"), label: "Grow", icon: TreeDeciduous },
    { href: getLastVisited("memory", "/ask-hengo/memories"), label: "Memory", icon: BrainCircuit },
    { href: getLastVisited("learn", "/learn"), label: "Learn", icon: Sparkles },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:space-y-6 sm:px-6 sm:pt-6 lg:px-8"
    >
      {/* ── Greeting ── */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">
          {getGreeting()}{" "}
          <motion.span
            className="inline-block origin-[70%_70%]"
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
          >
            👋
          </motion.span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{getTodayLabel()}</p>
      </motion.div>

      {/* ── Today's tasks + habits ── */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <TodayTasksCard />
        <TodayHabitCheckins />
      </motion.div>

      {/* ── Workspace shortcuts ── */}
      <motion.div variants={fadeUp}>
        <WorkspaceShortcuts shortcuts={shortcuts} />
      </motion.div>
    </motion.div>
  )
}
