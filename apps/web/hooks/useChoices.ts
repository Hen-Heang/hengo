"use client"

import { useEffect, useState } from "react"

// These option lists (listening topics, message-generator categories) are static
// backend constants, so cache the first successful result for the whole session
// keyed by the fetcher reference (a stable singleton method). Subsequent mounts
// then render instantly and skip the network round-trip entirely.
const choicesCache = new Map<() => Promise<string[]>, string[]>()

function pickSelected(opts: string[], initialSelected?: string) {
  return initialSelected && opts.includes(initialSelected) ? initialSelected : opts[0]
}

// Fetches a list of options from the backend, keeping a hardcoded fallback
// (and its first entry selected) until real data arrives. An optional
// `initialSelected` (e.g. a suggestion deep-linked from the Practice Hub)
// is preferred over the first entry when it's present in the option list.
export function useChoices(
  fetcher: () => Promise<string[]>,
  fallback: string[],
  initialSelected?: string
) {
  const cached = choicesCache.get(fetcher)
  const initialOptions = cached ?? fallback
  const [options, setOptions] = useState<string[]>(initialOptions)
  const [selected, setSelected] = useState<string>(() => pickSelected(initialOptions, initialSelected))

  useEffect(() => {
    // Already cached this session — no need to hit the backend again.
    if (choicesCache.has(fetcher)) return
    let active = true
    fetcher()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          choicesCache.set(fetcher, data)
          setOptions(data)
          setSelected(pickSelected(data, initialSelected))
        }
      })
      .catch(() => {
        /* keep fallback */
      })
    return () => {
      active = false
    }
  }, [fetcher])

  return { options, selected, setSelected }
}
