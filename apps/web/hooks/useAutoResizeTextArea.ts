"use client"

import { useLayoutEffect, type RefObject } from "react"

// Grows a textarea to fit its content between minRows and maxRows.
// Ported from Orbit's useAutoResizeTextArea.
export function useAutoResizeTextArea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  { minRows = 1, maxRows = 6 }: { minRows?: number; maxRows?: number } = {}
) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const style = window.getComputedStyle(el)
    const lineHeight = parseFloat(style.lineHeight) || 20
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    const borderY = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)

    el.style.height = "auto"
    const contentHeight = el.scrollHeight - paddingY
    const rows = Math.max(minRows, Math.min(maxRows, Math.round(contentHeight / lineHeight)))
    el.style.height = `${rows * lineHeight + paddingY + borderY}px`
  }, [ref, value, minRows, maxRows])
}
