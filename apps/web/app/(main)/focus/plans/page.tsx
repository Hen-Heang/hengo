"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FocusPlansRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery/plans")
  }, [router])

  return null
}
