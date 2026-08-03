"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface GoalNavItem {
  href: string
  label: string
  /** Badge count, e.g. the open task count on Tasks. */
  count?: number
}

/**
 * The goal's five routes. Real links, not tab triggers — so the back button,
 * middle-click and a pasted URL all behave.
 */
export function GoalDetailNav({ items }: { items: GoalNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Goal sections" className="no-scrollbar -mx-1 overflow-x-auto px-1">
      <ul className="inline-flex min-w-full gap-1 rounded-xl bg-foreground/5 p-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {item.count != null && item.count > 0 && (
                  <span className="tabular-nums opacity-70">{item.count}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
