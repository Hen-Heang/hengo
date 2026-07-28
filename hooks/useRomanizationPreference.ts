"use client"

import { useQuery } from "@tanstack/react-query"

import { koreanCoachApi } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"
import type { RomanizationMode } from "@/lib/korean-coach/schemas"

/**
 * The learner's romanization display choice, read from the single source of
 * truth: `kori_korean_coach_preferences.romanization_mode` (set in
 * /korean-coach/preferences). Phrasebook and the daily study plan both read
 * through here so there is exactly one romanization setting in the app —
 * an earlier `kori_profiles.romanization_preference` column duplicated this
 * and is no longer read by anything.
 */
export function useRomanizationPreference(): RomanizationMode {
  const userId = getUserId()
  const { data } = useQuery({
    queryKey: ["korean-coach-preferences", userId],
    queryFn: () => koreanCoachApi.getPreferences(),
    enabled: userId != null,
    staleTime: 60_000,
  })
  return data?.romanizationMode ?? "on-request"
}
