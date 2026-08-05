"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Dashboard's content (Today's tasks, upcoming deadlines, goals snapshot,
// roadmap teaser) moved into the Goals workspace as its Overview tab — it was
// a competing top-level destination duplicating what /goals already owned.
// Kept as a redirect stub so old bookmarks/links still land somewhere useful.
export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/goals/overview")
  }, [router])

  return null
}
