"use client"

import { useEffect, useRef } from "react"

import { progressApi } from "@/lib/api"
import type { ActivityFeature } from "@/hooks/useLogActivity"

// Cap at 2 hours — anything longer is likely a forgotten open tab
const MAX_DURATION_MS = 2 * 60 * 60 * 1000

/**
 * Tracks time spent on a page and POSTs it to /activity/log when the
 * component unmounts (i.e., the user navigates away). Min 5 s to avoid
 * logging accidental visits.
 *
 * @param feature  Canonical feature label (shared with useLogActivity)
 */
export function useSessionTimer(feature: ActivityFeature) {
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    return () => {
      const durationMs = Math.min(Date.now() - startRef.current, MAX_DURATION_MS)
      if (durationMs < 5_000) return
      // Fire-and-forget — duration logging is best-effort
      progressApi.logDuration(feature, durationMs).catch(() => undefined)
    }
    // feature is stable (passed as a literal string at call site)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
