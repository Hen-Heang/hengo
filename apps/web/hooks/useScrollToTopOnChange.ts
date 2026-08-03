"use client"

import { useEffect } from "react"

/** Keeps state-driven multi-step screens from inheriting the previous step's scroll position. */
export function useScrollToTopOnChange(value: string) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [value])
}
