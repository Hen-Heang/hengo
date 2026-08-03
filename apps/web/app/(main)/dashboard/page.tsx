"use client"

import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Map as MapIcon,
  NotebookPen,
  Plus,
  Target,
} from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

import { GoalsOverview } from "@/components/dashboard/GoalsOverview"
import { RoadmapTeaser } from "@/components/dashboard/RoadmapTeaser"
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines"
import { TodaysTasks } from "@/components/goals/TodaysTasks"
import { Skeleton } from "@/components/ui/skeleton"

import { useGoals } from "@/hooks/useGoals"

function DashboardLoadingState() {
  return (
    <div className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 shadow-sm sm:p-8">
          <Skeleton className="h-4 w-36 bg-white/10" />
          <Skeleton className="mt-4 h-14 w-52 bg-white/10 sm:h-16 sm:w-72" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-white/10" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-lg bg-white/10" />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <Skeleton className="h-10 w-24 bg-white/10" />
                <Skeleton className="mt-4 h-10 w-24 bg-white/10" />
                <Skeleton className="mt-2 h-4 w-20 bg-white/10" />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-13 w-full rounded-2xl bg-white/10 sm:h-14 sm:w-44" />
            <Skeleton className="h-13 w-full rounded-2xl bg-white/10 sm:h-14 sm:w-40" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-9 w-3/4" />
            <Skeleton className="mt-3 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-5/6" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-accent/5 px-4 py-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="mt-5 h-6 w-28" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-48" />
          <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mx-auto mt-6 h-32 w-32 rounded-full sm:h-36 sm:w-36" />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-12 w-28" />
              <Skeleton className="mt-4 h-5 w-full" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
function getToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

const quickActions = [
  {
    href: "/goals/create",
    label: "New goal",
    description: "Plan a goal, set a deadline, and break it into tasks.",
    icon: Plus,
  },
  {
    href: "/goals/calendar",
    label: "Calendar",
    description: "See every task and deadline laid out by day.",
    icon: CalendarDays,
  },
  {
    href: "/roadmap",
    label: "Roadmap",
    description: "Track your developer-skills learning roadmap.",
    icon: MapIcon,
  },
  {
    href: "/notes",
    label: "Notes",
    description: "Your personal knowledge library.",
    icon: NotebookPen,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
} as const

export default function DashboardPage() {
  const { sortedGoals, isLoading: goalsLoading } = useGoals()

  if (goalsLoading) {
    return <DashboardLoadingState />
  }

  const activeGoals = sortedGoals.filter((g) => g.status !== "completed" && g.status !== "archived")
  const completedGoals = sortedGoals.filter((g) => g.status === "completed")

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-12 sm:space-y-10"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-kicker">{getToday()}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            Your goals &amp; tasks
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
            <Target size={14} className="text-blue-500" />
            <span className="text-sm font-medium text-foreground">{activeGoals.length} active</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
            <ClipboardList size={14} className="text-emerald-500" />
            <span className="text-sm font-medium text-foreground">{completedGoals.length} completed</span>
          </div>
        </div>
      </motion.div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 sm:gap-6">

        {/* Today's tasks (7 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-7 lg:col-span-8">
          <TodaysTasks />
        </motion.div>

        {/* Upcoming deadlines (5 cols) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-5 lg:col-span-4">
          <UpcomingDeadlines />
        </motion.div>

        {/* Quick actions (full width) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "group rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm outline-none transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-900/70"
                )}
              >
                <div className="inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  <action.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{action.label}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  Start
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Roadmap teaser (career/dev growth) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6">
          <RoadmapTeaser className="h-full" />
        </motion.div>

        {/* Goals overview */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6">
          <GoalsOverview className="h-full" />
        </motion.div>

      </div>
    </motion.div>
  )
}
