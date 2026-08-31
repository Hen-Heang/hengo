"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarRange, Moon, Sunrise } from "lucide-react"

import { cn } from "@/lib/utils"

// Unlike GrowthTabs (hidden on desktop, since the sidebar already lists
// Habits/Recovery as separate top-level items), Morning/Evening/Weekly are
// NOT separate nav entries — this is the only way to switch between them at
// any screen size, so it's always visible.
const REVIEW_LINKS = [
  { href: "/review/morning", label: "Morning", icon: Sunrise },
  { href: "/review/evening", label: "Evening", icon: Moon },
  { href: "/review/weekly", label: "Weekly", icon: CalendarRange },
]

export function ReviewTabs() {
  const pathname = usePathname()

  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
      {REVIEW_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70",
              active
                ? "bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
                : "text-muted-foreground/70 hover:text-foreground",
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
