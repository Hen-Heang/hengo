import type { VocabItem } from "@/lib/types"

export type CoreKoreanGroup =
  | "verbs"
  | "descriptive-verbs"
  | "daily-nouns"
  | "function-words"
  | "numbers-time"
  | "workplace"
  | "developer"

export interface CoreKoreanEntry {
  rank: number
  term: string
  meaning: string
  group: CoreKoreanGroup
  category: string
  tags: string[]
}

type CoreGroupSeed = {
  group: CoreKoreanGroup
  category: string
  topic: string
  level: "a1" | "a2"
  words: Array<readonly [term: string, meaning: string]>
}

const CORE_GROUPS: CoreGroupSeed[] = [
  {
    group: "verbs",
    category: "Core Korean · Verbs",
    topic: "daily-life",
    level: "a1",
    words: [
      ["하다", "to do"],
      ["가다", "to go"],
      ["오다", "to come"],
      ["보다", "to see / watch"],
      ["먹다", "to eat"],
      ["마시다", "to drink"],
      ["주다", "to give"],
      ["받다", "to receive"],
      ["알다", "to know"],
      ["모르다", "to not know"],
      ["있다", "to exist / have"],
      ["없다", "to not exist / not have"],
      ["말하다", "to speak / say"],
      ["듣다", "to listen / hear"],
      ["읽다", "to read"],
      ["쓰다", "to write / use"],
      ["만들다", "to make"],
      ["사용하다", "to use"],
      ["찾다", "to find / look for"],
      ["기다리다", "to wait"],
      ["만나다", "to meet"],
      ["배우다", "to learn"],
      ["공부하다", "to study"],
      ["일하다", "to work"],
      ["쉬다", "to rest"],
      ["자다", "to sleep"],
      ["일어나다", "to get up"],
      ["씻다", "to wash"],
      ["입다", "to wear"],
      ["사다", "to buy"],
      ["팔다", "to sell"],
      ["열다", "to open"],
      ["닫다", "to close"],
      ["들어가다", "to enter"],
      ["나가다", "to go out"],
      ["타다", "to ride"],
      ["내리다", "to get off / descend"],
      ["걷다", "to walk"],
      ["앉다", "to sit"],
      ["서다", "to stand"],
      ["시작하다", "to start"],
      ["끝나다", "to finish / end"],
      ["끝내다", "to finish something"],
      ["도와주다", "to help"],
      ["물어보다", "to ask"],
      ["대답하다", "to answer"],
      ["생각하다", "to think"],
      ["기억하다", "to remember"],
      ["잊다", "to forget"],
      ["선택하다", "to choose"],
      ["바꾸다", "to change"],
      ["준비하다", "to prepare"],
      ["예약하다", "to reserve"],
      ["주문하다", "to order"],
      ["계산하다", "to pay / calculate"],
      ["보내다", "to send / spend"],
      ["전화하다", "to call"],
      ["연락하다", "to contact"],
      ["운동하다", "to exercise"],
      ["살다", "to live"],
    ],
  },
  {
    group: "descriptive-verbs",
    category: "Core Korean · Descriptive Verbs",
    topic: "daily-life",
    level: "a1",
    words: [
      ["좋다", "to be good"],
      ["나쁘다", "to be bad"],
      ["크다", "to be big"],
      ["작다", "to be small"],
      ["많다", "to be many / much"],
      ["적다", "to be few / little"],
      ["길다", "to be long"],
      ["짧다", "to be short"],
      ["높다", "to be high"],
      ["낮다", "to be low"],
      ["빠르다", "to be fast"],
      ["느리다", "to be slow"],
      ["쉽다", "to be easy"],
      ["어렵다", "to be difficult"],
      ["바쁘다", "to be busy"],
      ["한가하다", "to be free / not busy"],
      ["새롭다", "to be new"],
      ["오래되다", "to be old / longstanding"],
      ["비싸다", "to be expensive"],
      ["싸다", "to be cheap"],
      ["맛있다", "to be delicious"],
      ["맛없다", "to taste bad"],
      ["덥다", "to be hot"],
      ["춥다", "to be cold"],
      ["따뜻하다", "to be warm"],
      ["시원하다", "to be cool / refreshing"],
      ["피곤하다", "to be tired"],
      ["아프다", "to be sick / hurt"],
      ["건강하다", "to be healthy"],
      ["괜찮다", "to be okay"],
      ["필요하다", "to be necessary / need"],
      ["중요하다", "to be important"],
      ["가능하다", "to be possible"],
      ["불가능하다", "to be impossible"],
      ["같다", "to seem / be the same"],
      ["다르다", "to be different"],
      ["맞다", "to be correct"],
      ["틀리다", "to be wrong"],
      ["재미있다", "to be interesting / fun"],
      ["조용하다", "to be quiet"],
    ],
  },
  {
    group: "daily-nouns",
    category: "Core Korean · Daily Life",
    topic: "daily-life",
    level: "a1",
    words: [
      ["사람", "person"],
      ["친구", "friend"],
      ["가족", "family"],
      ["집", "home / house"],
      ["방", "room"],
      ["학교", "school"],
      ["회사", "company / office"],
      ["가게", "store"],
      ["식당", "restaurant"],
      ["카페", "cafe"],
      ["병원", "hospital"],
      ["약국", "pharmacy"],
      ["은행", "bank"],
      ["시장", "market"],
      ["화장실", "bathroom"],
      ["길", "road / way"],
      ["역", "station"],
      ["지하철", "subway"],
      ["버스", "bus"],
      ["택시", "taxi"],
      ["공항", "airport"],
      ["음식", "food"],
      ["밥", "meal / rice"],
      ["물", "water"],
      ["커피", "coffee"],
      ["빵", "bread"],
      ["고기", "meat"],
      ["과일", "fruit"],
      ["옷", "clothes"],
      ["신발", "shoes"],
      ["가방", "bag"],
      ["휴대폰", "mobile phone"],
      ["컴퓨터", "computer"],
      ["책", "book"],
      ["돈", "money"],
      ["카드", "card"],
      ["현금", "cash"],
      ["가격", "price"],
      ["날씨", "weather"],
      ["비", "rain"],
      ["눈", "snow"],
      ["시간", "time"],
      ["오늘", "today"],
      ["내일", "tomorrow"],
      ["어제", "yesterday"],
      ["아침", "morning"],
      ["점심", "lunch"],
      ["저녁", "evening / dinner"],
      ["주말", "weekend"],
      ["문제", "problem"],
      ["도움", "help"],
      ["이름", "name"],
      ["나라", "country"],
      ["한국", "Korea"],
      ["한국어", "Korean language"],
      ["주소", "address"],
      ["전화번호", "phone number"],
      ["약속", "appointment / promise"],
      ["사진", "photo"],
      ["문", "door"],
    ],
  },
  {
    group: "function-words",
    category: "Core Korean · Function Words",
    topic: "foundation",
    level: "a1",
    words: [
      ["저", "I / me (humble)"],
      ["나", "I / me (casual)"],
      ["우리", "we / our"],
      ["이것", "this thing"],
      ["그것", "that thing"],
      ["저것", "that thing over there"],
      ["여기", "here"],
      ["거기", "there"],
      ["저기", "over there"],
      ["누구", "who"],
      ["뭐", "what"],
      ["어디", "where"],
      ["언제", "when"],
      ["왜", "why"],
      ["어떻게", "how"],
      ["몇", "how many"],
      ["어느", "which"],
      ["무슨", "what kind of"],
      ["지금", "now"],
      ["아직", "still / yet"],
      ["벌써", "already"],
      ["다시", "again"],
      ["같이", "together"],
      ["혼자", "alone"],
      ["정말", "really"],
      ["조금", "a little"],
      ["많이", "a lot"],
      ["빨리", "quickly"],
      ["천천히", "slowly"],
      ["먼저", "first / before"],
    ],
  },
  {
    group: "numbers-time",
    category: "Core Korean · Numbers & Time",
    topic: "time",
    level: "a1",
    words: [
      ["하나", "one (native Korean)"],
      ["둘", "two (native Korean)"],
      ["셋", "three (native Korean)"],
      ["넷", "four (native Korean)"],
      ["다섯", "five (native Korean)"],
      ["여섯", "six (native Korean)"],
      ["일곱", "seven (native Korean)"],
      ["여덟", "eight (native Korean)"],
      ["아홉", "nine (native Korean)"],
      ["열", "ten (native Korean)"],
      ["일", "one / day (Sino-Korean)"],
      ["이", "two (Sino-Korean)"],
      ["삼", "three (Sino-Korean)"],
      ["사", "four (Sino-Korean)"],
      ["오", "five (Sino-Korean)"],
      ["월", "month"],
      ["년", "year"],
      ["요일", "day of the week"],
      ["시", "hour / o'clock"],
      ["분", "minute"],
      ["명", "people counter"],
      ["개", "general item counter"],
      ["번", "number / times counter"],
      ["살", "age counter"],
      ["층", "floor counter"],
      ["잔", "cup / glass counter"],
      ["병", "bottle counter"],
      ["대", "machine / vehicle counter"],
      ["권", "book counter"],
      ["장", "flat item / page counter"],
    ],
  },
  {
    group: "workplace",
    category: "Core Korean · Workplace",
    topic: "workplace",
    level: "a2",
    words: [
      ["회의", "meeting"],
      ["일정", "schedule"],
      ["업무", "work / duty"],
      ["작업", "task / work"],
      ["담당", "responsibility / charge"],
      ["담당자", "person in charge"],
      ["팀", "team"],
      ["팀장", "team leader"],
      ["부장", "department manager"],
      ["차장", "deputy general manager"],
      ["과장", "manager"],
      ["동료", "coworker"],
      ["출근", "going to work"],
      ["퇴근", "leaving work"],
      ["연차", "paid leave"],
      ["휴가", "vacation / leave"],
      ["보고서", "report"],
      ["문서", "document"],
      ["자료", "material / data"],
      ["내용", "content"],
      ["안건", "agenda item"],
      ["요청", "request"],
      ["질문", "question"],
      ["답변", "answer"],
      ["설명", "explanation"],
      ["확인", "check / confirmation"],
      ["공유", "sharing"],
      ["진행", "progress / proceeding"],
      ["완료", "completion"],
      ["마감", "deadline"],
      ["마감일", "deadline date"],
      ["우선순위", "priority"],
      ["상황", "situation / status"],
      ["결과", "result"],
      ["계획", "plan"],
      ["변경", "change"],
      ["승인", "approval"],
      ["결재", "approval / sign-off"],
      ["메일", "email"],
      ["메신저", "messenger / chat"],
    ],
  },
  {
    group: "developer",
    category: "Core Korean · Developer",
    topic: "developer",
    level: "a2",
    words: [
      ["개발", "development"],
      ["개발자", "developer"],
      ["코드", "code"],
      ["기능", "feature"],
      ["버그", "bug"],
      ["오류", "error"],
      ["에러", "error (loanword)"],
      ["서버", "server"],
      ["클라이언트", "client"],
      ["데이터베이스", "database"],
      ["데이터", "data"],
      ["API", "API"],
      ["화면", "screen / UI"],
      ["페이지", "page"],
      ["버전", "version"],
      ["브랜치", "branch"],
      ["커밋", "commit"],
      ["풀 리퀘스트", "pull request"],
      ["리뷰", "review"],
      ["테스트", "test"],
      ["배포", "deployment"],
      ["운영", "production / operations"],
      ["개발하다", "to develop"],
      ["구현하다", "to implement"],
      ["수정하다", "to fix / modify"],
      ["처리하다", "to process / handle"],
      ["공유하다", "to share"],
      ["연결하다", "to connect"],
      ["변경하다", "to change / modify"],
      ["추가하다", "to add"],
      ["삭제하다", "to delete"],
      ["저장하다", "to save"],
      ["조회하다", "to query / retrieve"],
      ["등록하다", "to register"],
      ["발생하다", "to occur"],
      ["해결하다", "to resolve"],
      ["검토하다", "to review / examine"],
      ["적용하다", "to apply"],
      ["실행하다", "to run / execute"],
      ["설정하다", "to configure / set"],
    ],
  },
]

