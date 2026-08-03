"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FocusLogRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery/log")
  }, [router])

  return null
}
