"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, MessageCircle, Settings, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils"

const DISMISSED_KEY = "hengo_first_run_dismissed"
const DISMISSED_EVENT = "hengo:first-run-dismissed"

const STEPS = [
  {
    num: 1,
    icon: Settings,
    title: "Set your Korean level",
    description: "Tell us where you're starting so the AI adapts to you.",
    href: "/settings",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    num: 2,
    icon: BookOpen,
    title: "Add your first vocab words",
    description: "Generate a themed deck or paste your own word list.",
    href: "/vocab",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    num: 3,
    icon: MessageCircle,
    title: "Chat with your AI Coach",
    description: "Ask anything in Korean — corrections, phrases, pronunciation.",
    href: "/chat",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
]

export function FirstRunBanner() {
  const dismissed = useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback)
      window.addEventListener(DISMISSED_EVENT, callback)
      return () => {
        window.removeEventListener("storage", callback)
        window.removeEventListener(DISMISSED_EVENT, callback)
      }
    },
    () => window.localStorage.getItem(DISMISSED_KEY) === "1",
    () => true
  )

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1")
    window.dispatchEvent(new Event(DISMISSED_EVENT))
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-sm"
        >
          {/* Dismiss */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss welcome banner"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={15} strokeWidth={2.5} />
          </button>

          <div className="mb-5 pr-8">
            <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600/70 dark:text-blue-400/70">
              Getting started
            </p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Welcome to Hengo 👋</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Three steps to get your first session running.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {STEPS.map(({ num, icon: Icon, title, description, href, color, bg }) => (
              <Link
                key={num}
                href={href}
                onClick={dismiss}
                className={cn(
                  "group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-blue-500/30 hover:shadow-sm active:scale-[0.98]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", bg, color)}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className={cn("text-[11px] font-bold uppercase tracking-wide", color)}>
                    Step {num}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground">{description}</p>
                </div>
                <div className={cn("mt-auto flex items-center gap-1 text-xs font-bold", color)}>
                  Go
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="mt-4 text-xs font-bold text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            I already know what I&apos;m doing — dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
