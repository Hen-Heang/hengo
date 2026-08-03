"use client"

import { useId } from "react"

import { NavRow } from "@/components/layout/NavItem"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  isNavigationItemActive,
  shippedItems,
  type NavSearchParams,
  type NavSection,
} from "@/lib/navigation"
import { cn } from "@/lib/utils"

/**
 * Tablet rail flyout: a Radix popover listing a section's child routes.
 * Radix gives us the accessibility contract for free — Escape closes, outside
 * click closes, focus moves into the panel and returns to the trigger on close.
 * We close it explicitly after a navigation.
 */
export function WorkspaceFlyout({
  section,
  pathname,
  searchParams,
  open,
  onOpenChange,
  active,
}: {
  section: NavSection
  pathname: string
  searchParams: NavSearchParams
  open: boolean
  onOpenChange: (open: boolean) => void
  active: boolean
}) {
  const labelId = useId()
  const items = shippedItems(section.items)
  const soonItems = section.items.filter((i) => i.soon)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${section.label} navigation`}
          aria-expanded={open}
          className={cn(
            "relative flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-lg py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            active || open
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          {active && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
            />
          )}
          <section.icon size={20} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
          <span className={cn("max-w-full truncate px-1 text-[10px] leading-none", active && "font-semibold")}>
            {section.label}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        aria-labelledby={labelId}
        className="w-60 rounded-xl p-1.5"
      >
        <p id={labelId} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {section.label}
        </p>
        <nav aria-label={section.label} className="space-y-0.5">
          {items.map((item) => (
            <NavRow
              key={item.id}
              item={item}
              variant="flyout"
              active={isNavigationItemActive({ pathname, searchParams, item })}
              onNavigate={() => onOpenChange(false)}
            />
          ))}
        </nav>
        {soonItems.length > 0 && (
          <p className="px-3 pb-1 pt-2 text-[11px] text-muted-foreground/60">
            Coming soon: {soonItems.map((i) => i.label).join(", ")}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
