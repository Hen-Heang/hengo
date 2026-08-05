import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  BookOpenText,
  Drama,
  GraduationCap,
  Headphones,
  Languages,
  Mic,
  MessagesSquare,
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
    id: "foundations",
    title: "Foundations",
    description: "Survival phrases, Hangul, and basic grammar from zero.",
    href: "/learn/foundations",
    icon: Languages,
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
    id: "phrasebook",
    title: "Phrasebook",
    description: "Workplace and daily-life questions and answers.",
    href: "/phrasebook",
    icon: MessagesSquare,
    category: "study",
    badge: "Korean",
    showInSidebar: true,
  },
  {
    id: "reading",
    title: "Reading",
    description: "Short articles with comprehension practice.",
    href: "/reading",
    icon: BookOpenText,
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
