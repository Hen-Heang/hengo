"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FocusTriggersRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery/triggers")
  }, [router])

  return null
}
