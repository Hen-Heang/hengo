"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { isLinkActive, navSections, shippedItems } from "@/lib/navigation"

const growthLinks = shippedItems(navSections.find((s) => s.id === "growth")!.items)

// Segmented switcher between the Growth workspace's shipped features
// (Habits / Recovery). Rendered at the top of each feature's root page so the
// mobile "Habits" bottom tab reaches all of Growth; desktop already has the
// sidebar, so it's hidden there.
export function GrowthTabs() {
  const pathname = usePathname()

  return (
    <div className="mb-4 flex gap-1 rounded-2xl border border-border bg-card p-1 lg:hidden">
      {growthLinks.map(({ href, label, icon: Icon }) => {
        const active = isLinkActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
              active
                ? "bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
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
