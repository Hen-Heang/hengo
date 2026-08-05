"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const TABS = [
  { href: "/goals/overview", label: "Overview" },
  { href: "/goals", label: "Goals" },
  { href: "/goals/tasks", label: "Tasks" },
  { href: "/goals/calendar", label: "Calendar" },
] as const

/**
 * Local tab nav for the Goals hub's four routes. Real links, not tab
 * triggers — same reasoning as GoalDetailNav: back button, middle-click and
 * a pasted URL all behave, and each tab is its own bookmarkable page.
 */
export function GoalsHubNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Goals sections" className="no-scrollbar -mx-1 overflow-x-auto px-1">
      <ul className="inline-flex min-w-full gap-1 rounded-lg bg-foreground/5 p-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
