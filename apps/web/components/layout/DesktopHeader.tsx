"use client"

import Link from "next/link"
import { BrainCircuit, Zap } from "lucide-react"

import { QuickSwitcher } from "@/components/app/quick-switcher"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { Button } from "@/components/ui/button"
import {
  askHengoItem,
  getActiveNavItem,
  getSectionForPath,
  type NavSearchParams,
} from "@/lib/navigation"
import { openQuickCapture } from "@/lib/quick-capture-bus"

import { BreadcrumbTrail } from "./PageHeader"
import { ProfileMenu } from "./ProfileMenu"

/**
 * Sticky top bar for tablet + desktop. No Hengo branding (the sidebar/rail
 * owns that) and no LevelBadge (level lives on Today / Progress / Profile now,
 * and having it here refetched the achievements summary on every route change).
 */
export function DesktopHeader({
  pathname,
  searchParams,
}: {
  pathname: string
  searchParams: NavSearchParams
}) {
  const section = getSectionForPath(pathname, searchParams)
  const item = getActiveNavItem(pathname, searchParams)
  const title = item?.label ?? section?.label ?? "Hengo"

  // Don't repeat the title as its own parent crumb (e.g. Today, or a section
  // whose landing route is the item itself).
  const crumbs =
    section && section.label !== title ? [{ label: section.label, href: section.href }] : []

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-6 py-3 backdrop-blur-sm">
      <div className="min-w-0">
        {crumbs.length > 0 && <BreadcrumbTrail items={crumbs} />}
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{title}</h1>
        {item?.description && (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openQuickCapture()}
          className="h-9 gap-1.5 rounded-lg px-3"
        >
          <Zap size={15} />
          Capture
        </Button>
        {/* The one global AI entry point — see the note on `askHengoItem` in
            lib/navigation.ts. Lands on /chat's "My Data" mode; no new chat
            surface. */}
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg px-3">
          <Link href={askHengoItem.href}>
            <BrainCircuit size={15} />
            Ask Hengo
          </Link>
        </Button>
        <QuickSwitcher />
        <NotificationBell />
        <ProfileMenu collapsed side="bottom" align="end" className="size-11" />
      </div>
    </header>
  )
}
