"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreHorizontal, Search, Settings, User } from "lucide-react"

import { NotificationBell } from "@/components/notifications/NotificationBell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  allNavItems,
  getActiveNavItem,
  getSectionForPath,
  linkPath,
  type NavSearchParams,
} from "@/lib/navigation"

import { useMobileHeaderTitleValue } from "./mobile-header-title"

const ACTION_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"

/** A route is a "detail" view when it sits below a nav destination. */
export function isDetailRoute(pathname: string): boolean {
  return !allNavItems.some((item) => linkPath(item.href) === pathname)
}

/**
 * Contextual mobile header. Root pages get a title plus at most two actions;
 * detail pages get `Back | Title | ⋯`. Profile, Settings and level all moved
 * off this bar — they live in the More sheet now.
 */
export function MobileHeader({
  pathname,
  searchParams,
  onOpenSearch,
}: {
  pathname: string
  searchParams: NavSearchParams
  onOpenSearch: () => void
}) {
  const router = useRouter()
  const publishedTitle = useMobileHeaderTitleValue()
  const detail = isDetailRoute(pathname)

  const section = getSectionForPath(pathname, searchParams)
  const navLabel = getActiveNavItem(pathname, searchParams)?.label
  const title = publishedTitle ?? navLabel ?? section?.label ?? "Hengo"

  return (
    <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-border bg-background/95 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-sm">
      {detail && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className={ACTION_BUTTON}
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <h1
        className={`min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-foreground ${detail ? "" : "pl-2"}`}
      >
        {title}
      </h1>

      {detail ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="More actions" className={ACTION_BUTTON}>
              <MoreHorizontal size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48 rounded-xl">
            <DropdownMenuItem onClick={onOpenSearch} className="rounded-lg">
              <Search size={16} /> Search
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/account">
                <User size={16} /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/settings">
                <Settings size={16} /> Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <button type="button" onClick={onOpenSearch} aria-label="Search" className={ACTION_BUTTON}>
            <Search size={20} />
          </button>
          <NotificationBell />
        </>
      )}
    </header>
  )
}
