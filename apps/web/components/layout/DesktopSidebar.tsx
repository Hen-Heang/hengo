"use client"

import Image from "next/image"
import Link from "next/link"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { NavIconRow, NavRow } from "@/components/layout/NavItem"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  isNavigationItemActive,
  primaryNavItems,
  todayItem,
  type NavSearchParams,
} from "@/lib/navigation"
import { cn } from "@/lib/utils"

import { ProfileMenu } from "./ProfileMenu"

export const SIDEBAR_EXPANDED_WIDTH = 232
export const SIDEBAR_COLLAPSED_WIDTH = 72

/**
 * V2's five-destination sidebar: Today, Vocabulary, Practice, Coach, Study —
 * `primaryNavItems` from `lib/navigation.ts`, flat, in order. No expandable
 * workspace groups, no flyouts — with only five destinations there is nothing
 * to collapse. Everything else the app still supports (Goals, Habits,
 * Recovery, Progress, Notes, Settings, general AI chat, …) stays a real,
 * registered route reachable by direct URL and the Quick Switcher; it simply
 * has no row here.
 */
export function DesktopSidebar({
  pathname,
  searchParams,
  collapsed,
  onToggleCollapsed,
}: {
  pathname: string
  searchParams: NavSearchParams
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
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
            <Image src="/hengo-icon.png" alt="" width={36} height={36} className="size-full" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight text-foreground">
                Hengo
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">
                Learn Korean.
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
          <TooltipContent side="right">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {primaryNavItems.map((item) => {
          const active = isNavigationItemActive({ pathname, searchParams, item })
          return collapsed ? (
            <NavIconRow key={item.id} item={item} active={active} />
          ) : (
            <NavRow key={item.id} item={item} active={active} />
          )
        })}
      </nav>

      {/* Account */}
      <div className="space-y-1 border-t border-border px-3 py-3">
        <ProfileMenu collapsed={collapsed} />
      </div>
    </aside>
  )
}
