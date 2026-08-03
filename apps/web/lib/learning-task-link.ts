import type { Task } from "@/lib/tasks"

export interface LearningTaskLink {
  label: string
  href: string
}

// Goals/tasks are a generic productivity feature with no backend link to real
// learning activity. This keyword match is the honest middle ground: any task
// (manual or AI-generated) whose text names a learning feature gets a direct
// "Practice" deep link, so a Korean-learning goal's checklist actually leads
// somewhere instead of just sitting there as text.
const RULES: { keywords: string[]; href: string; label: string }[] = [
  { keywords: ["vocab", "flashcard", "word list"], href: "/vocab", label: "Practice vocab" },
  { keywords: ["scenario", "roleplay", "role-play", "meeting practice"], href: "/scenarios", label: "Practice scenario" },
  { keywords: ["listening", "transcript"], href: "/listening", label: "Practice listening" },
  { keywords: ["reading", "passage"], href: "/reading", label: "Practice reading" },
  { keywords: ["daily phrase", "phrase of the day"], href: "/practice", label: "Open today's phrase" },
  { keywords: ["correction", "mistake", "grammar review"], href: "/chat?mode=corrections", label: "Review corrections" },
  { keywords: ["interview", "exam prep", "mock interview"], href: "/interview", label: "Open exam prep" },
  { keywords: ["hangul", "alphabet", "foundations", "survival korean"], href: "/learn", label: "Open foundations" },
  { keywords: ["chat", "conversation", "speak", "speaking", "talk"], href: "/chat", label: "Open AI Coach" },
]

export function getLearningTaskLink(task: Pick<Task, "title" | "description">): LearningTaskLink | null {
  const text = `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return { label: rule.label, href: rule.href }
    }
  }
  return null
}
