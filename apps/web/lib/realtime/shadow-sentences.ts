import type { RepeatSentence } from "@/lib/repeat-drill"

// Starter target sentences for Repeat & Shadow mode — practical workplace and
// everyday Korean a developer in Korea actually uses. Kept short enough to
// shadow in one breath. (A future version can pull these from the learner's
// own vocabulary and past mistakes.)
export const SHADOW_SENTENCES: RepeatSentence[] = [
  {
    id: "shadow-standup-1",
    ko: "어제 로그인 버그를 수정했어요.",
    en: "I fixed the login bug yesterday.",
    sourceLabel: "Standup",
  },
  {
    id: "shadow-standup-2",
    ko: "오늘은 API 연동을 시작할 거예요.",
    en: "Today I'll start the API integration.",
    sourceLabel: "Standup",
  },
  {
    id: "shadow-review-1",
    ko: "이 부분은 왜 이렇게 구현했는지 설명해 주시겠어요?",
    en: "Could you explain why this part was implemented this way?",
    sourceLabel: "Code review",
  },
  {
    id: "shadow-help-1",
    ko: "혹시 지금 잠깐 도와주실 수 있으세요?",
    en: "Could you possibly help me for a moment right now?",
    sourceLabel: "Asking for help",
  },
  {
    id: "shadow-meeting-1",
    ko: "죄송하지만 조금 더 자세히 설명해 주시겠어요?",
    en: "Sorry, could you explain in a little more detail?",
    sourceLabel: "Meeting",
  },
  {
    id: "shadow-deploy-1",
    ko: "배포는 오늘 오후에 진행할 예정입니다.",
    en: "The deployment is scheduled for this afternoon.",
    sourceLabel: "Deployment",
  },
  {
    id: "shadow-daily-1",
    ko: "점심 같이 드실래요?",
    en: "Would you like to have lunch together?",
    sourceLabel: "Office life",
  },
  {
    id: "shadow-daily-2",
    ko: "먼저 퇴근하겠습니다. 수고하셨습니다.",
    en: "I'm heading home first. Good work today.",
    sourceLabel: "Office life",
  },
]
