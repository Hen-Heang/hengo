// Fixed skill taxonomy shared across Chat, Corrections, Vocabulary, Listening,
// Scenarios, Foundations, and Interview Prep. Skill codes are a closed set —
// never persist a free-form AI-generated string as a skill identifier, always
// map through here first.

export const SKILL_CODES = [
  "grammar.particles",
  "grammar.tense",
  "grammar.verb_endings",
  "grammar.word_order",
  "grammar.spacing_spelling",

  "communication.politeness",
  "communication.clarification",
  "communication.status_update",
  "communication.task_completion",

  "vocabulary.workplace",
  "vocabulary.technical",
  "vocabulary.daily_life",

  "listening.main_idea",
  "listening.details",
  "listening.workplace",

  "speaking.fluency",
  "speaking.accuracy",
  "speaking.confidence",
  "speaking.task_completion",

  "reading.main_idea",
  "reading.details",

  "interview.vocabulary",
  "interview.speaking",
  "interview.confidence",
  "interview.task_completion",
] as const

export type SkillCode = (typeof SKILL_CODES)[number]

export type SkillCategory =
  | "grammar"
  | "communication"
  | "vocabulary"
  | "listening"
  | "speaking"
  | "reading"
  | "interview"

export interface SkillDefinition {
  code: SkillCode
  label: string
  description: string
  category: SkillCategory
}

export const SKILL_TAXONOMY: Record<SkillCode, SkillDefinition> = {
  "grammar.particles": {
    code: "grammar.particles",
    label: "Particles",
    description: "Subject/topic/object/location particles (이/가, 은/는, 을/를, 에/에서 …)",
    category: "grammar",
  },
  "grammar.tense": {
    code: "grammar.tense",
    label: "Tense",
    description: "Past/present/future tense marking",
    category: "grammar",
  },
  "grammar.verb_endings": {
    code: "grammar.verb_endings",
    label: "Verb endings",
    description: "Conjugation and sentence-ending forms",
    category: "grammar",
  },
  "grammar.word_order": {
    code: "grammar.word_order",
    label: "Word order",
    description: "Korean SOV sentence structure",
    category: "grammar",
  },
  "grammar.spacing_spelling": {
    code: "grammar.spacing_spelling",
    label: "Spacing & spelling",
    description: "띄어쓰기 and spelling accuracy",
    category: "grammar",
  },
  "communication.politeness": {
    code: "communication.politeness",
    label: "Politeness & register",
    description: "반말/존댓말/격식체 and workplace honorifics",
    category: "communication",
  },
  "communication.clarification": {
    code: "communication.clarification",
    label: "Clarification & natural phrasing",
    description: "Asking follow-up questions and phrasing things naturally",
    category: "communication",
  },
  "communication.status_update": {
    code: "communication.status_update",
    label: "Status updates",
    description: "Standups, progress reports, and status communication",
    category: "communication",
  },
  "communication.task_completion": {
    code: "communication.task_completion",
    label: "Task-focused communication",
    description: "Getting a real workplace task done through conversation",
    category: "communication",
  },
  "vocabulary.workplace": {
    code: "vocabulary.workplace",
    label: "Workplace vocabulary",
    description: "General office and workplace terms",
    category: "vocabulary",
  },
  "vocabulary.technical": {
    code: "vocabulary.technical",
    label: "Technical vocabulary",
    description: "Software engineering and IT terminology",
    category: "vocabulary",
  },
  "vocabulary.daily_life": {
    code: "vocabulary.daily_life",
    label: "Daily life vocabulary",
    description: "Everyday, non-work vocabulary",
    category: "vocabulary",
  },
  "listening.main_idea": {
    code: "listening.main_idea",
    label: "Listening: main idea",
    description: "Following the overall point of a conversation",
    category: "listening",
  },
  "listening.details": {
    code: "listening.details",
    label: "Listening: details",
    description: "Catching specific details in spoken Korean",
    category: "listening",
  },
  "listening.workplace": {
    code: "listening.workplace",
    label: "Listening: workplace",
    description: "Understanding meetings, standups, and office conversations",
    category: "listening",
  },
  "speaking.fluency": {
    code: "speaking.fluency",
    label: "Speaking fluency",
    description: "Speaking smoothly without long pauses or restarts",
    category: "speaking",
  },
  "speaking.accuracy": {
    code: "speaking.accuracy",
    label: "Speaking accuracy",
    description: "Grammatical accuracy while speaking",
    category: "speaking",
  },
  "speaking.confidence": {
    code: "speaking.confidence",
    label: "Speaking confidence",
    description: "Willingness to attempt and sustain spoken Korean",
    category: "speaking",
  },
  "speaking.task_completion": {
    code: "speaking.task_completion",
    label: "Speaking task completion",
    description: "Successfully accomplishing the goal of a spoken exchange",
    category: "speaking",
  },
  "reading.main_idea": {
    code: "reading.main_idea",
    label: "Reading: main idea",
    description: "Following the overall point of a written passage",
    category: "reading",
  },
  "reading.details": {
    code: "reading.details",
    label: "Reading: details",
    description: "Catching specific details in written Korean",
    category: "reading",
  },
  "interview.vocabulary": {
    code: "interview.vocabulary",
    label: "Interview vocabulary",
    description: "Vocabulary range in mock-interview answers",
    category: "interview",
  },
  "interview.speaking": {
    code: "interview.speaking",
    label: "Interview speaking",
    description: "Delivery and grammar in mock-interview answers",
    category: "interview",
  },
  "interview.confidence": {
    code: "interview.confidence",
    label: "Interview confidence",
    description: "Composure and confidence under interview conditions",
    category: "interview",
  },
  "interview.task_completion": {
    code: "interview.task_completion",
    label: "Interview task completion",
    description: "Fully answering what the question actually asked",
    category: "interview",
  },
}

