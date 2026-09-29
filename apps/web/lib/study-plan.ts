// Study plan for the 제6회 K-Specialist exam, surfaced on the interview page so
// the candidate sees their countdown + this week's tasks where they practice
// daily. Pure data + date helpers; the UI lives in
// components/interview/StudyPlanCard.tsx.

export const EXAM_DATE = "2026-11-28"
export const SCRIPT_DUE_DATE = "2026-11-20"

// Short labels for the UI copy that names the dates ("Q&A · Nov 28"). Keep
// them in step with EXAM_DATE / SCRIPT_DUE_DATE above.
export const EXAM_DATE_LABEL = "Nov 28"
export const SCRIPT_DUE_LABEL = "Nov 20"

// The interview starts at 13:00 KST (UTC+9) on exam day — the planned slot is
// "2026년 11월 28일(토) 13시" (the notice also mentions 11/29, so re-check the
// final announcement). Pinned to the KST instant so the live countdown is
// correct from any timezone. EXAM_END is end of exam day: the banner stays up
// through the whole day ("until you finish"), then hides.
export const EXAM_DATETIME = "2026-11-28T13:00:00+09:00"
export const EXAM_END_DATETIME = "2026-11-28T23:59:59+09:00"

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
    id: "w1",
    label: "Week 1",
    range: "Sep 21–27",
    start: "2026-09-21",
    end: "2026-09-27",
    phase: "Baseline",
    tasks: [
      "Read the new habits/hobbies script aloud once a day",
      "Learn the flow: 교통 → 날씨 → 분리배출/요리 → 운동 → 친구/여행 → 한국어 → 변화",
      "Answer the TOP 5 questions in 1–3 sentences",
      "Start the daily 15–20 minute check",
    ],
  },
  {
    id: "w2",
    label: "Week 2",
    range: "Sep 28–Oct 4",
    start: "2026-09-28",
    end: "2026-10-04",
    phase: "Foundation",
    tasks: [
      "Question comprehension: 왜 · 어떻게 · 어디 · 언제 · 가장 — catch 2–4 words",
      "Grammar: 'V-게 되었어요' + '처음에는 ~, 하지만 지금은 ~'",
      "Everyday Q&A: company, home, weekend, food, life in Korea",
      "3× Listening sessions — no English first",
    ],
  },
  {
    id: "w3",
    label: "Week 3",
    range: "Oct 5–11",
    start: "2026-10-05",
    end: "2026-10-11",
    phase: "Foundation",
    tasks: [
      "Answer all 18 expected questions without looking",
      "Grammar: 'V-(으)면서', 'V-거나', 'V-아/어 보다'",
      "Self-introduction: short and natural, not memorized-sounding",
      "First self-recording — answer 3 questions, listen back",
    ],
  },
  {
    id: "w4",
    label: "Week 4",
    range: "Oct 12–18",
    start: "2026-10-12",
    end: "2026-10-18",
    phase: "Speaking",
    tasks: [
      "Daily mock (5+ turns) — answer aloud, save the scorecard",
      "Follow-ups: 왜요? · 언제부터? · 얼마나 자주? · 누구와?",
      "Hear the same question phrased 2–3 different ways",
      "Log your 3 most common mistakes and drill them",
    ],
  },
  {
    id: "w5",
    label: "Week 5",
    range: "Oct 19–25",
    start: "2026-10-19",
    end: "2026-10-25",
    phase: "Speaking",
    tasks: [
      "Daily mock; keep going after a grammar mistake",
      "Reuse real stories (한강 자전거, 부산 여행) for different follow-ups",
      "Record vs TTS — fix your top 2 pronunciation issues",
      "Topic summary: one reason + one real experience",
    ],
  },
  {
    id: "w6",
    label: "Week 6",
    range: "Oct 26–Nov 1",
    start: "2026-10-26",
    end: "2026-11-01",
    phase: "Speaking",
    tasks: [
      "📋 Oct 30: interview group assignment — match mocks to the real format",
      "Daily mock with random questions + follow-ups",
      "Drill recovery lines: 한 번만 다시 말씀해 주시겠습니까?",
      "Can answer the TOP 5 confidently in 1 second",
    ],
  },
  {
    id: "w7",
    label: "Week 7",
    range: "Nov 2–8",
    start: "2026-11-02",
    end: "2026-11-08",
    phase: "Polish",
    tasks: [
      "Self-intro + topic intro + Q&A as one full run",
      "Script: tighten wording, keep grammar simple",
      "Target your weak pronunciation sounds daily",
      "Practice unexpected / off-script questions",
    ],
  },
  {
    id: "w8",
    label: "Week 8",
    range: "Nov 9–15",
    start: "2026-11-09",
    end: "2026-11-15",
    phase: "Polish",
    tasks: [
      "Daily full mock; aim for short answers with no long pauses",
      "Script: final proofread pass (grammar, spelling, flow)",
      "Read the full script aloud twice; time it",
      "Listening comfortable without English now",
    ],
  },
  {
    id: "w9",
    label: "Week 9",
    range: "Nov 16–20",
    start: "2026-11-16",
    end: "2026-11-20",
    phase: "Polish",
    tasks: [
      "Nov 18: script FINAL — no more changes",
      "Nov 19: read aloud one last time",
      "🚩 Nov 20: SUBMIT THE KOREAN PRESENTATION SCRIPT",
    ],
  },
  {
    id: "w10",
    label: "Week 10",
    range: "Nov 21–28",
    start: "2026-11-21",
    end: "2026-11-28",
    phase: "Taper",
    tasks: [
      "Daily mock: random question → 1 second → 1–3 sentences → follow-up",
      "No new content — repeat only weak questions and mistakes",
      "Nov 27: light review of the 60-second intro + TOP 5 + emergency lines",
      "Nov 28 13:00: interview day — rest, no cramming",
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

/**
 * Whether the K-Specialist exam is still ahead of or ongoing for `now` — the
 * single source of truth for "is there an active exam right now", shared by
 * the countdown banner (hide once the exam day is over) and the daily
 * mission generator (only let the `interview` mission type get selected
 * while an exam is genuinely upcoming/in progress, see lib/api/missions.ts).
 * There's no per-account exam-date field — this is one fixed date the whole
 * app shares — so once EXAM_END_DATETIME passes this permanently returns
 * false until the constants above are updated for a future exam cycle.
 */
export function isExamActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(EXAM_END_DATETIME).getTime()
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
export function getCurrentWeek(
  today: Date = new Date(),
  weeks: StudyWeek[] = STUDY_WEEKS,
): StudyWeek {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  for (const w of weeks) {
    if (base >= toDateOnly(w.start).getTime() && base <= toDateOnly(w.end).getTime()) return w
  }
  if (base < toDateOnly(weeks[0].start).getTime()) return weeks[0]
  return weeks[weeks.length - 1]
}
