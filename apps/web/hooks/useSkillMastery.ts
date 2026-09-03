"use client"

import { useQuery } from "@tanstack/react-query"

import { skillsApi, type SkillMastery } from "@/lib/api"
import { getUserId } from "@/lib/auth-store"

export const skillMasteryQueryKey = (userId?: string | null) => ["skill-mastery", userId] as const

/** Every skill's current mastery (`kori_skill_mastery`) — the same real
 *  evidence the daily mission engine already reads for weak-skill targeting. */
export function useSkillMastery() {
  const userId = getUserId()

  const { data, isPending, isError } = useQuery({
    queryKey: skillMasteryQueryKey(userId),
    queryFn: (): Promise<SkillMastery[]> => skillsApi.getMastery(),
    enabled: userId != null,
  })

  return {
    mastery: data ?? [],
    loading: isPending,
    error: isError,
  }
}
