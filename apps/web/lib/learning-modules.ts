import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Drama,
  GraduationCap,
  Headphones,
  Library,
  Mic,
  Sparkles,
} from "lucide-react"

// Single source of truth for the `/learn` hub's cards. Grouping (`category`)
// drives the page's sections; `badge` is a subject tag (only "Korean" today)
// kept separate so future non-Korean modules (backend, AI, DevOps, English…)
// can ship into the same categories without one.
export type LearningModuleCategory = "practice" | "study" | "exam-prep"

export type LearningModule = {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  category: LearningModuleCategory
  badge?: string
  /** Whether this module should also get its own sidebar/nav entry. */
  showInSidebar?: boolean
  statusLabel?: string
}

export const LEARNING_MODULE_CATEGORIES: LearningModuleCategory[] = [
  "practice",
  "study",
  "exam-prep",
]

export const LEARNING_MODULE_CATEGORY_LABELS: Record<LearningModuleCategory, string> = {
  practice: "Practice",
  study: "Study",
  "exam-prep": "Exam preparation",
}

export const learningModules: LearningModule[] = [
  {
    id: "practice-today",
    title: "Today's Practice",
    description: "Vocab, drills, and a quick review — built for today.",
    href: "/practice",
    icon: Sparkles,
    category: "practice",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    id: "korean-coach",
    title: "Korean Coach",
    description: "Listening and speaking practice with live AI feedback.",
    href: "/korean-coach",
    icon: Mic,
    category: "practice",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    id: "scenarios",
    title: "Scenarios",
    description: "Roleplay real workplace and daily-life situations.",
    href: "/scenarios",
    icon: Drama,
    category: "practice",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    // One card for the merged Phrasebook/Reading/Foundations hub (see
    // app/(main)/phrasebook/page.tsx's mode switcher) — Learn and More both
    // show a single entry point into it rather than three separate cards.
    // The Quick Switcher and sidebar search still resolve Phrasebook/
    // Reading/Foundations individually (see learn-phrasebook/learn-reading/
    // learn-foundations in lib/navigation.ts) — this only affects the /learn
    // hub's card grid.
    id: "study",
    title: "Study",
    description: "Workplace phrases, real reading passages, and Hangul & grammar foundations — build your Korean from every angle.",
    href: "/phrasebook",
    icon: Library,
    category: "study",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    id: "vocabulary",
    title: "Vocabulary",
    description: "Review saved words with spaced-repetition flashcards.",
    href: "/vocab",
    icon: BookOpen,
    category: "study",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    id: "listening",
    title: "Listening",
    description: "Audio dictation and listening comprehension drills.",
    href: "/listening",
    icon: Headphones,
    category: "study",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    id: "exam-prep",
    title: "Exam Preparation",
    description: "TOPIK-style mock interviews and script practice.",
    href: "/interview",
    icon: GraduationCap,
    category: "exam-prep",
    badge: "Korean",
    showInSidebar: true,
  },
]

export function learningModulesByCategory(category: LearningModuleCategory): LearningModule[] {
  return learningModules.filter((module) => module.category === category)
}
