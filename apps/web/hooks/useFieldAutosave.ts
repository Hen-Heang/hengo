"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type FieldSaveState = "idle" | "saving" | "saved" | "error"

/** How long a per-field "Saved" tick stays up before fading back to idle. */
export const SAVED_VISIBLE_MS = 2000

/** Text inputs fire on every keystroke; selects and switches don't. */
export const TEXT_DEBOUNCE_MS = 700

/**
 * Per-field autosave with a visible result for each field.
 *
 * Settings pages here are shallow — a handful of independent values, no
 * cross-field validation — so a page-level "Save changes" button buys nothing
 * except the chance to lose an edit by navigating away. What it did buy was
 * feedback, and autosave without feedback is worse than either: the learner
 * cannot tell whether the change took. So the confirmation is per field, next
 * to the control that changed.
 *
 * Each field is tracked independently: a slow save on one never blanks the
 * tick on another, and a failure is reported on the field that failed.
 */
export function useFieldAutosave() {
  const [states, setStates] = useState<Record<string, FieldSaveState>>({})
  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const resetTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  // Only the newest save for a field may write that field's final state, so a
  // slow earlier request can't overwrite a newer one's result.
  const generation = useRef(new Map<string, number>())
  const mounted = useRef(true)

  useEffect(() => {
    const debounces = debounceTimers.current
    const resets = resetTimers.current
    return () => {
      mounted.current = false
      debounces.forEach(clearTimeout)
      resets.forEach(clearTimeout)
    }
  }, [])

  const run = useCallback(async (field: string, save: () => Promise<unknown>) => {
    const generationId = (generation.current.get(field) ?? 0) + 1
    generation.current.set(field, generationId)

    const isCurrent = () => mounted.current && generation.current.get(field) === generationId
    const settle = (state: FieldSaveState) => {
      if (!isCurrent()) return
      setStates((current) => ({ ...current, [field]: state }))
      clearTimeout(resetTimers.current.get(field))
      if (state !== "saved") return
      resetTimers.current.set(
        field,
        setTimeout(() => {
          if (!isCurrent()) return
          setStates((current) => ({ ...current, [field]: "idle" }))
        }, SAVED_VISIBLE_MS),
      )
    }

    setStates((current) => ({ ...current, [field]: "saving" }))
    try {
      await save()
      settle("saved")
      return true
    } catch {
      settle("error")
      return false
    }
  }, [])

  /** Save `field`. Pass `debounceMs` for controls that fire per keystroke. */
  const saveField = useCallback(
    (field: string, save: () => Promise<unknown>, debounceMs = 0) => {
      clearTimeout(debounceTimers.current.get(field))
      if (debounceMs <= 0) {
        void run(field, save)
        return
      }
      debounceTimers.current.set(
        field,
        setTimeout(() => void run(field, save), debounceMs),
      )
    },
    [run],
  )

  const stateOf = useCallback(
    (field: string): FieldSaveState => states[field] ?? "idle",
    [states],
  )

  return { saveField, stateOf }
}
