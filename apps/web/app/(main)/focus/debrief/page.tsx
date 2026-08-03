"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FocusDebriefRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery/debrief")
  }, [router])

  return null
}
