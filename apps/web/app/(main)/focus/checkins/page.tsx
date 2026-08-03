"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FocusCheckinsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/growth/recovery/checkins")
  }, [router])

  return null
}
