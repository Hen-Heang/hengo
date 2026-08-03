"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FocusPauseRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery/pause")
  }, [router])

  return null
}
