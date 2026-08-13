"use client"

import { useQuery } from "@tanstack/react-query"

import { integrationsApi } from "@/lib/api"

// Raw Google busy blocks for a range — see hooks/useAvailableFocusWindows.ts
// for how these combine with Hengo tasks. Never throws into the caller.
export function useGoogleCalendarFreeBusy({
  enabled,
  timeMin,
  timeMax,
}: {
  enabled: boolean
  timeMin: string
  timeMax: string
}) {
  const { data } = useQuery({
    queryKey: ["google-calendar-freebusy", timeMin, timeMax],
    queryFn: () => integrationsApi.getGoogleCalendarFreeBusy(timeMin, timeMax),
    enabled,
    retry: false,
  })

  return { busy: data ?? [] }
}
