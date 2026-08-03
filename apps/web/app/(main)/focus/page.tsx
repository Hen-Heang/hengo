"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Recovery moved from /focus to /growth/recovery when the Growth workspace
// was introduced ("Focus" now names the separate Deep Work/Pomodoro
// feature). Kept as a redirect stub so old bookmarks/PWA shortcuts still work.
export default function FocusRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery")
  }, [router])

  return null
}
