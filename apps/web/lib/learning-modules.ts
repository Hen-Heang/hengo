import type { LucideIcon } from "lucide-react"
import { BookOpenText, Headphones, Languages, MessagesSquare } from "lucide-react"

// Single source of truth for the `/learn` (Study) hub's cards. Vocabulary,
// Practice, and Coach each already have their own primary nav destination
// (see `primaryNavItems` in lib/navigation.ts) and are deliberately not
// duplicated here — this hub covers the Korean study material that has no
// nav slot of its own: workplace/daily phrases, foundations, reading, and
// listening. Foundations and Reading are modes of the merged Phrasebook hub
// (`?mode=foundations` / `?mode=reading` on `/phrasebook` — see
// app/(main)/phrasebook/page.tsx), not separate routes.
export type LearningModule = {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  badge?: string
  /** Featured modules get stronger visual hierarchy on the Study hub. */
  featured?: boolean
  statusLabel?: string
}

export const learningModules: LearningModule[] = [
  {
    id: "phrasebook",
    title: "Workplace & Daily Phrases",
    description: "Practice real Q&A for work and everyday situations.",
    href: "/phrasebook",
    icon: MessagesSquare,
    badge: "Korean",
  },
  {
    id: "foundations",
    title: "Foundations",
    description: "Hangul and grammar basics to build your Korean from the ground up.",
    href: "/phrasebook?mode=foundations",
    icon: Languages,
    badge: "Korean",
  },
  {
    id: "reading",
    title: "Reading",
    description: "Real reading passages with comprehension practice.",
    href: "/phrasebook?mode=reading",
    icon: BookOpenText,
    badge: "Korean",
  },
  {
    id: "listening",
    title: "Listening",
    description: "Audio dictation and listening comprehension drills.",
    href: "/listening",
    icon: Headphones,
    badge: "Korean",
  },
]
