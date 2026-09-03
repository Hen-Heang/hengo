import type { LearnTrack, LessonDetail } from "@/lib/types"

import {
  FOUNDATIONS_CURRICULUM_VERSION as BASE_FOUNDATIONS_CURRICULUM_VERSION,
  FOUNDATIONS_SEED as BASE_FOUNDATIONS_SEED,
} from "@/lib/foundations-data"
import {
  CORE_KOREAN_FOUNDATIONS,
  CORE_KOREAN_FOUNDATIONS_VERSION,
} from "@/lib/foundations-core-korean"

// Active authored curriculum used by the Hengo Foundations UI.
//
// Keep the original foundation seed untouched so existing lesson IDs/progress stay
// stable; extend it additively with practical Core Korean lessons.
export const FOUNDATIONS_CURRICULUM_VERSION = `${BASE_FOUNDATIONS_CURRICULUM_VERSION}+core-${CORE_KOREAN_FOUNDATIONS_VERSION}`

export const FOUNDATIONS_SEED: LessonDetail[] = [
  ...BASE_FOUNDATIONS_SEED,
  ...CORE_KOREAN_FOUNDATIONS,
]

export function seedLessonsByTrack(track: LearnTrack): LessonDetail[] {
  return FOUNDATIONS_SEED.filter((lesson) => lesson.track === track).sort(
    (a, b) => a.order - b.order,
  )
}

export function seedLessonById(id: string): LessonDetail | undefined {
  return FOUNDATIONS_SEED.find((lesson) => lesson.id === id)
}
