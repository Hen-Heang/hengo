"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Mistake review is merged into AI Coach as a "Corrections" tab — mistakes
// are generated from chat, so it belongs there rather than as its own page.
export default function MistakesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/chat?mode=corrections")
  }, [router])

  return null
}
