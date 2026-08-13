"use client"

import Link from "next/link"
import { useMemo } from "react"
import { motion, type Variants } from "motion/react"
import { ArrowUpRight, CalendarDays, ListChecks, Sparkles, Target } from "lucide-react"
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

type ShortcutTone = "calendar" | "goals" | "habits" | "learn"

type Shortcut = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  tone: ShortcutTone
  badge?: string
  badgeTone?: "default" | "warning"
}

const shortcutStyles: Record<
  ShortcutTone,
  { icon: string; border: string; glow: string; arrow: string; badge: string }
> = {
  calendar: {
    icon: "bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/15 dark:text-sky-400",
    border: "hover:border-sky-500/35 focus-visible:border-sky-500/40",
    glow: "bg-gradient-to-br from-sky-500/[0.12] via-cyan-500/[0.04] to-transparent",
    arrow: "text-sky-500 dark:text-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  goals: {
    icon: "bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/15 dark:text-emerald-400",
    border: "hover:border-emerald-500/35 focus-visible:border-emerald-500/40",
    glow: "bg-gradient-to-br from-emerald-500/[0.12] via-teal-500/[0.04] to-transparent",
    arrow: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  habits: {
    icon: "bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/15 dark:text-amber-400",
    border: "hover:border-amber-500/35 focus-visible:border-amber-500/40",
    glow: "bg-gradient-to-br from-amber-500/[0.12] via-orange-500/[0.04] to-transparent",
    arrow: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  learn: {
    icon: "bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/15 dark:text-violet-400",
    border: "hover:border-violet-500/35 focus-visible:border-violet-500/40",
    glow: "bg-gradient-to-br from-violet-500/[0.12] via-fuchsia-500/[0.04] to-transparent",
    arrow: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
}

// Daily shortcuts deliberately favor action over storage. Each card gets a
// distinct functional color so the four actions are recognizable before the
// label is read. Motion is intentionally subtle: a small lift/scale on hover
// and a directional arrow, without distracting looping animation.
function WorkspaceShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {shortcuts.map((s) => {
        const style = shortcutStyles[s.tone]

        return (
          <motion.div
            key={s.href}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.018 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.7 }}
            className="h-full"
          >
            <Link
              href={s.href}
              className={cn(
                "group relative flex h-full min-h-[132px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm outline-none backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-200 hover:bg-card hover:shadow-lg hover:shadow-black/[0.06] focus-visible:ring-2 focus-visible:ring-ring/70 dark:bg-slate-900/45 dark:hover:bg-slate-900/70 dark:hover:shadow-black/25 sm:min-h-[144px] sm:p-5",
                style.border
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100",
                  style.glow
                )}
              />

              <div className="relative flex items-start justify-between gap-3">
                <span className={cn("flex size-10 items-center justify-center rounded-xl", style.icon)}>
                  <s.icon size={19} strokeWidth={2.1} />
                </span>
                <span
                  className={cn(
                    "flex size-8 translate-x-1 -translate-y-1 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                    style.arrow
                  )}
                >
                  <ArrowUpRight size={17} strokeWidth={2.2} />
                </span>
              </div>

              <div className="relative mt-4 min-w-0">
                <span className="block text-[15px] font-semibold tracking-[-0.015em] text-foreground sm:text-base">
                  {s.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground sm:text-[13px]">
                  {s.description}
                </span>
              </div>

              {s.badge && (
                <motion.span
                  key={s.badge}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={cn(
                    "relative mt-auto w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    s.badgeTone === "warning" ? "bg-red-500/10 text-red-500" : style.badge
                  )}
                >
                  {s.badge}
                </motion.span>
              )}
            </Link>
          </motion.div>
        )
      })}
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
      href: "/goals/calendar",
      label: "Calendar",
      description: "Plan your day and time",
      icon: CalendarDays,
      tone: "calendar",
    },
    {
      href: getLastVisited("plan", "/goals"),
      label: "Goals",
      description: "Keep your direction clear",
      icon: Target,
      tone: "goals",
      badge: goalsBadge?.text,
      badgeTone: goalsBadge?.tone,
    },
    {
      href: "/growth/habits",
      label: "Habits",
      description: "Build your daily routines",
      icon: ListChecks,
      tone: "habits",
    },
    {
      href: getLastVisited("learn", "/learn"),
      label: "Learn",
      description: "Continue focused practice",
      icon: Sparkles,
      tone: "learn",
    },
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

      {/* ── Daily workspaces ── */}
      <motion.div variants={fadeUp}>
        <WorkspaceShortcuts shortcuts={shortcuts} />
      </motion.div>
    </motion.div>
  )
}
