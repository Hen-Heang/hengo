// Speaking strategy for the K-Specialist exam, transcribed from the candidate's
// prep document ("K-Specialist Speaking – MAIN IDEAS TO REMEMBER" + training
// plan). Pure data; the UI lives in components/interview/SpeakingTipsCard.tsx.

import type { PhraseEntry } from "@/lib/interview"

/** One rule of thumb for the spoken Q&A, with its supporting points. */
export interface SpeakingRule {
  title: string
  points: string[]
  /** The one-line lesson to remember, shown as the rule's punchline. */
  takeaway: string
}

export const SPEAKING_RULES: SpeakingRule[] = [
  {
    title: "Short is best",
    points: ["2–3 sentences is enough", "Don't explain everything", "Stop when your point is clear"],
    takeaway: "Short = clear = confident",
  },
  {
    title: "Answer first, explain after",
    points: ["Give the direct answer", "Then one simple reason or example", "Never explain first"],
    takeaway: "Direct answer, then one reason",
  },
  {
    title: "Slow speaking wins",
    points: ["Speak slower than normal", "Clear pronunciation", "Calm voice"],
    takeaway: "Speed does NOT give points",
  },
  {
    title: "Use easy words only",
    points: ["Common words", "Daily expressions", "Simple grammar"],
    takeaway: "Easy Korean = higher understanding",
  },
  {
    title: "Pause before you answer",
    points: ["1 second pause", "Think", "Then speak"],
    takeaway: "Pause shows confidence",
  },
  {
    title: "Mistakes are OK",
    points: ["Don't stop", "Don't say sorry many times", "Keep going"],
    takeaway: "Recovery is more important than perfection",
  },
  {
    title: "Always show growth",
    points: ["“처음에는 어려웠습니다”", "“지금은 좋아졌습니다”"],
    takeaway: "Growth = very high score",
  },
  {
    title: "Use safety sentences",
    points: ["Memorize the safety sentences below", "Use them to buy time or slow the examiner down"],
    takeaway: "A ready sentence beats a panicked silence",
  },
  {
    title: "Be honest, not perfect",
    points: ["Interviewers prefer honesty", "Effort", "Sincerity — not perfect Korean"],
    takeaway: "Honesty scores higher than fake fluency",
  },
]

// Memorized fallback lines to deploy under pressure, plus the two "growth"
// phrases from rule 7 — all speakable so they can be drilled by ear.
export const SAFETY_SENTENCES: PhraseEntry[] = [
  { ko: "네, 질문 감사합니다.", en: "Yes, thank you for the question." },
  {
    ko: "천천히 말씀해 주시면 감사하겠습니다.",
    en: "I would appreciate it if you could speak slowly.",
  },
  {
    ko: "한국어가 아직 부족해서 간단히 말씀드리겠습니다.",
    en: "My Korean is still limited, so I will keep my answer simple.",
  },
  { ko: "처음에는 어려웠습니다.", en: "At first, it was difficult." },
  { ko: "지금은 좋아졌습니다.", en: "Now it has gotten better." },
]

/** What the judges reward vs. what wastes effort. */
export const JUDGES_AVOID = ["Fancy words", "Long answers"]
export const JUDGES_WANT = ["Clear message", "Calm attitude", "Confidence", "Effort"]

/** Per-skill training plan: goal, how to train it, and how often. */
export interface SkillPlan {
  skill: string
  goal: string
  methods: string[]
  frequency: string
}

export const SKILL_TRAINING_PLAN: SkillPlan[] = [
  {
    skill: "Reading",
    goal: "Read your topic smoothly",
    methods: [
      "Timed reading: read exam-related texts aloud, focusing on natural phrasing and pausing",
      "Vocabulary in context: read articles on your exam topics and review new terms",
    ],
    frequency: "Daily · 15–20 min",
  },
  {
    skill: "Listening",
    goal: "Understand common questions",
    methods: [
      "Simulated Q&A: hear common exam questions and summarize the core inquiry right after",
      "Distraction focus: listen with moderate background noise to train selective attention",
    ],
    frequency: "3–4×/week · 20 min",
  },
  {
    skill: "Pronunciation",
    goal: "Clear sounds, not speed",
    methods: [
      "Self-recording: record key vocab and sentences, compare against native audio",
      "Shadowing: repeat short clips immediately, matching intonation and rhythm",
    ],
    frequency: "Daily · 10 min",
  },
  {
    skill: "Speaking",
    goal: "Short, simple answers",
    methods: [
      "One-sentence rule: answer with the shortest direct answer first, then elaborate",
      "Core concept drills: give a 15–30 second clear explanation per flashcard term",
    ],
    frequency: "Daily · 15 min",
  },
  {
    skill: "Confidence",
    goal: "Repetition + routine",
    methods: [
      "Full routine simulation: run a 10–15 min mock exactly as on exam day",
      "High-stress rehearsal: present to someone (or record) even when tired",
    ],
    frequency: "Weekly simulation · daily consistency",
  },
]
