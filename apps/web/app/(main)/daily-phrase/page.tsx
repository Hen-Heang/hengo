"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Daily Phrase is merged into the Today page — keep this route so old links
// and bookmarks still land somewhere useful.
export default function DailyPhraseRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/practice")
  }, [router])

  return null
}
