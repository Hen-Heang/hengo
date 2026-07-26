"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Zap } from "lucide-react"

import { QuickSwitcher } from "@/components/app/quick-switcher"
import { QuickCaptureDialog } from "@/components/inbox/QuickCaptureDialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useMobileKeyboard } from "@/hooks/useMobileKeyboard"
import { useNavigationMode } from "@/hooks/useNavigationMode"
import { useSidebarState } from "@/hooks/useSidebarState"
import { getActiveNavItem, getSectionForPath } from "@/lib/navigation"
import { recordRecentNavId } from "@/lib/last-visited"
import { openQuickCapture } from "@/lib/quick-capture-bus"
import { cn } from "@/lib/utils"

import { DesktopHeader } from "./DesktopHeader"
import { DesktopSidebar, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from "./DesktopSidebar"
import { MobileBottomNav } from "./MobileBottomNav"
import { MobileHeader } from "./MobileHeader"
import { MobileHeaderTitleProvider } from "./mobile-header-title"
import { MoreNavigationSheet } from "./MoreNavigationSheet"
import { RAIL_WIDTH, TabletNavigationRail } from "./TabletNavigationRail"

/**
 * `useSearchParams()` must sit under a Suspense boundary or Next fails the
 * production build. Each nav surface gets its own boundary so page content
 * never falls into a client-only hole.
 */
function NavSuspense({ fallback = null, children }: { fallback?: React.ReactNode; children: React.ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

function useNavLocation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return { pathname, searchParams }
}

// ─── Chrome pieces (each reads the query, so each is its own boundary) ────────

function SidebarChrome({ collapsed, onToggleCollapsed }: { collapsed: boolean; onToggleCollapsed: () => void }) {
  const { pathname, searchParams } = useNavLocation()
  return (
    <DesktopSidebar
      pathname={pathname}
      searchParams={searchParams}
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
      activeSectionId={getSectionForPath(pathname, searchParams)?.id}
    />
  )
}

function RailChrome() {
  const { pathname, searchParams } = useNavLocation()
  return (
    <TabletNavigationRail
      pathname={pathname}
      searchParams={searchParams}
      activeSectionId={getSectionForPath(pathname, searchParams)?.id}
    />
  )
}

function DesktopHeaderChrome() {
  const { pathname, searchParams } = useNavLocation()
  return <DesktopHeader pathname={pathname} searchParams={searchParams} />
}

function MobileHeaderChrome({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { pathname, searchParams } = useNavLocation()
  return <MobileHeader pathname={pathname} searchParams={searchParams} onOpenSearch={onOpenSearch} />
}

function BottomNavChrome({ onOpenMore, moreOpen }: { onOpenMore: () => void; moreOpen: boolean }) {
  const { pathname, searchParams } = useNavLocation()
  return (
    <MobileBottomNav
      pathname={pathname}
      searchParams={searchParams}
      onOpenMore={onOpenMore}
      moreOpen={moreOpen}
    />
  )
}

function MoreSheetChrome({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pathname, searchParams } = useNavLocation()
  return (
    <MoreNavigationSheet
      open={open}
      onOpenChange={onOpenChange}
      pathname={pathname}
      searchParams={searchParams}
    />
  )
}

/** Records the current destination for the Quick Switcher's Recent group. */
function RecentTracker() {
  const { pathname, searchParams } = useNavLocation()
  const item = getActiveNavItem(pathname, searchParams)
  const id = item?.id

  useEffect(() => {
    if (id) recordRecentNavId(id)
  }, [id])

  return null
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const mode = useNavigationMode()
  const isKeyboardOpen = useMobileKeyboard()
  const { collapsed, toggle } = useSidebarState()
  // The More sheet is pinned to the route it was opened on, so navigating
  // closes it by derivation — no effect, no stale-open sheet after a back swipe.
  const [more, setMore] = useState<{ open: boolean; route: string }>({ open: false, route: pathname })
  const moreOpen = more.open && more.route === pathname
  const setMoreOpen = useCallback(
    (open: boolean) => setMore({ open, route: pathname }),
    [pathname]
  )
  const [searchOpen, setSearchOpen] = useState(false)

  const isMobile = mode === "mobile"

  // Immersive routes. `/chat` keeps the compact mobile header so there is
  // always a visible way back; `/growth/recovery/pause` is fully immersive by
  // design — navigation must never overlay the breathing timer.
  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/")
  const isHomeRoute = pathname === "/home"
  // `/growth/recovery/pause` is a server redirect to `/growth/recovery/urge`,
  // which is the screen that actually renders the guided pause as a fixed
  // full-screen overlay. Both are listed so no navigation is ever drawn over
  // the pause timer, whichever URL the user arrives on.
  const isPauseRoute = pathname === "/growth/recovery/pause" || pathname === "/growth/recovery/urge"
  const fullBleed = isHomeRoute || isChatRoute || isPauseRoute

  // Chat renders its own compact top bar (mode switcher + a "Back to home"
  // button), so the shell header would be a second one — but the escape route
  // is still always visible, which is what matters.
  const showMobileHeader = isMobile && !isHomeRoute && !isPauseRoute && !isChatRoute
  // Unmounted (not just hidden) when the keyboard is up, so nothing inside
  // stays focusable behind the keyboard.
  const showBottomNav = isMobile && !isHomeRoute && !isPauseRoute && !isChatRoute && !isKeyboardOpen

  return (
    <TooltipProvider delayDuration={200}>
      <MobileHeaderTitleProvider>
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>

        <NavSuspense>
          <RecentTracker />
        </NavSuspense>

        <div className="flex min-h-[100dvh] bg-background">
          {mode === "desktop" && !isHomeRoute && !isPauseRoute && (
            <NavSuspense
              fallback={
                <div
                  aria-hidden
                  style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
                  className="shrink-0 border-r border-border bg-sidebar"
                />
              }
            >
              <SidebarChrome collapsed={collapsed} onToggleCollapsed={toggle} />
            </NavSuspense>
          )}

          {mode === "tablet" && !isHomeRoute && !isPauseRoute && (
            <NavSuspense
              fallback={
                <div
                  aria-hidden
                  style={{ width: RAIL_WIDTH }}
                  className="shrink-0 border-r border-border bg-sidebar"
                />
              }
            >
              <RailChrome />
            </NavSuspense>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {!isMobile && !isHomeRoute && !isPauseRoute && (
              <NavSuspense fallback={<div aria-hidden className="h-[57px] border-b border-border" />}>
                <DesktopHeaderChrome />
              </NavSuspense>
            )}

            {showMobileHeader && (
              <NavSuspense fallback={<div aria-hidden className="h-[52px] border-b border-border" />}>
                <MobileHeaderChrome onOpenSearch={() => setSearchOpen(true)} />
              </NavSuspense>
            )}

            <main
              id="main-content"
              tabIndex={-1}
              className={cn(
                "flex-1 overflow-x-hidden outline-none",
                fullBleed ? "p-0" : "px-4 pt-5 sm:px-6 lg:px-8",
                !fullBleed &&
                  (showBottomNav
                    ? "pb-[calc(9rem+env(safe-area-inset-bottom))]"
                    : "pb-10")
              )}
            >
              <div className={cn("mx-auto w-full", fullBleed ? "h-full max-w-none" : "max-w-6xl")}>
                {children}
              </div>
            </main>
          </div>
        </div>

        {showBottomNav && (
          <NavSuspense>
            <BottomNavChrome onOpenMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
          </NavSuspense>
        )}

        <NavSuspense>
          <MoreSheetChrome open={moreOpen} onOpenChange={setMoreOpen} />
        </NavSuspense>

        {/* Mobile has no header slot for the switcher's own button, so it gets
            a triggerless instance driven by the header's Search action. Only
            one QuickSwitcher is mounted at a time (the desktop header owns the
            other), so the ⌘K / "/" shortcuts never open two dialogs. */}
        {isMobile && <QuickSwitcher hideTrigger open={searchOpen} onOpenChange={setSearchOpen} />}

        {/* Mobile has no header slot for a Quick Capture button (root pages
            already show Search + notifications), so it gets a floating action
            button instead — above the bottom nav, hidden with it when the
            keyboard is up or on immersive routes. Desktop's entry point is the
            header's Capture button (DesktopHeader.tsx). */}
        {isMobile && showBottomNav && (
          <button
            type="button"
            onClick={() => openQuickCapture()}
            aria-label="Quick capture"
            className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <Zap size={22} strokeWidth={2.25} />
          </button>
        )}

        {/* Single shared instance — every entry point (⌘K action, desktop
            header button, mobile FAB) just dispatches the open event. */}
        <QuickCaptureDialog />
      </MobileHeaderTitleProvider>
    </TooltipProvider>
  )
}
