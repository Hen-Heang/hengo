import type { KoreanPhrase } from "./schemas"

export interface ListeningChallenge {
  id: string
  category: "workplace" | "daily"
  phrase: KoreanPhrase
  vocabulary: Array<{ korean: string; meaning: string }>
}

export const LISTENING_CHALLENGES: ListeningChallenge[] = [
  {
    id: "deadline-friday",
    category: "workplace",
    phrase: {
      korean: "이 작업은 금요일까지 완료해 주세요.",
      romanization: "I jag-eobeun geumyoilkkaji wanryohae juseyo.",
      english: "Please complete this task by Friday.",
    },
    vocabulary: [
      { korean: "금요일까지", meaning: "by Friday" },
      { korean: "완료하다", meaning: "to complete" },
    ],
  },
  {
    id: "standup-blocker",
    category: "workplace",
    phrase: {
      korean: "지금 막히는 부분은 없어요.",
      romanization: "Jigeum makhineun bubuneun eopseoyo.",
      english: "There are no blockers right now.",
    },
    vocabulary: [
      { korean: "막히는 부분", meaning: "a blocked part / blocker" },
      { korean: "없어요", meaning: "there is not / I do not have" },
    ],
  },
  {
    id: "review-request",
    category: "workplace",
    phrase: {
      korean: "시간 되실 때 코드 검토 부탁드려요.",
      romanization: "Sigan doesil ttae kodeu geomto butakdeuryeoyo.",
      english: "When you have time, please review the code.",
    },
    vocabulary: [
      { korean: "시간 되실 때", meaning: "when you have time" },
      { korean: "검토 부탁드려요", meaning: "please review it" },
    ],
  },
  {
    id: "restaurant-spicy",
    category: "daily",
    phrase: {
      korean: "이거 조금 덜 맵게 해 주세요.",
      romanization: "Igeo jogeum deol maepge hae juseyo.",
      english: "Please make this a little less spicy.",
    },
    vocabulary: [
      { korean: "조금", meaning: "a little" },
      { korean: "덜 맵게", meaning: "less spicy" },
    ],
  },
  {
    id: "subway-transfer",
    category: "daily",
    phrase: {
      korean: "시청역에서 이호선으로 갈아타세요.",
      romanization: "Sicheongnyeogeseo ihoseoneuro garataseyo.",
      english: "Transfer to Line 2 at City Hall Station.",
    },
    vocabulary: [
      { korean: "이호선", meaning: "Line 2" },
      { korean: "갈아타세요", meaning: "please transfer" },
    ],
  },
]

