// Mode configs for the mock interview: one flag object drives both the
// examiner prompts (lib/interview.ts) and the session UI (app/(main)/interview),
// so Practice and Exam are the same page behaving differently — not two pages.

export type InterviewMode = "practice" | "exam"

export interface InterviewModeConfig {
  id: InterviewMode
  label: string
  /** One-line pitch shown on the mode picker card. */
  description: string
  /** Examiner gives per-turn English feedback ([FEEDBACK] block). */
  showFeedback: boolean
  /** English translation of each question is available ([QUESTION_EN] + toggle). */
  showEnglish: boolean
  /** Offer the 0.75× slow TTS replay next to the normal one. */
  allowSlowReplay: boolean
  /** Keep the Study Pack / strategy cards visible during the session. */
  showStudyPackInSession: boolean
  /** Whole-interview countdown in seconds; null = untimed. */
  durationSeconds: number | null
  /** How many off-topic questions to sample into the examiner brief. */
  unexpectedQuestionCount: number
  /** Answers required before "Finish & Get Evaluation" appears. */
  minAnswersBeforeFinish: number
}

export const INTERVIEW_MODES: Record<InterviewMode, InterviewModeConfig> = {
  practice: {
    id: "practice",
    label: "Practice",
    description:
      "Friendly training: feedback after every answer, English on demand, slow replay, no timer.",
    showFeedback: true,
    showEnglish: true,
    allowSlowReplay: true,
    showStudyPackInSession: true,
    durationSeconds: null,
    unexpectedQuestionCount: 2,
    minAnswersBeforeFinish: 1,
  },
  exam: {
    id: "exam",
    label: "Exam Simulation",
    description:
      "Real conditions: Korean only, no feedback until the end, surprise questions, 10-minute timer.",
    showFeedback: false,
    showEnglish: false,
    allowSlowReplay: false,
    showStudyPackInSession: false,
    durationSeconds: 600,
    unexpectedQuestionCount: 4,
    minAnswersBeforeFinish: 4,
  },
}
