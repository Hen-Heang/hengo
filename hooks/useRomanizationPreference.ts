"use client"

import { useQuery } from "@tanstack/react-query"

import { userApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { RomanizationPreference } from "@/lib/types"

/** The user's Settings > Romanization choice, cached like the rest of the profile reads. */
export function useRomanizationPreference(): RomanizationPreference {
  const userId = getUserId()
  const { data } = useQuery({
    queryKey: ["romanization-preference", userId],
    queryFn: () => userApi.getById(userId as string),
    enabled: userId != null,
    staleTime: 60_000,
  })
  return data?.romanizationPreference ?? "always"
}