export function isSkillCode(value: string): value is SkillCode {
  return Object.prototype.hasOwnProperty.call(SKILL_TAXONOMY, value)
}

export function skillLabel(code: SkillCode): string {
  return SKILL_TAXONOMY[code].label
}

// Grammar-mistake categories used by the chat turn-analysis schema and the
// (optionally categorized) manual correction checker.
export const CORRECTION_CATEGORIES = [
  "particle",
  "verb_ending",
  "tense",
  "word_order",
  "vocabulary",
  "politeness",
  "spacing",
  "spelling",
  "expression",
] as const

export type CorrectionCategory = (typeof CORRECTION_CATEGORIES)[number]

const CORRECTION_CATEGORY_TO_SKILL: Record<CorrectionCategory, SkillCode> = {
  particle: "grammar.particles",
  verb_ending: "grammar.verb_endings",
  tense: "grammar.tense",
  word_order: "grammar.word_order",
  vocabulary: "vocabulary.workplace",
  politeness: "communication.politeness",
  spacing: "grammar.spacing_spelling",
  spelling: "grammar.spacing_spelling",
  expression: "communication.clarification",
}

export function skillForCorrectionCategory(category: string): SkillCode {
  if ((CORRECTION_CATEGORIES as readonly string[]).includes(category)) {
    return CORRECTION_CATEGORY_TO_SKILL[category as CorrectionCategory]
  }
  return "grammar.particles"
}

// Heuristic keyword mapping from a listening topic / scenario category
// string (free text chosen from a fixed list elsewhere in the app) to the
// skills that topic mainly exercises. Falls back to a sensible default set.
export function skillsForListeningTopic(topic: string): SkillCode[] {
  const key = topic.toLowerCase()
  if (key.includes("standup") || key.includes("sprint") || key.includes("review") || key.includes("meeting") || key.includes("one-on-one") || key.includes("client")) {
    return ["listening.workplace", "listening.main_idea", "listening.details"]
  }
  if (key.includes("helpdesk") || key.includes("it")) {
    return ["listening.details", "vocabulary.technical"]
  }
  return ["listening.main_idea", "listening.details"]
}

export function skillForVocabCategory(category: string): SkillCode {
  const key = category.toLowerCase()
  if (key.includes("tech") || key.includes("code") || key.includes("dev") || key.includes("engineer") || key.includes("it ")) {
    return "vocabulary.technical"
  }
  if (key.includes("daily") || key.includes("life") || key.includes("general")) {
    return "vocabulary.daily_life"
  }
  return "vocabulary.workplace"
}

export function skillsForScenarioCategory(category: string): SkillCode[] {
  const key = category.toLowerCase()
  if (key.includes("meeting") || key.includes("standup") || key.includes("report")) {
    return ["speaking.task_completion", "communication.status_update", "speaking.fluency"]
  }
  if (key.includes("review") || key.includes("code")) {
    return ["vocabulary.technical", "speaking.accuracy", "speaking.task_completion"]
  }
  if (key.includes("social") || key.includes("lunch") || key.includes("dinner") || key.includes("team")) {
    return ["speaking.confidence", "vocabulary.daily_life", "communication.clarification"]
  }
  return ["speaking.task_completion", "speaking.fluency", "communication.clarification"]
}
