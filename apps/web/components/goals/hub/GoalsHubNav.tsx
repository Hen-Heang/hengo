"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const TABS = [
  { href: "/goals/calendar", label: "Calendar" },
  { href: "/goals/tasks", label: "Tasks" },
  { href: "/goals", label: "Goals" },
  { href: "/goals/overview", label: "Overview" },
] as const

/**
 * Local tab nav for the Goals hub's four routes. The order mirrors the daily
 * workflow: schedule time first, manage the task list, then adjust goals and
 * review the broader overview. Real links keep back button, middle-click and
 * pasted URLs working normally.
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
                    : "text-muted-foreground hover:text-foreground"
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
