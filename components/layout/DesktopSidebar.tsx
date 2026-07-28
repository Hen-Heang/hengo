"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { NavIconRow, NavRow } from "@/components/layout/NavItem"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  aiCoachItem,
  askHengoItem,
  isNavigationItemActive,
  primarySections,
  settingsItem,
  shippedItems,
  todayItem,
  type NavSearchParams,
  type NavSectionId,
} from "@/lib/navigation"
import { cn } from "@/lib/utils"

import { ProfileMenu } from "./ProfileMenu"
import { WorkspaceFlyout } from "./WorkspaceFlyout"

export const SIDEBAR_EXPANDED_WIDTH = 272
export const SIDEBAR_COLLAPSED_WIDTH = 76

const AI_SECTION: NavSectionId = "ai"
const sidebarSections = primarySections.filter((section) => section.id !== AI_SECTION)

export function DesktopSidebar({
  pathname,
  searchParams,
  collapsed,
  onToggleCollapsed,
  activeSectionId,
}: {
  pathname: string
  searchParams: NavSearchParams
  collapsed: boolean
  onToggleCollapsed: () => void
  activeSectionId?: string
}) {
  // Track what the user explicitly *closed* rather than what's open, so the
  // section holding the current route is always expanded by derivation — it
  // can never be collapsed out from under the selected route, and no effect is
  // needed to reopen it on navigation.
  const [closedSections, setClosedSections] = useState<string[]>(() =>
    sidebarSections.filter((s) => s.id !== (activeSectionId ?? "learn")).map((s) => s.id)
  )
  const isSectionOpen = (id: string) => id === activeSectionId || !closedSections.includes(id)

  // Which collapsed-mode flyout is open — only one at a time, same as the
  // tablet rail.
  const [openFlyoutId, setOpenFlyoutId] = useState<string | null>(null)
  const aiActive = isNavigationItemActive({ pathname, searchParams, item: aiCoachItem })
  const askHengoActive = isNavigationItemActive({ pathname, searchParams, item: askHengoItem })

  return (
    <aside
      aria-label="Main navigation"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
      className="sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-sidebar"
    >
      {/* Brand + collapse toggle. Branding lives here only — never also in the
          top bar. */}
      <div className={cn("flex items-center gap-2 px-3 py-4", collapsed && "flex-col gap-3")}>
        <Link
          href={todayItem.href}
          aria-label="Hengo home"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border">
            <Image src="/hengo-icon.svg" alt="" width={36} height={36} className="size-full" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight text-foreground">Hengo</span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                Korean for developers
              </span>
            </span>
          )}
        </Link>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
        </Tooltip>
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {/* Today */}
        {collapsed ? (
          <NavIconRow
            item={todayItem}
            active={isNavigationItemActive({ pathname, searchParams, item: todayItem })}
          />
        ) : (
          <NavRow
            item={todayItem}
            active={isNavigationItemActive({ pathname, searchParams, item: todayItem })}
          />
        )}

        {/* Labelled, collapsible groups */}
        {sidebarSections.map((section) => {
          const items = shippedItems(section.items)
          const soonItems = section.items.filter((i) => i.soon)
          const open = isSectionOpen(section.id)
          const sectionActive = section.id === activeSectionId

          // Collapsed: one icon per group, opening the same accessible flyout
          // the tablet rail uses. Listing every child as a flat icon column
          // would overflow the rail and lose the grouping entirely.
          if (collapsed) {
            return (
              <WorkspaceFlyout
                key={section.id}
                section={section}
                pathname={pathname}
                searchParams={searchParams}
                active={sectionActive}
                open={openFlyoutId === section.id}
                onOpenChange={(next) => setOpenFlyoutId(next ? section.id : null)}
              />
            )
          }

          return (
            <Collapsible
              key={section.id}
              open={open}
              onOpenChange={(next) => {
                // Never let the group holding the current route close.
                if (!next && sectionActive) return
                setClosedSections((current) =>
                  next ? current.filter((id) => id !== section.id) : [...current, section.id]
                )
              }}
              className="pt-2"
            >
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  sectionActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <section.icon size={13} strokeWidth={2.4} className="shrink-0" />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown
                  size={14}
                  aria-hidden
                  className={cn("shrink-0 transition-transform", open && "rotate-180")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pt-1">
                {items.map((item) => (
                  <NavRow
                    key={item.id}
                    item={item}
                    active={isNavigationItemActive({ pathname, searchParams, item })}
                  />
                ))}
                {/* Coming Soon kept quiet — one muted line, not a block of rows. */}
                {soonItems.length > 0 && (
                  <p className="px-3 pt-1 text-[11px] text-muted-foreground/60">
                    Coming soon: {soonItems.map((i) => i.label).join(", ")}
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        <div className="pt-3">
          <div className="mb-2 h-px bg-border" />
          {collapsed ? (
            <>
              <NavIconRow item={aiCoachItem} active={aiActive} />
              <NavIconRow item={askHengoItem} active={askHengoActive} />
            </>
          ) : (
            <>
              <NavRow item={aiCoachItem} active={aiActive} />
              <NavRow item={askHengoItem} active={askHengoActive} />
            </>
          )}
        </div>
      </nav>

      {/* Account + Settings */}
      <div className="space-y-1 border-t border-border px-3 py-3">
        {collapsed ? (
          <>
            <ProfileMenu collapsed />
            <NavIconRow
              item={settingsItem}
              active={isNavigationItemActive({ pathname, searchParams, item: settingsItem })}
            />
          </>
        ) : (
          <>
            <ProfileMenu />
            <NavRow
              item={settingsItem}
              active={isNavigationItemActive({ pathname, searchParams, item: settingsItem })}
            />
          </>
        )}
      </div>
    </aside>
  )
}
