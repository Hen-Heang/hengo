"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ListChecks } from "lucide-react"

import { cn } from "@/lib/utils"

const GROWTH_LINKS = [
  { href: "/growth/habits", label: "Habits", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: BarChart3 },
] as const

/**
 * Grow is intentionally small in the daily UI: Habits is where the user acts,
 * Progress is where they review. Recovery and Journal remain available by
 * direct route / Quick Switcher, but they no longer compete with the two
 * everyday actions here.
 */
export function GrowthTabs() {
  const pathname = usePathname()

  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1 lg:hidden">
      {GROWTH_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70",
              active
                ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20"
                : "text-muted-foreground/70 hover:text-foreground"
            )}
          >
            <Icon size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
