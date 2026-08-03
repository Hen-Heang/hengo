"use client"

import { useEffect, useState } from "react"

// Explicit navigation breakpoints. Tailwind's `lg` (1024px) is the wrong
// boundary in both directions here: a 768x1024 tablet would get the mobile
// bottom bar, and a 1024px-wide window would get the full 280px sidebar with
// almost no room left for content. The shell switches chrome on these instead.
export const TABLET_MIN_WIDTH = 768
export const DESKTOP_MIN_WIDTH = 1200

export type NavigationMode = "mobile" | "tablet" | "desktop"

export function navigationModeForWidth(width: number): NavigationMode {
  if (width >= DESKTOP_MIN_WIDTH) return "desktop"
  if (width >= TABLET_MIN_WIDTH) return "tablet"
  return "mobile"
}

/**
 * Which navigation chrome the current viewport should render. Resolves after
 * mount; the app shell already gates on a mount check, so callers never paint
 * with the placeholder value.
 */
export function useNavigationMode(): NavigationMode {
  // Lazy initializer, not a hardcoded default: the app shell only mounts on
  // the client (behind the layout's auth/mount gate), so the correct mode is
  // known before first paint and a mobile device never flashes desktop chrome.
  const [mode, setMode] = useState<NavigationMode>(() =>
    typeof window === "undefined" ? "desktop" : navigationModeForWidth(window.innerWidth)
  )

  useEffect(() => {
    const tablet = window.matchMedia(`(min-width: ${TABLET_MIN_WIDTH}px)`)
    const desktop = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)

    function update() {
      setMode(navigationModeForWidth(window.innerWidth))
    }

    update()
    tablet.addEventListener("change", update)
    desktop.addEventListener("change", update)
    return () => {
      tablet.removeEventListener("change", update)
      desktop.removeEventListener("change", update)
    }
  }, [])

  return mode
}
