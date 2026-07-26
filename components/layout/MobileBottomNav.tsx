"use client"

import Link from "next/link"
import { Menu } from "lucide-react"

import { bottomTabs, getActiveBottomTabIndex, type NavSearchParams } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const TAB =
  "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"

/**
 * Five mobile destinations: Today, Learn, Goals, Growth, More. A stable
 * elevated bottom surface — one border, one shadow, no glass container, no
 * sliding pill, no per-icon scaling.
 *
 * When the soft keyboard is open the whole element is unmounted by `AppShell`
 * rather than hidden, so nothing inside stays in the tab order.
 */
export function MobileBottomNav({
  pathname,
  searchParams,
  onOpenMore,
  moreOpen,
}: {
  pathname: string
  searchParams: NavSearchParams
  onOpenMore: () => void
  moreOpen: boolean
}) {
  const activeIndex = getActiveBottomTabIndex(pathname, searchParams)

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.05)]"
    >
      <ul className="mx-auto flex max-w-lg items-stretch gap-0.5 px-2 py-1.5">
        {bottomTabs.map((item, index) => {
          const active = index === activeIndex
          const Icon = item.icon
          return (
            <li key={item.id} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(TAB, active ? "text-primary" : "text-muted-foreground")}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 2} aria-hidden className="shrink-0" />
                <span
                  className={cn(
                    "w-full truncate px-0.5 text-center text-xs leading-none",
                    active ? "font-semibold" : "font-medium"
                  )}
                >
                  {item.shortLabel ?? item.label}
                </span>
              </Link>
            </li>
          )
        })}

        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMore}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              TAB,
              activeIndex === bottomTabs.length ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu
              size={21}
              strokeWidth={activeIndex === bottomTabs.length ? 2.4 : 2}
              aria-hidden
              className="shrink-0"
            />
            <span
              className={cn(
                "w-full truncate px-0.5 text-center text-xs leading-none",
                activeIndex === bottomTabs.length ? "font-semibold" : "font-medium"
              )}
            >
              More
            </span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
