"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { integrationsApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

export function useGoogleCalendarIntegration() {
  const queryClient = useQueryClient()
  const { data, error, isLoading } = useQuery({
    queryKey: ["google-calendar-integration"],
    queryFn: () => integrationsApi.getGoogleCalendarStatus(),
    enabled: getUserId() != null,
  })

  const status = data ?? { connected: false, accountEmail: null, lastSyncedAt: null }

  const disconnect = useCallback(async () => {
    await integrationsApi.disconnectGoogleCalendar()
    await queryClient.invalidateQueries({ queryKey: ["google-calendar-integration"] })
    // Drop cached Google data outright rather than invalidating — a stale
    // "connected" fetch racing the disconnect must not repopulate these.
    queryClient.removeQueries({ queryKey: ["google-calendar-events"] })
    queryClient.removeQueries({ queryKey: ["google-calendar-freebusy"] })
  }, [queryClient])

  return {
    ...status,
    error,
    isLoading,
    connect: integrationsApi.connectGoogleCalendar,
    disconnect,
  }
}
