"use client"

import { useRef } from "react"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAutoResizeTextArea } from "@/hooks/useAutoResizeTextArea"

export function AutoResizingDescription({
  id,
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  minRows = 1,
  maxRows = 6,
}: {
  id: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  minRows?: number
  maxRows?: number
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useAutoResizeTextArea(ref, value, { minRows, maxRows })

  return (
    <Textarea
      id={id}
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={minRows}
      className={cn("resize-y leading-6 transition-[height] duration-150 ease-in-out", className)}
    />
  )
}
