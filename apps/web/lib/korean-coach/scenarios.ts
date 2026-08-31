import { koreanScenarioSchema, type KoreanScenario } from "./schemas"

const workplace = (
  scenario: Omit<KoreanScenario, "category" | "difficulty" | "estimatedMinutes"> &
    Partial<Pick<KoreanScenario, "difficulty" | "estimatedMinutes">>,
): KoreanScenario => ({
  ...scenario,
  category: "workplace",
  difficulty: scenario.difficulty ?? "beginner",
  estimatedMinutes: scenario.estimatedMinutes ?? 7,
})

const daily = (
  scenario: Omit<KoreanScenario, "category" | "difficulty" | "estimatedMinutes"> &
    Partial<Pick<KoreanScenario, "difficulty" | "estimatedMinutes">>,
): KoreanScenario => ({
  ...scenario,
  category: "daily",
  difficulty: scenario.difficulty ?? "beginner",
  estimatedMinutes: scenario.estimatedMinutes ?? 7,
})

export const KOREAN_COACH_SCENARIOS: KoreanScenario[] = [
  workplace({
    id: "morning-greeting",
    koreanTitle: "동료와 아침 인사",
    englishTitle: "Morning greeting with coworkers",
    description: "Start the workday with a friendly greeting and one short follow-up.",
    learningObjectives: ["Use a natural workplace greeting", "Ask a simple polite follow-up"],
    usefulVocabulary: [
      { korean: "좋은 아침이에요", meaning: "Good morning" },
      { korean: "출근하다", meaning: "to come to work" },
      { korean: "오늘", meaning: "today" },
    ],
    openingMessage: {
      korean: "좋은 아침이에요. 오늘 기분이 어때요?",
      romanization: "Joeun achimieyo. Oneul gibuni eottaeyo?",
      english: "Good morning. How are you feeling today?",
    },
    hint: "Start with 좋아요 or 조금 피곤해요, then add one short reason.",
  }),
  workplace({
    id: "ask-deadline",
    koreanTitle: "마감일 묻기",
    englishTitle: "Asking about a deadline",
    description: "Ask when a task is due and confirm the date politely.",
    learningObjectives: ["Ask when something is due", "Confirm a schedule"],
    usefulVocabulary: [
      { korean: "마감일", meaning: "deadline" },
      { korean: "언제예요?", meaning: "When is it?" },
      { korean: "까지", meaning: "by / until" },
    ],
    openingMessage: {
      korean: "이 작업의 마감일을 확인하셨어요?",
      romanization: "I jag-eobui magamireul hwaginhashyeosseoyo?",
      english: "Did you check the deadline for this task?",
    },
    hint: "Ask: 이 작업 마감일이 언제예요?",
  }),
  workplace({
    id: "progress-update",
    koreanTitle: "업무 진행 상황 공유",
    englishTitle: "Giving a work progress update",
    description: "Explain what is finished, what remains, and whether you have a blocker.",
    learningObjectives: ["Report progress clearly", "Describe remaining work"],
    usefulVocabulary: [
      { korean: "진행 상황", meaning: "progress status" },
      { korean: "완료하다", meaning: "to complete" },
      { korean: "남다", meaning: "to remain" },
    ],
    openingMessage: {
      korean: "지금 작업은 얼마나 진행됐어요?",
      romanization: "Jigeum jag-eobeun eolmana jinhaengdwaesseoyo?",
      english: "How far along is the task now?",
    },
    hint: "Use 지금 …까지 완료했고, …가 남았어요.",
  }),
  workplace({
    id: "explain-again",
    koreanTitle: "다시 설명 부탁하기",
    englishTitle: "Asking a manager to explain something again",
    description: "Politely say you missed part of an explanation and ask to hear it again.",
    learningObjectives: ["Ask for repetition respectfully", "Identify the unclear part"],
    usefulVocabulary: [
      { korean: "다시", meaning: "again" },
      { korean: "설명해 주세요", meaning: "please explain" },
      { korean: "잘 이해하지 못했어요", meaning: "I did not understand well" },
    ],
    openingMessage: {
      korean: "제가 설명한 내용 이해하셨어요?",
      romanization: "Jega seolmyeonghan naeyong ihaehasyeosseoyo?",
      english: "Did you understand what I explained?",
    },
    hint: "Say 죄송하지만, 마지막 부분을 다시 설명해 주세요.",
  }),
  workplace({
    id: "discuss-bug",
    koreanTitle: "버그 논의하기",
    englishTitle: "Discussing a bug",
    description: "Describe a software problem, when it happens, and what you checked.",
    learningObjectives: ["Describe a bug symptom", "Explain reproduction conditions"],
    usefulVocabulary: [
      { korean: "오류가 발생하다", meaning: "an error occurs" },
      { korean: "재현하다", meaning: "to reproduce" },
      { korean: "로그", meaning: "log" },
    ],
    openingMessage: {
      korean: "어떤 상황에서 오류가 발생해요?",
      romanization: "Eotteon sanghwangeseo oryuga balsanghaeyo?",
      english: "In what situation does the error occur?",
    },
    hint: "Use …할 때 오류가 발생해요.",
    difficulty: "lower-intermediate",
    estimatedMinutes: 10,
  }),
  workplace({
    id: "request-feedback",
    koreanTitle: "피드백 요청하기",
    englishTitle: "Requesting feedback",
    description: "Ask a teammate to review your work and name the part you want feedback on.",
    learningObjectives: ["Make a polite review request", "Specify what feedback you need"],
    usefulVocabulary: [
      { korean: "검토하다", meaning: "to review" },
      { korean: "피드백", meaning: "feedback" },
      { korean: "괜찮으시면", meaning: "if it is okay with you" },
    ],
    openingMessage: {
      korean: "어떤 부분을 검토해 드릴까요?",
      romanization: "Eotteon bubuneul geomtohae deurilkkayo?",
      english: "Which part should I review for you?",
    },
    hint: "Say 괜찮으시면 이 부분을 검토해 주세요.",
  }),
  workplace({
    id: "daily-standup",
    koreanTitle: "데일리 스탠드업",
    englishTitle: "Daily stand-up meeting",
    description: "Give a concise update about yesterday, today, and blockers.",
    learningObjectives: ["Give a three-part stand-up update", "Mention a blocker naturally"],
    usefulVocabulary: [
      { korean: "어제", meaning: "yesterday" },
      { korean: "오늘은", meaning: "as for today" },
      { korean: "막히는 부분", meaning: "a blocked part" },
    ],
    openingMessage: {
      korean: "어제는 어떤 작업을 하셨어요?",
      romanization: "Eojeneun eotteon jag-eobeul hasyeosseoyo?",
      english: "What work did you do yesterday?",
    },
    hint: "Answer with 어제는 …을 했어요. 오늘은 …할 예정이에요.",
    estimatedMinutes: 10,
  }),
  workplace({
    id: "ask-for-help",
    koreanTitle: "도움 요청하기",
    englishTitle: "Asking for help",
    description: "Politely interrupt a coworker, explain your problem, and ask for help.",
    learningObjectives: ["Open a request politely", "Explain a problem briefly"],
    usefulVocabulary: [
      { korean: "잠깐 괜찮으세요?", meaning: "Do you have a moment?" },
      { korean: "도와주실 수 있어요?", meaning: "Could you help me?" },
      { korean: "문제가 생기다", meaning: "a problem occurs" },
    ],
    openingMessage: {
      korean: "네, 무슨 일이에요?",
      romanization: "Ne, museun irieyo?",
      english: "Sure, what is it?",
    },
    hint: "Start with 잠깐 괜찮으세요? then say what is not working.",
  }),
  workplace({
    id: "confirm-schedule",
    koreanTitle: "일정 확인하기",
    englishTitle: "Confirming a schedule",
    description: "Confirm the date and time of a meeting or release.",
    learningObjectives: ["Confirm a date and time", "Correct a misunderstanding politely"],
    usefulVocabulary: [
      { korean: "일정", meaning: "schedule" },
      { korean: "맞나요?", meaning: "Is that right?" },
      { korean: "변경되다", meaning: "to be changed" },
    ],
    openingMessage: {
      korean: "내일 회의 시간이 몇 시였죠?",
      romanization: "Naeil hoeui sigani myeot siy-eotjyo?",
      english: "What time was tomorrow's meeting again?",
    },
    hint: "Use 내일 오후 세 시가 맞나요?",
  }),
  workplace({
    id: "report-complete",
    koreanTitle: "업무 완료 보고",
    englishTitle: "Reporting that a task is complete",
    description: "Report completion and mention how the result can be checked.",
    learningObjectives: ["Report completion professionally", "Offer the next action"],
    usefulVocabulary: [
      { korean: "완료했습니다", meaning: "I completed it" },
      { korean: "확인해 주세요", meaning: "please check" },
      { korean: "반영하다", meaning: "to apply / reflect" },
    ],
    openingMessage: {
      korean: "요청드린 작업은 어떻게 됐어요?",
      romanization: "Yocheongdeurin jag-eobeun eotteoke dwaesseoyo?",
      english: "What happened with the task I requested?",
    },
    hint: "Say 요청하신 작업은 완료했고, …에서 확인하실 수 있어요.",
  }),
  daily({
    id: "restaurant-order",
    koreanTitle: "식당에서 주문하기",
    englishTitle: "Ordering at a restaurant",
    description: "Order food, answer a follow-up, and make one simple request.",
    learningObjectives: ["Order politely", "Make a simple request"],
    usefulVocabulary: [
      { korean: "주문할게요", meaning: "I will order" },
      { korean: "덜 맵게", meaning: "less spicy" },
      { korean: "주세요", meaning: "please give me" },
    ],
    openingMessage: {
      korean: "주문하시겠어요?",
      romanization: "Jumunhasigesseoyo?",
      english: "Would you like to order?",
    },
    hint: "Say … 하나 주세요, then add a request if you want.",
  }),
  daily({
    id: "convenience-store",
    koreanTitle: "편의점에서 쇼핑하기",
    englishTitle: "Shopping at a convenience store",
    description: "Buy an item and respond to common checkout questions.",
    learningObjectives: ["Understand checkout questions", "Ask for a bag or receipt"],
    usefulVocabulary: [
      { korean: "봉투", meaning: "bag" },
      { korean: "영수증", meaning: "receipt" },
      { korean: "데워 드릴까요?", meaning: "Shall I heat it for you?" },
    ],
    openingMessage: {
      korean: "이거 데워 드릴까요?",
      romanization: "Igeo dewo deurilkkayo?",
      english: "Shall I heat this for you?",
    },
    hint: "Answer 네, 데워 주세요 or 아니요, 괜찮아요.",
  }),
  daily({
    id: "taxi",
    koreanTitle: "택시 타기",
    englishTitle: "Taking a taxi",
    description: "Tell the driver your destination and where to stop.",
    learningObjectives: ["Give a destination", "Ask to stop at a location"],
    usefulVocabulary: [
      { korean: "가 주세요", meaning: "please go to" },
      { korean: "여기서 세워 주세요", meaning: "please stop here" },
      { korean: "얼마나 걸려요?", meaning: "How long does it take?" },
    ],
    openingMessage: {
      korean: "어디로 가세요?",
      romanization: "Eodiro gaseyo?",
      english: "Where are you going?",
    },
    hint: "Say place + 로 가 주세요.",
  }),
  daily({
    id: "directions",
    koreanTitle: "길 묻기",
    englishTitle: "Asking for directions",
    description: "Ask where a place is and understand a simple direction.",
    learningObjectives: ["Ask where a place is", "Confirm left, right, or straight"],
    usefulVocabulary: [
      { korean: "어디에 있어요?", meaning: "Where is it?" },
      { korean: "쭉 가세요", meaning: "go straight" },
      { korean: "오른쪽", meaning: "right side" },
    ],
    openingMessage: {
      korean: "네, 어디를 찾으세요?",
      romanization: "Ne, eodireul chajeuseyo?",
      english: "Sure, what are you looking for?",
    },
    hint: "Ask 죄송하지만, …이 어디에 있어요?",
  }),
  daily({
    id: "hospital",
    koreanTitle: "병원 방문하기",
    englishTitle: "Visiting a hospital",
    description: "Describe a simple symptom and say when it started.",
    learningObjectives: ["Describe a symptom", "Say how long it has lasted"],
    usefulVocabulary: [
      { korean: "아파요", meaning: "it hurts / I am sick" },
      { korean: "어제부터", meaning: "since yesterday" },
      { korean: "열이 나요", meaning: "I have a fever" },
    ],
    openingMessage: {
      korean: "어디가 불편하세요?",
      romanization: "Eodiga bulpyeonhaseyo?",
      english: "What feels uncomfortable?",
    },
    hint: "Say body part + 가 아파요, then when it started.",
  }),
  daily({
    id: "weather",
    koreanTitle: "날씨 이야기하기",
    englishTitle: "Talking about the weather",
    description: "Make everyday small talk about today's weather.",
    learningObjectives: ["Describe the weather", "Share a simple preference"],
    usefulVocabulary: [
      { korean: "쌀쌀해요", meaning: "it is chilly" },
      { korean: "습해요", meaning: "it is humid" },
      { korean: "비가 올 것 같아요", meaning: "it looks like rain" },
    ],
    openingMessage: {
      korean: "오늘 날씨가 어때요?",
      romanization: "Oneul nalssiga eottaeyo?",
      english: "How is the weather today?",
    },
    hint: "Use 오늘은 …고 …해요.",
  }),
  daily({
    id: "weekend-plans",
    koreanTitle: "주말 계획 이야기하기",
    englishTitle: "Making weekend plans",
    description: "Say what you plan to do and invite or respond to a friend.",
    learningObjectives: ["Describe a future plan", "Make or respond to an invitation"],
    usefulVocabulary: [
      { korean: "주말", meaning: "weekend" },
      { korean: "예정이에요", meaning: "I plan to" },
      { korean: "같이 갈래요?", meaning: "Would you like to go together?" },
    ],
    openingMessage: {
      korean: "이번 주말에 뭐 할 거예요?",
      romanization: "Ibeon jumare mwo hal geoyeyo?",
      english: "What are you going to do this weekend?",
    },
    hint: "Say 이번 주말에는 …할 거예요.",
  }),
  daily({
    id: "public-transport",
    koreanTitle: "대중교통 이용하기",
    englishTitle: "Using public transportation",
    description: "Ask which bus or subway route to take.",
    learningObjectives: ["Ask which route to use", "Confirm where to transfer"],
    usefulVocabulary: [
      { korean: "몇 번 버스", meaning: "which bus number" },
      { korean: "갈아타다", meaning: "to transfer" },
      { korean: "내리다", meaning: "to get off" },
    ],
    openingMessage: {
      korean: "어디까지 가세요?",
      romanization: "Eodikkaji gaseyo?",
      english: "Where are you going?",
    },
    hint: "Ask …에 가려면 몇 번 버스를 타야 해요?",
  }),
  daily({
    id: "korean-friend",
    koreanTitle: "한국 친구와 대화하기",
    englishTitle: "Talking with a Korean friend",
    description: "Have a relaxed but polite conversation about recent life.",
    learningObjectives: ["Answer an open question", "Ask a natural follow-up"],
    usefulVocabulary: [
      { korean: "요즘", meaning: "these days" },
      { korean: "지내다", meaning: "to spend time / get along" },
      { korean: "재미있다", meaning: "to be fun" },
    ],
    openingMessage: {
      korean: "요즘 어떻게 지내요?",
      romanization: "Yojeum eotteoke jinaeyo?",
      english: "How have you been lately?",
    },
    hint: "Say 요즘 …하면서 지내요, then ask 친구는요?",
    difficulty: "lower-intermediate",
  }),
  daily({
    id: "delivery-driver",
    koreanTitle: "배달 기사님과 통화하기",
    englishTitle: "Calling a delivery driver",
    description: "Give a short location instruction over the phone.",
    learningObjectives: [
      "Identify your building or entrance",
      "Give a concise delivery instruction",
    ],
    usefulVocabulary: [
      { korean: "입구", meaning: "entrance" },
      { korean: "문 앞", meaning: "in front of the door" },
      { korean: "놓아 주세요", meaning: "please leave it" },
    ],
    openingMessage: {
      korean: "안녕하세요, 배달 왔는데 건물 입구가 어디예요?",
      romanization: "Annyeonghaseyo, baedal wanneunde geonmul ipguga eodiyeyo?",
      english: "Hello, I am here with the delivery. Where is the building entrance?",
    },
    hint: "Say …쪽 입구로 오세요 or 문 앞에 놓아 주세요.",
    difficulty: "lower-intermediate",
  }),
]

export function validateKoreanCoachScenarios(
  scenarios: readonly KoreanScenario[] = KOREAN_COACH_SCENARIOS,
): KoreanScenario[] {
  const parsed = scenarios.map((scenario) => koreanScenarioSchema.parse(scenario))
  const ids = new Set(parsed.map((scenario) => scenario.id))
  if (ids.size !== parsed.length) throw new Error("Korean coach scenario IDs must be unique")
  return parsed
}

export function getKoreanCoachScenario(id: string): KoreanScenario | undefined {
  return KOREAN_COACH_SCENARIOS.find((scenario) => scenario.id === id)
}
