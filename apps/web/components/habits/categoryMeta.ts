import {
  BedDouble,
  BookOpen,
  Brain,
  Code2,
  Droplets,
  Dumbbell,
  Footprints,
  GraduationCap,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react"

import type { HabitCategory } from "@/lib/types"

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  exercise: "Exercise",
  reading: "Reading",
  meditation: "Meditation",
  sleep: "Sleep",
  water: "Water",
  study: "Study",
  coding: "Coding",
  deep_work: "Deep work",
  walking: "Walking",
  custom: "Custom",
}

export const CATEGORY_ICONS: Record<HabitCategory, LucideIcon> = {
  exercise: Dumbbell,
  reading: BookOpen,
  meditation: Brain,
  sleep: BedDouble,
  water: Droplets,
  study: GraduationCap,
  coding: Code2,
  deep_work: Timer,
  walking: Footprints,
  custom: Sparkles,
}

export const CATEGORY_ORDER: HabitCategory[] = [
  "exercise",
  "reading",
  "meditation",
  "sleep",
  "water",
  "study",
  "coding",
  "deep_work",
  "walking",
  "custom",
]
