"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { NavIconRow } from "@/components/layout/NavItem"
import {
  isNavigationItemActive,
  secondaryNavItems,
  todayItem,
  visibleSidebarItems,
  workspaceNavSections,
  type NavItem,
  type NavSearchParams,
} from "@/lib/navigation"

import { ProfileMenu } from "./ProfileMenu"
import { WorkspaceFlyout } from "./WorkspaceFlyout"

export const RAIL_WIDTH = 80

const railSections = workspaceNavSections

/**
 * 768–1199px navigation. Compact icon rail; sections with child routes open an
 * accessible flyout instead of forcing a full sidebar into a narrow viewport.
 * The mobile bottom bar is never used at these widths.
 */
export function TabletNavigationRail({
  pathname,
  searchParams,
  activeSectionId,
}: {
  pathname: string
  searchParams: NavSearchParams
  activeSectionId?: string
}) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)

  return (
    <aside
      aria-label="Main navigation"
      style={{ width: RAIL_WIDTH }}
      className="sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-sidebar"
    >
      <div className="flex justify-center px-2 py-4">
        <Link
          href={todayItem.href}
          aria-label="Hengo home"
          className="flex size-11 items-center justify-center overflow-hidden rounded-lg outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image src="/hengo-icon.svg" alt="" width={44} height={44} className="size-full" />
        </Link>
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        <NavIconRow
          item={todayItem}
          showLabel
          active={isNavigationItemActive({ pathname, searchParams, item: todayItem })}
        />

        {railSections.map((section) => {
          const sectionActive = section.id === activeSectionId

          // A section with nothing left to show individually is a plain
          // icon link, not a flyout trigger with an empty panel. None of the
          // current primary sections hit this today, but Learn (rendered
          // separately, below, via `secondaryNavItems`, alongside the
          // account menu) is the shape this guards against.
          if (visibleSidebarItems(section).length === 0) {
            const flatItem: NavItem = {
              id: `section-${section.id}`,
              href: section.href,
              label: section.label,
              icon: section.icon,
              color: section.color,
            }
            return <NavIconRow key={section.id} item={flatItem} showLabel active={sectionActive} />
          }

          return (
            <WorkspaceFlyout
              key={section.id}
              section={section}
              pathname={pathname}
              searchParams={searchParams}
              active={sectionActive}
              open={openSectionId === section.id}
              onOpenChange={(open) => setOpenSectionId(open ? section.id : null)}
            />
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-border px-2 py-3">
        {secondaryNavItems.map((item) => {
          const active =
            item.id === "learn-hub" ? activeSectionId === "learn" : isNavigationItemActive({ pathname, searchParams, item })
          return <NavIconRow key={item.id} item={item} showLabel active={active} />
        })}
        <ProfileMenu collapsed side="right" />
      </div>
    </aside>
  )
}