function posTag(group: CoreKoreanGroup, term: string): string {
  if (group === "verbs") return "pos:verb"
  if (group === "descriptive-verbs") return "pos:descriptive-verb"
  if (group === "daily-nouns" || group === "workplace") return "pos:noun"
  if (group === "developer") return term.endsWith("하다") ? "pos:verb" : "pos:noun"
  if (group === "numbers-time") return "pos:number-counter"
  return "pos:function-word"
}

export const CORE_KOREAN_300: CoreKoreanEntry[] = CORE_GROUPS.flatMap((group) =>
  group.words.map(([term, meaning]) => ({
    rank: 0,
    term,
    meaning,
    group: group.group,
    category: group.category,
    tags: [
      "core",
      "core:300",
      `level:${group.level}`,
      `topic:${group.topic}`,
      posTag(group.group, term),
    ],
  })),
).map((entry, index) => ({ ...entry, rank: index + 1 }))

export const CORE_KOREAN_TOTAL = CORE_KOREAN_300.length

export function normalizeCoreKoreanTerm(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR")
}

const CORE_TERM_SET = new Set(CORE_KOREAN_300.map((entry) => normalizeCoreKoreanTerm(entry.term)))

export function isCoreKoreanWord(word: Pick<VocabItem, "term">): boolean {
  return CORE_TERM_SET.has(normalizeCoreKoreanTerm(word.term))
}

