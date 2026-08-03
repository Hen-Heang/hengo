// Study plan for the 제5회 K-Specialist exam, surfaced on the interview page so
// the candidate sees their countdown + this week's tasks where they practice
// daily. Pure data + date helpers; the UI lives in
// components/interview/StudyPlanCard.tsx.

export const EXAM_DATE = "2026-08-29"
export const SCRIPT_DUE_DATE = "2026-08-21"

// The exam starts at 13:00 KST (UTC+9) on exam day — per the official notice
// "2026년 08월 29일(토) 13시". Pinned to the KST instant so the live countdown is
// correct from any timezone. EXAM_END is end of exam day: the banner stays up
// through the whole day ("until you finish"), then hides.
export const EXAM_DATETIME = "2026-08-29T13:00:00+09:00"
export const EXAM_END_DATETIME = "2026-08-29T23:59:59+09:00"

export type StudyPhase = "Baseline" | "Foundation" | "Speaking" | "Polish" | "Taper"

export interface StudyWeek {
  id: string
  label: string
  /** Human-readable range shown in the UI, e.g. "Jun 23–29". */
  range: string
  /** Inclusive ISO start date, used to detect the current week. */
  start: string
  /** Inclusive ISO end date. */
  end: string
  phase: StudyPhase
  tasks: string[]
}

export const STUDY_WEEKS: StudyWeek[] = [
  {
    id: "w0",
    label: "Week 0",
    range: "Jun 17–22",
    start: "2026-06-17",
    end: "2026-06-22",
    phase: "Baseline",
    tasks: [
      "Take one full mock — write down your 4-criteria baseline score",
      "Add all 20 weather words to your SRS deck",
      "Write a rough draft of all 7 script sections",
      "Start the daily core routine",
    ],
  },
  {
    id: "w1",
    label: "Week 1",
    range: "Jun 23–29",
    start: "2026-06-23",
    end: "2026-06-29",
    phase: "Foundation",
    tasks: [
      "Daily core routine ×7",
      "Grammar: comparison 'A보다 B가 더 ~'",
      "Rewrite script sections 1–2 (intro, Korea summer)",
      "3× Listening module sessions",
    ],
  },
  {
    id: "w2",
    label: "Week 2",
    range: "Jun 30–Jul 6",
    start: "2026-06-30",
    end: "2026-07-06",
    phase: "Foundation",
    tasks: [
      "Daily core routine ×7",
      "Grammar: '처음에는 ~지만 지금은 ~' + cause '~아서/어서'",
      "Rewrite script sections 3–4 (compare, daily life)",
      "3× Listening — transcribe each sample question",
    ],
  },
  {
    id: "w3",
    label: "Week 3",
    range: "Jul 7–13",
    start: "2026-07-07",
    end: "2026-07-13",
    phase: "Foundation",
    tasks: [
      "Daily core routine ×7",
      "Grammar: '~는 것 같아요' + linking sentences smoothly",
      "Rewrite script sections 5–7 (health, reflection, conclusion)",
      "First self-recording — answer 3 questions, listen back",
    ],
  },
  {
    id: "w4",
    label: "Week 4",
    range: "Jul 14–20",
    start: "2026-07-14",
    end: "2026-07-20",
    phase: "Speaking",
    tasks: [
      "Daily FULL mock (5+ turns), answer aloud, save scorecard",
      "Log your 3 most common mistakes and drill them",
      "Answer 5 sample questions 2 ways each (paraphrase)",
      "Listening: hide the English on every question",
    ],
  },
  {
    id: "w5",
    label: "Week 5",
    range: "Jul 21–27",
    start: "2026-07-21",
    end: "2026-07-27",
    phase: "Speaking",
    tasks: [
      "Daily full mock; target Speaking + Vocabulary ≥ 4/5",
      "Record vs TTS — fix your top 2 pronunciation issues",
      "Practice follow-up questions (examiner goes deeper)",
      "Memorize section CONTENT for sections 1–4",
    ],
  },
  {
    id: "w6",
    label: "Week 6",
    range: "Jul 28–Aug 3",
    start: "2026-07-28",
    end: "2026-08-03",
    phase: "Speaking",
    tasks: [
      "Daily full mock; target all 4 criteria ≥ 4/5",
      "Memorize section CONTENT for sections 5–7",
      "Drill recovery phrases: 글쎄요…, 좋은 질문이에요, 다시 말씀해 주시겠어요?",
      "Can answer all 8 sample questions confidently",
    ],
  },
  {
    id: "w7",
    label: "Week 7",
    range: "Aug 4–10",
    start: "2026-08-04",
    end: "2026-08-10",
    phase: "Polish",
    tasks: [
      "Daily full mock at full difficulty",
      "Script: tighten wording, swap weak vocab for strong terms",
      "Target your weak pronunciation sounds daily",
      "Practice unexpected / off-script questions",
    ],
  },
  {
    id: "w8",
    label: "Week 8",
    range: "Aug 11–17",
    start: "2026-08-11",
    end: "2026-08-17",
    phase: "Polish",
    tasks: [
      "Daily full mock; aim 4–5/5 consistently",
      "Script: final proofread pass (grammar, spelling, flow)",
      "Read full script aloud twice; time it",
      "Listening comfortable without English now",
    ],
  },
  {
    id: "w9",
    label: "Week 9",
    range: "Aug 18–21",
    start: "2026-08-18",
    end: "2026-08-21",
    phase: "Polish",
    tasks: [
      "Aug 19: script FINAL — no more changes",
      "Aug 20: read aloud one last time",
      "🚩 Aug 21: SUBMIT THE SCRIPT",
    ],
  },
  {
    id: "w10",
    label: "Week 10",
    range: "Aug 22–29",
    start: "2026-08-22",
    end: "2026-08-29",
    phase: "Taper",
    tasks: [
      "Daily TIMED mock, real conditions: no English, no notes",
      "Light vocab review only — do NOT learn new words",
      "Aug 28: light review of script + 10 key phrases",
      "Aug 29: rest, sleep early, no cramming",
    ],
  },
]

function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export interface CountdownParts {
  /** Milliseconds remaining (0 once the target has passed). */
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  /** True once `now` is at/after the target. */
  past: boolean
}

/**
 * Live countdown breakdown from `now` to an absolute instant (`targetIso` should
 * carry a timezone offset). Clamps to zero once the target has passed.
 */
export function countdownTo(targetIso: string, now: Date = new Date()): CountdownParts {
  const total = new Date(targetIso).getTime() - now.getTime()
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, past: true }
  }
  const totalSeconds = Math.floor(total / 1000)
  return {
    total,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    past: false,
  }
}

/** Whole calendar days from `today` until `dateIso` (negative if past). */
export function daysUntil(dateIso: string, today: Date = new Date()): number {
  const target = toDateOnly(dateIso).getTime()
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.round((target - base) / 86_400_000)
}

/**
 * The week containing `today`. Before the plan starts → first week; after it
 * ends → last week, so there's always something to show.
 */
export function getCurrentWeek(today: Date = new Date(), weeks: StudyWeek[] = STUDY_WEEKS): StudyWeek {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  for (const w of weeks) {
    if (base >= toDateOnly(w.start).getTime() && base <= toDateOnly(w.end).getTime()) return w
  }
  if (base < toDateOnly(weeks[0].start).getTime()) return weeks[0]
  return weeks[weeks.length - 1]
}
