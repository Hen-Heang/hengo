"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { isLinkActive, navSections, visibleSidebarItems } from "@/lib/navigation"

const growthLinks = visibleSidebarItems(navSections.find((s) => s.id === "grow")!)

// Segmented switcher between the Grow workspace's visible features
// (Recovery / Reflections / Progress — Habits is reachable from inside
// Recovery's dashboard, see the "grow" section note in lib/navigation.ts).
// Rendered at the top of each feature's root page. Grow has no bottom tab of
// its own now (reached via the mobile More sheet instead), so this is the
// only way to move between its features without going back through More;
// desktop already has the sidebar, so it's hidden there.
export function GrowthTabs() {
  const pathname = usePathname()

  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1 lg:hidden">
      {growthLinks.map(({ href, label, icon: Icon }) => {
        const active = isLinkActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/70",
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
