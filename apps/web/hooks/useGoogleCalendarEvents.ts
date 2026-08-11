"use client"

import { useQuery } from "@tanstack/react-query"

import { integrationsApi } from "@/lib/api"

// Read-only Google Calendar events for a visible date range in the Planner.
// Deliberately never throws into the caller — a disconnected/expired Google
// grant should just mean "no Google events shown", not a broken calendar.
export function useGoogleCalendarEvents({
  enabled,
  timeMin,
  timeMax,
}: {
  enabled: boolean
  timeMin: string
  timeMax: string
}) {
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ["google-calendar-events", timeMin, timeMax],
    queryFn: () => integrationsApi.getGoogleCalendarEvents(timeMin, timeMax),
    enabled,
    retry: false,
  })

  return { events: data?.events ?? [], error, isLoading, isFetching }
}
