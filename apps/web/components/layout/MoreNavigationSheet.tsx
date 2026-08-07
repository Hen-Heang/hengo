"use client"

import Link from "next/link"
import { BrainCircuit, ChevronRight } from "lucide-react"

import { NavRow } from "@/components/layout/NavItem"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  askHengoItem,
  isNavigationItemActive,
  moreComingSoon,
  moreGroups,
  type NavSearchParams,
} from "@/lib/navigation"

/**
 * Mobile "More" sheet. "Ask Hengo" sits at the top as a pinned card — the
 * global AI action's mobile home (see the note on `askHengoItem` in
 * lib/navigation.ts) — followed by a labelled "Memory" group (Notes,
 * Memories) and a flat menu (Recovery, History, Settings). Today/Learn/Goals/
 * Progress are already bottom tabs, so they aren't repeated here — see
 * `moreGroups`. No separate "Account" row — `/account` is just a legacy
 * alias for the Settings page, not a distinct destination. Coming Soon
 * features get a single muted line at the bottom rather than a grid of dead
 * tiles.
 */
export function MoreNavigationSheet({
  open,
  onOpenChange,
  pathname,
  searchParams,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pathname: string
  searchParams: NavSearchParams
}) {
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-lg pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="pb-1">
          <SheetTitle>More</SheetTitle>
          <SheetDescription className="sr-only">
            Everything not in the bottom navigation bar.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {/* Ask Hengo card — the global AI action's mobile home */}
          <Link
            href={askHengoItem.href}
            onClick={close}
            aria-current={
              isNavigationItemActive({ pathname, searchParams, item: askHengoItem }) ? "page" : undefined
            }
            className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-accent/40 px-4 py-3.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BrainCircuit size={20} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-foreground">Ask Hengo</span>
              <span className="block truncate text-xs text-muted-foreground">{askHengoItem.description}</span>
            </span>
            <ChevronRight size={18} aria-hidden className="shrink-0 text-muted-foreground" />
          </Link>

          {moreGroups.map((group) => (
            <section key={group.id} aria-labelledby={group.label ? `more-${group.id}` : undefined} className="pt-4">
              {group.label && (
                <h3
                  id={`more-${group.id}`}
                  className="px-1 pb-1.5 text-sm font-semibold text-muted-foreground"
                >
                  {group.label}
                </h3>
              )}
              <nav aria-label={group.label || "More"} className="space-y-0.5">
                {group.items.map((item) => (
                  <NavRow
                    key={item.id}
                    item={item}
                    variant="list"
                    active={isNavigationItemActive({ pathname, searchParams, item })}
                    onNavigate={close}
                    trailing={<ChevronRight size={16} aria-hidden className="shrink-0 opacity-40" />}
                  />
                ))}
              </nav>
            </section>
          ))}

          {moreComingSoon.length > 0 && (
            <p className="px-1 pt-5 text-xs text-muted-foreground/70">
              Coming soon: {moreComingSoon.map((i) => i.label).join(" · ")}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
