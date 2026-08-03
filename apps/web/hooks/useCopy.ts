"use client"

import { useState } from "react"

// Clipboard copy with a transient "copied" flag, keyed so lists can show
// feedback on the row that was copied.
export function useCopy(resetMs = 1500) {
  const [copied, setCopied] = useState<number | null>(null)

  async function copy(text: string, key = 0) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), resetMs)
    } catch {
      /* clipboard unavailable */
    }
  }

  return { copied, copy }
}