function strongerCard(a: VocabItem, b: VocabItem): VocabItem {
  if (b.mastery !== a.mastery) return b.mastery > a.mastery ? b : a
  if (b.repetitions !== a.repetitions) return b.repetitions > a.repetitions ? b : a
  return a
}

export interface CoreKoreanCoverage {
  savedCount: number
  missingCount: number
  masteredCount: number
  averageMastery: number
  duplicateRows: number
  savedWords: VocabItem[]
  missingEntries: CoreKoreanEntry[]
}

export function getCoreKoreanCoverage(words: VocabItem[]): CoreKoreanCoverage {
  const matchingRows = new Map<string, VocabItem[]>()
  for (const word of words) {
    const key = normalizeCoreKoreanTerm(word.term)
    if (!CORE_TERM_SET.has(key)) continue
    const bucket = matchingRows.get(key) ?? []
    bucket.push(word)
    matchingRows.set(key, bucket)
  }

  const savedWords: VocabItem[] = []
  let duplicateRows = 0
  for (const bucket of matchingRows.values()) {
    savedWords.push(bucket.reduce(strongerCard))
    duplicateRows += Math.max(0, bucket.length - 1)
  }

  const savedKeys = new Set(savedWords.map((word) => normalizeCoreKoreanTerm(word.term)))
  const missingEntries = CORE_KOREAN_300.filter(
    (entry) => !savedKeys.has(normalizeCoreKoreanTerm(entry.term)),
  )
  const masteryTotal = savedWords.reduce((sum, word) => sum + word.mastery, 0)

  return {
    savedCount: savedWords.length,
    missingCount: missingEntries.length,
    masteredCount: savedWords.filter((word) => word.mastery >= 80).length,
    averageMastery: savedWords.length ? Math.round(masteryTotal / savedWords.length) : 0,
    duplicateRows,
    savedWords,
    missingEntries,
  }
}

export function nextCoreKoreanBatch(words: VocabItem[], limit = 20): CoreKoreanEntry[] {
  return getCoreKoreanCoverage(words).missingEntries.slice(0, Math.max(0, limit))
}
