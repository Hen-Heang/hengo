// Mock-interview ("Exam Prep") domain logic for the K-Specialist Korean
// interview (제5회). The exam is Q&A only — no presentation — so this trains
// the live loop: hear a question, answer aloud, get judged on speaking,
// pronunciation, vocabulary, and confidence.
//
// The examiner is driven entirely through the existing chat-streaming backend
// (chatApi), so no new endpoint is required. We inject the instructions into
// the message text, the same approach useChat uses for language/dev-mode.

import { INTERVIEW_MODES, type InterviewModeConfig } from "./interview-modes"
import type { UnexpectedQuestion } from "./interview-unexpected"

export type InterviewTopicId = "weather" | "workplace-qa"

export interface VocabEntry {
  term: string
  meaning: string
  /** The smaller pass-first deck is shown before optional stretch vocabulary. */
  priority?: "core" | "stretch"
  /** Short topic sentence so the learner meets the word in context. */
  exampleKo?: string
  exampleEn?: string
}

export interface PhraseEntry {
  ko: string
  en: string
}

export interface PracticeQuestion extends PhraseEntry {
  /** A short 2–3 sentence response to shadow, then personalize. */
  answerKo?: string
  answerEn?: string
  /** The minimum content words to recall before revealing the model answer. */
  keywords?: string[]
}

export interface AnswerFrame {
  label: string
  useFor: string
  patternKo: string
  patternEn: string
  exampleKo: string
  exampleEn: string
}

export interface PrepSource {
  publisher: string
  title: string
  url: string
  usedFor: string
}

/** Optional curated study material shown alongside a topic. */
export interface InterviewPrep {
  vocabulary: VocabEntry[]
  keyPhrases: PhraseEntry[]
  sampleQuestions: PracticeQuestion[]
  answerFrames?: AnswerFrame[]
  sources?: PrepSource[]
}

/** One section of the prepared script the candidate submits before the exam. */
export interface ScriptSection {
  id: string
  titleKo: string
  titleEn: string
  /** Korean guidance on what to write in this section. */
  hint: string
}

export interface InterviewTopic {
  id: InterviewTopicId
  /** English label for the picker. */
  label: string
  /** Korean label as it appears on the exam announcement. */
  labelKo: string
  /** One-line English description of the angle to prepare. */
  description: string
  difficulty: "Easy–Medium" | "Medium" | "Hard"
  /** Marks the topic recommended for this candidate's level. */
  recommended?: boolean
  /** Extra context handed to the examiner so questions stay on-topic. */
  examinerBrief: string
  /** Curated vocab / phrases / likely questions to drill daily. */
  prep?: InterviewPrep
  /** Outline for the written script submitted before the exam. */
  scriptOutline?: ScriptSection[]
  /**
   * The candidate's own drafted script, keyed by `scriptOutline` section id.
   * Any section left empty in the editor falls back to this text on load;
   * whatever the candidate has actually written (locally or in their account)
   * always wins.
   */
  scriptSeed?: Record<string, string>
  /**
   * English translation of the script, keyed by section id. Shown in the
   * editor as an editable reference under each Korean section; used as the
   * default whenever the candidate hasn't saved their own English text.
   */
  scriptSeedEn?: Record<string, string>
}

// Section-by-section scaffold for the script the candidate writes and submits.
// Mirrors the examiner's question arc so practice and the written script align.
const WEATHER_SCRIPT_OUTLINE: ScriptSection[] = [
  {
    id: "intro",
    titleKo: "인사 및 주제 소개",
    titleEn: "Greeting & topic intro",
    hint: "간단히 인사하고 오늘 이야기할 주제를 소개하세요. 예: 안녕하세요. 저는 ___입니다. 오늘은 한국의 여름 날씨와 캄보디아 날씨에 대해 이야기하겠습니다.",
  },
  {
    id: "korea-summer",
    titleKo: "한국의 여름 날씨",
    titleEn: "Korea's summer weather",
    hint: "한국 여름의 특징을 설명하세요. 덥다, 습하다, 무덥다, 장마, 열대야 같은 표현을 사용해 보세요.",
  },
  {
    id: "compare",
    titleKo: "캄보디아 날씨와 비교",
    titleEn: "Compared with Cambodia",
    hint: "캄보디아 날씨와 어떻게 다른지 비교하세요. 어디가 더 덥고 더 습한지, 한국의 사계절과 캄보디아의 건기·우기의 차이, 기후 차이 등을 이야기해 보세요.",
  },
  {
    id: "daily-life",
    titleKo: "날씨와 일상생활",
    titleEn: "Weather & daily life",
    hint: "더위와 장마철이 출근, 잠, 에어컨 사용 등 일상생활에 어떤 영향을 주는지 이야기하세요.",
  },
  {
    id: "health",
    titleKo: "건강에 미치는 영향",
    titleEn: "Effects on health",
    hint: "더운 날씨가 건강에 어떤 영향을 주는지, 그리고 어떻게 건강을 지키는지 설명하세요. 수분 보충, 일사병, 냉방병 등.",
  },
  {
    id: "reflection",
    titleKo: "나의 경험과 느낀 점",
    titleEn: "My experience & reflection",
    hint: "처음 한국 여름을 겪었을 때와 지금을 비교해 보세요. '처음에는 ~했지만 지금은 ~' 표현이 유용합니다. 적응하다, 견디다, 고향 날씨가 그립다 같은 표현도 써 보세요.",
  },
  {
    id: "conclusion",
    titleKo: "마무리",
    titleEn: "Conclusion",
    hint: "이야기를 간단히 정리하고 마무리 인사를 하세요. 예: 들어 주셔서 감사합니다.",
  },
]

// The candidate's own drafted script, transcribed into the outline sections above.
const WEATHER_SCRIPT_SEED: Record<string, string> = {
  intro:
    "안녕하세요. 저는 캄보디아에서 온 히엉입니다.\n\n캄보디아 사람인 저에게 더운 날씨는 익숙합니다. 하지만 한국에서 처음 여름을 보내면서 두 나라의 더위가 많이 다르다는 것을 느꼈습니다.\n\n오늘은 한국과 캄보디아의 여름 날씨가 어떻게 다른지, 그리고 그 날씨가 생활과 건강에 어떤 영향을 주는지 제 경험과 함께 이야기해 보겠습니다.",
  "korea-summer":
    "한국의 여름은 6월부터 8월까지입니다. 더운 날에는 기온이 30도를 넘고 습도도 높습니다. 장마철에는 비가 며칠 동안 계속 오기도 합니다. 그래서 기온이 캄보디아보다 낮아도 더 답답하고 덥게 느껴질 때가 있습니다.\n\n한국 사람들은 우산을 가지고 다니고, 에어컨이 있는 곳에서 시간을 보냅니다. 수영장이나 바다에 가기도 하고, 삼계탕을 먹으면서 힘을 내기도 합니다.\n\n저는 한국에서 더운 날에 수박 주스를 마시는 것을 좋아합니다. 수박 주스는 시원하고 달아서 마시면 기분이 좋아집니다.",
  compare:
    "캄보디아에는 한국처럼 봄, 여름, 가을, 겨울이 없습니다. 대신 건기와 우기, 두 계절이 있습니다. 3월부터 5월까지는 매우 덥고, 특히 4월이 가장 덥습니다. 기온이 40도 가까이 올라갈 때도 있습니다.\n\n4월에는 캄보디아 새해가 있습니다. 날씨는 아주 덥지만, 많은 사람들이 가족과 시간을 보내거나 여행을 갑니다.\n\n저도 더운 계절에는 친구들과 캄폿이나 시아누크빌에 가곤 했습니다. 낮에는 너무 더워서 주로 실내에서 쉬었습니다. 저녁에는 조금 시원해져서 친구들과 밖에 나갔습니다.\n\n캄보디아에서는 더운 날에 코코넛 커피를 자주 마셨습니다. 코코넛 커피는 달고 시원해서 더운 날씨와 잘 어울립니다. 한국에서는 수박 주스를 마시고, 캄보디아에서는 코코넛 커피를 마신다는 점도 재미있는 차이입니다.\n\n비가 오는 모습도 다릅니다. 한국에서는 장마철에 비가 오랫동안 내립니다. 하지만 캄보디아에서는 비가 갑자기 많이 내렸다가 빨리 그칠 때가 많습니다.\n\n그래서 한국에서는 우산이 중요하지만, 캄보디아에서는 그늘을 찾는 것이 더 중요하다고 생각합니다.",
  "daily-life":
    "날씨가 다르면 생활하는 방법도 달라집니다. 날씨가 너무 더우면 낮에 밖에서 활동하는 시간이 줄어듭니다. 그리고 에어컨이나 선풍기를 더 많이 사용하게 됩니다.",
  health:
    "더운 날씨는 건강에도 영향을 줍니다. 한국에서는 습도가 높아서 땀이 많이 나고, 밤에도 더워서 잠을 잘 못 잘 때가 있습니다. 캄보디아에서는 햇빛이 매우 강해서 밖에 오래 있으면 쉽게 피곤해집니다.\n\n그래서 저는 물을 자주 마시고, 가장 더운 시간에는 밖에 오래 있지 않으려고 합니다.",
  reflection:
    "이번 한국 여름에는 새로운 경험도 많이 했습니다.\n\n먼저 친구와 함께 여의도 한강 수영장에 갔습니다. 한국의 여름에 수영한 것은 이번이 처음이었습니다. 사람이 정말 많았지만 분위기가 즐거웠고, 좋은 추억이 되었습니다.\n\n또 친구와 함께 선유도공원에도 갔습니다. 공원을 오래 걸어서 조금 피곤했지만, 나무와 강을 보니 기분이 좋았습니다. 저녁까지 공원에 있으면서 서울의 아름다운 야경을 구경하고 사진도 많이 찍었습니다.\n\n제가 한국 여름에 꼭 해 보고 싶은 일도 있습니다. 저는 자전거 타는 것을 정말 좋아합니다. 그래서 저녁에 한강에서 자전거를 타고 싶습니다.\n\n자전거를 타면서 시원한 바람을 느끼고, 푸른 나무와 강 풍경도 보고 싶습니다. 운동도 하고 서울의 여름 풍경도 즐길 수 있어서 좋을 것 같습니다.\n\n그리고 기회가 된다면 영종도 바다에도 가 보고 싶습니다. 바닷가를 걸으면서 시원한 바람을 느끼고 한국의 여름을 즐기고 싶습니다.\n\n처음에는 한국 여름이 덥고 습해서 힘들었습니다. 하지만 물을 자주 마시고, 날씨를 미리 확인하고, 시원한 곳에서 쉬면서 조금씩 익숙해지고 있습니다.",
  conclusion:
    "두 나라 모두 날씨가 덥지만, 사람들이 더위를 피하는 방법은 조금 다릅니다.\n\n이번 경험을 통해 날씨에 맞게 생활하고 건강을 관리하는 것이 중요하다는 것을 알게 되었습니다. 앞으로도 건강을 잘 관리하면서 한국의 여름을 즐기고 싶습니다.\n\n감사합니다.",
}

// The candidate's own English translation of the script (from the same prep
// doc), section by section, mirroring WEATHER_SCRIPT_SEED's paragraphing.
const WEATHER_SCRIPT_SEED_EN: Record<string, string> = {
  intro:
    "Hello. My name is Heang, and I am from Cambodia.\n\nAs a Cambodian, I am familiar with hot weather. However, while spending my first summer in Korea, I realized that the heat in the two countries is very different.\n\nToday, I would like to talk about the differences between summer weather in Korea and Cambodia. I will also explain how the weather affects daily life and health based on my own experience.",
  "korea-summer":
    "Summer in Korea is from June to August. On hot days, the temperature rises above 30 degrees, and the humidity is also high. During the rainy season, it can rain continuously for several days. Therefore, even when the temperature is lower than in Cambodia, it sometimes feels more uncomfortable and hotter.\n\nKorean people carry umbrellas and spend time in places with air conditioning. They also go to swimming pools or the beach, and some people eat samgyetang to regain their energy.\n\nIn Korea, I like drinking watermelon juice on hot days. Watermelon juice is cool and sweet, so it makes me feel good.",
  compare:
    "Cambodia does not have spring, summer, autumn, and winter like Korea. Instead, it has two seasons: the dry season and the rainy season. The period from March to May is very hot, and April is especially hot. Sometimes, the temperature rises to nearly 40 degrees.\n\nCambodian New Year is also in April. Although the weather is very hot, many people spend time with their families or travel.\n\nDuring the hot season, I often went to Kampot or Sihanoukville with my friends. During the daytime, it was too hot, so I usually rested indoors. In the evening, the weather became a little cooler, so I went outside with my friends.\n\nIn Cambodia, I often drank coconut coffee on hot days. Coconut coffee is sweet and cool, so it is a good drink for hot weather. It is also an interesting difference that I drink watermelon juice in Korea and coconut coffee in Cambodia.\n\nThe rain is also different. In Korea, rain continues for a long time during the rainy season. However, in Cambodia, it often rains heavily and suddenly and then stops quickly.\n\nTherefore, I think an umbrella is important in Korea, but finding shade is more important in Cambodia.",
  "daily-life":
    "When the weather is different, the way people live also changes. When the weather is too hot, people spend less time doing outdoor activities during the daytime. They also use air conditioners and fans more often.",
  health:
    "Hot weather also affects our health. In Korea, the high humidity makes me sweat a lot. Sometimes, it is difficult to sleep because the nights are hot. In Cambodia, the sunlight is very strong, so people can become tired easily when they stay outside for a long time.\n\nTherefore, I drink water frequently and try not to stay outside for too long during the hottest part of the day.",
  reflection:
    "This summer, I also had many new experiences in Korea.\n\nFirst, I went to the Yeouido Hangang Swimming Pool with my friend. It was my first time swimming during the summer in Korea. There were many people, but the atmosphere was enjoyable, and it became a good memory.\n\nI also visited Seonyudo Park with my friend. I felt a little tired because we walked around the park for a long time, but seeing the trees and the river made me feel good. We stayed at the park until the evening, enjoyed the beautiful night view of Seoul, and took many photos.\n\nThere is also something I really want to do during the Korean summer. I really like riding a bicycle, so I want to ride one along the Han River in the evening.\n\nWhile riding, I want to feel the cool breeze and enjoy the green trees and river view. I think it will be great because I can exercise and enjoy the summer scenery of Seoul at the same time.\n\nI would also like to visit the beach in Yeongjongdo if I have the chance. I want to walk near the sea, feel the cool breeze, and enjoy the Korean summer.\n\nAt first, the Korean summer was difficult for me because it was hot and humid. However, I am gradually getting used to it by drinking water frequently, checking the weather in advance, and resting in cool places.",
  conclusion:
    "The weather is hot in both countries, but the ways people avoid the heat are a little different.\n\nThrough this experience, I learned that it is important to adjust our daily lives to the weather and take care of our health. In the future, I want to continue taking good care of my health while enjoying the Korean summer.\n\nThank you.",
}

// A pass-first layer over the larger topic dictionary. Core words get a short
// sentence for recall/shadowing; everything else stays available as stretch
// vocabulary without overwhelming the learner on day one.
const WEATHER_VOCAB_DETAILS: Record<
  string,
  Pick<VocabEntry, "priority" | "exampleKo" | "exampleEn">
> = {
  덥다: {
    priority: "core",
    exampleKo: "한국의 여름은 매우 덥습니다.",
    exampleEn: "Summer in Korea is very hot.",
  },
  습하다: {
    priority: "core",
    exampleKo: "비가 온 뒤에는 날씨가 더 습합니다.",
    exampleEn: "After it rains, the weather is more humid.",
  },
  무덥다: {
    priority: "core",
    exampleKo: "장마철에는 날씨가 무척 무덥습니다.",
    exampleEn: "The weather is very muggy during the rainy season.",
  },
  장마: {
    priority: "core",
    exampleKo: "장마 때는 비가 많이 옵니다.",
    exampleEn: "It rains a lot during jangma.",
  },
  습도: {
    priority: "core",
    exampleKo: "습도가 높아서 더 덥게 느껴집니다.",
    exampleEn: "It feels hotter because the humidity is high.",
  },
  기온: {
    priority: "core",
    exampleKo: "낮 기온이 35도까지 올랐습니다.",
    exampleEn: "The daytime temperature rose to 35 degrees.",
  },
  열대야: {
    priority: "core",
    exampleKo: "열대야 때문에 잠을 잘 못 잤습니다.",
    exampleEn: "I could not sleep well because of the hot night.",
  },
  "땀이 나다": {
    priority: "core",
    exampleKo: "출근할 때 땀이 많이 납니다.",
    exampleEn: "I sweat a lot on my commute.",
  },
  시원하다: {
    priority: "core",
    exampleKo: "시원한 곳에서 쉬면 좋습니다.",
    exampleEn: "It is good to rest in a cool place.",
  },
  "수분 섭취": {
    priority: "core",
    exampleKo: "갈증이 없어도 수분을 섭취해야 합니다.",
    exampleEn: "You should drink fluids even when you are not thirsty.",
  },
  온열질환: {
    priority: "core",
    exampleKo: "폭염에는 온열질환을 조심해야 합니다.",
    exampleEn: "You must be careful of heat-related illness during a heat wave.",
  },
  건기: {
    priority: "core",
    exampleKo: "캄보디아에는 건기와 우기가 있습니다.",
    exampleEn: "Cambodia has a dry season and a wet season.",
  },
  우기: {
    priority: "core",
    exampleKo: "우기에는 비가 자주 옵니다.",
    exampleEn: "It rains often during the wet season.",
  },
  사계절: {
    priority: "core",
    exampleKo: "한국은 사계절이 뚜렷합니다.",
    exampleEn: "Korea has four distinct seasons.",
  },
  차이점: {
    priority: "core",
    exampleKo: "가장 큰 차이점은 계절입니다.",
    exampleEn: "The biggest difference is the seasons.",
  },
  반면에: {
    priority: "core",
    exampleKo: "한국은 사계절이 있는 반면에 캄보디아는 두 계절이 있습니다.",
    exampleEn: "Korea has four seasons, whereas Cambodia has two.",
  },
  적응하다: {
    priority: "core",
    exampleKo: "한국의 습한 여름에 적응하고 있습니다.",
    exampleEn: "I am adapting to Korea's humid summer.",
  },
  익숙해지다: {
    priority: "core",
    exampleKo: "지금은 더위에 조금 익숙해졌습니다.",
    exampleEn: "Now I have gotten a little used to the heat.",
  },
}

const WEATHER_ANSWER_FRAMES: AnswerFrame[] = [
  {
    label: "Direct answer + detail",
    useFor: "Describe the weather",
    patternKo: "___은/는 ___습니다. 특히 ___습니다.",
    patternEn: "___ is ___. In particular, ___.",
    exampleKo: "한국의 여름은 덥고 습합니다. 특히 장마철에 습도가 높습니다.",
    exampleEn:
      "Korean summer is hot and humid. In particular, humidity is high during the rainy season.",
  },
  {
    label: "Compare two countries",
    useFor: "Korea vs. Cambodia",
    patternKo: "A는 ___한 반면에 B는 ___합니다.",
    patternEn: "Whereas A is ___, B is ___.",
    exampleKo: "한국은 사계절이 있는 반면에 캄보디아는 건기와 우기가 있습니다.",
    exampleEn: "Korea has four seasons, whereas Cambodia has a dry and a wet season.",
  },
  {
    label: "Cause + effect",
    useFor: "Daily-life and health effects",
    patternKo: "___기 때문에 ___게 됩니다.",
    patternEn: "Because ___, it causes / makes me ___.",
    exampleKo: "습도가 높기 때문에 쉽게 피곤해집니다.",
    exampleEn: "Because the humidity is high, I get tired easily.",
  },
  {
    label: "Action + purpose",
    useFor: "How you protect your health",
    patternKo: "___기 위해서 ___려고 합니다.",
    patternEn: "To ___, I try to ___.",
    exampleKo: "온열질환을 예방하기 위해서 물을 자주 마시려고 합니다.",
    exampleEn: "To prevent heat-related illness, I try to drink water often.",
  },
  {
    label: "Personal experience",
    useFor: "Follow-up questions",
    patternKo: "___(으)ㄴ 적이 있습니다. 그때 ___습니다.",
    patternEn: "I have experienced ___. At that time, ___.",
    exampleKo: "열대야 때문에 잠을 잘 못 잔 적이 있습니다. 그때 아침에 많이 피곤했습니다.",
    exampleEn:
      "I once could not sleep well because of a hot night. I was very tired the next morning.",
  },
  {
    label: "Show adaptation",
    useFor: "Reflection and confidence",
    patternKo: "처음에는 ___지만 지금은 ___습니다.",
    patternEn: "At first ___, but now ___.",
    exampleKo: "처음에는 많이 힘들었지만 지금은 조금씩 적응하고 있습니다.",
    exampleEn: "It was very hard at first, but now I am gradually adapting.",
  },
]

const WEATHER_CORE_ANSWERS: Record<
  string,
  Pick<PracticeQuestion, "answerKo" | "answerEn" | "keywords">
> = {
  "한국의 여름 날씨는 어때요?": {
    answerKo:
      "한국의 여름은 덥고 습합니다. 특히 장마철에는 습도가 높아서 실제 기온보다 더 덥게 느껴집니다.",
    answerEn:
      "Korean summer is hot and humid. Especially during the rainy season, the high humidity makes it feel hotter than the actual temperature.",
    keywords: ["덥고 습하다", "장마철", "습도"],
  },
  "캄보디아의 날씨와 어떻게 달라요?": {
    answerKo:
      "한국은 사계절이 있는 반면에 캄보디아는 건기와 우기가 있습니다. 캄보디아는 일 년 내내 덥지만 한국은 계절별 기온 차이가 큽니다.",
    answerEn:
      "Korea has four seasons, whereas Cambodia has a dry and a wet season. Cambodia is hot all year, but Korea's temperature changes greatly by season.",
    keywords: ["사계절", "건기와 우기", "기온 차이"],
  },
  "한국 여름과 캄보디아 여름 중에서 어디가 더 더워요?": {
    answerKo:
      "실제 기온은 캄보디아가 더 높을 때가 많습니다. 하지만 한국은 습도가 높아서 체감상 더 힘들게 느껴질 때도 있습니다.",
    answerEn:
      "The actual temperature is often higher in Cambodia. However, Korea's high humidity can sometimes make the heat feel harder to bear.",
    keywords: ["실제 기온", "습도", "체감상"],
  },
  "장마철에 대해 어떻게 생각해요?": {
    answerKo:
      "장마철에는 습도가 높고 갑자기 비가 많이 와서 불편합니다. 그래서 외출할 때 우산을 챙기고 날씨 예보를 확인합니다.",
    answerEn:
      "The rainy season is inconvenient because humidity is high and heavy rain can start suddenly. So I carry an umbrella and check the forecast before going out.",
    keywords: ["습도", "비가 많이 오다", "우산"],
  },
  "더운 날씨가 건강에 어떤 영향을 줘요?": {
    answerKo:
      "날씨가 더우면 땀을 많이 흘리고 쉽게 피곤해집니다. 수분을 충분히 섭취하지 않으면 탈수 증상이나 온열질환이 생길 수 있습니다.",
    answerEn:
      "In hot weather, I sweat a lot and get tired easily. Without enough fluids, dehydration symptoms or heat-related illness can occur.",
    keywords: ["땀", "피곤하다", "온열질환"],
  },
  "더위를 이기기 위해서 무엇을 해요?": {
    answerKo:
      "물을 자주 마시고 시원한 곳에서 충분히 쉽니다. 가장 더운 시간대에는 야외 활동을 줄이려고 합니다.",
    answerEn:
      "I drink water often and rest enough in a cool place. I try to reduce outdoor activity during the hottest hours.",
    keywords: ["물을 마시다", "시원한 곳", "휴식"],
  },
  "한국에 와서 날씨 때문에 힘들었던 적이 있어요?": {
    answerKo:
      "네, 열대야 때문에 잠을 잘 못 잔 적이 있습니다. 그때 아침에 많이 피곤했지만 지금은 조금씩 적응하고 있습니다.",
    answerEn:
      "Yes, I once could not sleep well because of a hot night. I was very tired in the morning, but now I am gradually adapting.",
    keywords: ["열대야", "잠을 못 자다", "적응하다"],
  },
  "여름에 건강을 지키기 위해서 어떻게 해요?": {
    answerKo:
      "갈증이 나지 않아도 물을 규칙적으로 마십니다. 또 햇볕을 피하고 더운 시간에는 휴식하려고 합니다.",
    answerEn:
      "I drink water regularly even when I am not thirsty. I also avoid direct sunlight and try to rest during hot hours.",
    keywords: ["규칙적으로", "햇볕을 피하다", "휴식"],
  },
  "캄보디아의 건기와 우기에 대해 설명해 줄 수 있어요?": {
    answerKo:
      "캄보디아의 건기는 보통 11월부터 4월까지이고, 우기는 5월부터 10월까지입니다. 가장 더운 시기는 보통 우기가 시작되기 전입니다.",
    answerEn:
      "Cambodia's dry season is generally November to April, and its wet season is May to October. The hottest time is usually just before the wet season begins.",
    keywords: ["건기", "우기", "5월부터 10월"],
  },
}

const WEATHER_SCRIPT_FOLLOW_UPS: PracticeQuestion[] = [
  {
    ko: "캄보디아 새해는 언제이고, 사람들은 보통 무엇을 합니까?",
    en: "When is Cambodian New Year, and what do people usually do?",
    answerKo:
      "캄보디아 새해는 4월에 있습니다. 날씨는 아주 덥지만, 많은 사람들이 가족과 시간을 보내거나 여행을 갑니다.",
    answerEn:
      "Cambodian New Year is in April. Although the weather is very hot, many people spend time with their families or travel.",
    keywords: ["캄보디아 새해", "4월", "가족"],
  },
  {
    ko: "한국에서 더운 날에 어떤 음료를 좋아합니까?",
    en: "What drink do you like on hot days in Korea?",
    answerKo:
      "저는 한국에서 더운 날에 수박 주스를 마시는 것을 좋아합니다. 시원하고 달아서 마시면 기분이 좋아집니다.",
    answerEn:
      "I like drinking watermelon juice on hot days in Korea. It is cool and sweet, so it makes me feel good.",
    keywords: ["수박 주스", "음료", "시원하다"],
  },
  {
    ko: "캄보디아에서 더운 날에 어떤 음료를 자주 마셨습니까?",
    en: "What drink did you often have on hot days in Cambodia?",
    answerKo:
      "캄보디아에서는 더운 날에 코코넛 커피를 자주 마셨습니다. 달고 시원해서 더운 날씨와 잘 어울립니다.",
    answerEn:
      "In Cambodia, I often drank coconut coffee on hot days. It is sweet and cool, so it goes well with hot weather.",
    keywords: ["코코넛 커피", "음료", "더운 날"],
  },
  {
    ko: "한국과 캄보디아에서 마시는 여름 음료는 어떻게 다릅니까?",
    en: "How are the summer drinks you have in Korea and Cambodia different?",
    answerKo:
      "한국에서는 수박 주스를 마시고, 캄보디아에서는 코코넛 커피를 마십니다. 두 음료 모두 달고 시원하지만 맛과 재료가 다릅니다.",
    answerEn:
      "In Korea, I drink watermelon juice, while in Cambodia, I drink coconut coffee. Both drinks are sweet and cool, but their flavors and ingredients are different.",
    keywords: ["수박 주스", "코코넛 커피", "비교"],
  },
  {
    ko: "한국과 캄보디아에서는 비가 오는 모습이 어떻게 다릅니까?",
    en: "How is the rain different in Korea and Cambodia?",
    answerKo:
      "한국에서는 장마철에 비가 오랫동안 내립니다. 하지만 캄보디아에서는 비가 갑자기 많이 내렸다가 빨리 그칠 때가 많습니다.",
    answerEn:
      "In Korea, rain continues for a long time during the rainy season. However, in Cambodia, it often rains heavily and suddenly and then stops quickly.",
    keywords: ["장마철", "갑자기", "비교"],
  },
  {
    ko: "왜 한국에서는 우산이 중요하고 캄보디아에서는 그늘이 중요하다고 생각합니까?",
    en: "Why do you think umbrellas are important in Korea and shade is important in Cambodia?",
    answerKo:
      "한국에서는 장마철에 비가 오래 내리기 때문에 우산이 중요합니다. 캄보디아에서는 햇빛이 매우 강하고 더워서 그늘을 찾는 것이 더 중요합니다.",
    answerEn:
      "In Korea, umbrellas are important because rain can continue for a long time during the rainy season. In Cambodia, finding shade is more important because the sunlight is very strong and the weather is hot.",
    keywords: ["우산", "그늘", "햇빛"],
  },
  {
    ko: "한국 여름에 꼭 해 보고 싶은 일은 무엇입니까?",
    en: "What is something you really want to do during the Korean summer?",
    answerKo:
      "저는 저녁에 한강에서 자전거를 타고 싶습니다. 자전거를 타면서 시원한 바람과 여름 풍경을 즐기고 싶습니다.",
    answerEn:
      "I want to ride a bicycle along the Han River in the evening. I want to enjoy the cool breeze and the summer scenery while riding.",
    keywords: ["한강", "자전거", "저녁"],
  },
  {
    ko: "왜 저녁에 한강에서 자전거를 타고 싶습니까?",
    en: "Why do you want to ride a bicycle along the Han River in the evening?",
    answerKo:
      "저녁에는 날씨가 조금 시원해서 자전거를 타기 좋습니다. 운동도 하고 푸른 나무와 강 풍경도 볼 수 있기 때문입니다.",
    answerEn:
      "I want to ride in the evening because the weather is cooler. I can exercise and also enjoy the green trees and river view.",
    keywords: ["한강", "자전거", "풍경"],
  },
  {
    ko: "영종도에 가면 무엇을 하고 싶습니까?",
    en: "What would you like to do if you visit Yeongjongdo?",
    answerKo:
      "영종도 바닷가를 걸으면서 시원한 바람을 느끼고 싶습니다. 한국의 여름 바다도 즐기고 싶습니다.",
    answerEn:
      "I want to walk near the beach in Yeongjongdo and feel the cool breeze. I also want to enjoy the Korean summer by the sea.",
    keywords: ["영종도", "바닷가", "바람"],
  },
  {
    ko: "두 나라의 여름을 경험하면서 무엇을 배웠습니까?",
    en: "What did you learn from experiencing summer in both countries?",
    answerKo:
      "날씨에 맞게 생활하고 건강을 관리하는 것이 중요하다는 것을 배웠습니다. 앞으로도 물을 자주 마시고 더운 시간에는 충분히 쉬려고 합니다.",
    answerEn:
      "I learned that it is important to adjust the way I live to the weather and take care of my health. I will continue to drink water often and rest enough during the hottest hours.",
    keywords: ["경험", "건강 관리", "적응"],
  },
]

// Curated study material for the chosen exam topic. Drilled daily, this is the
// 15–20 words and the handful of phrases that cover most of the Q&A.
const WEATHER_PREP: InterviewPrep = {
  vocabulary: [
    { term: "덥다", meaning: "to be hot" },
    { term: "습하다", meaning: "to be humid" },
    { term: "무덥다", meaning: "to be muggy (hot + humid)" },
    { term: "장마", meaning: "the rainy season (monsoon)" },
    { term: "장마철", meaning: "the rainy-season period" },
    { term: "소나기", meaning: "a sudden shower" },
    { term: "습도", meaning: "humidity (level)" },
    { term: "기온", meaning: "air temperature" },
    { term: "열대야", meaning: "a hot tropical night" },
    { term: "에어컨", meaning: "air conditioner" },
    { term: "선풍기", meaning: "electric fan" },
    { term: "땀", meaning: "sweat" },
    { term: "땀이 나다", meaning: "to sweat" },
    { term: "더위", meaning: "the heat" },
    { term: "더위를 먹다", meaning: "to suffer from the heat" },
    { term: "시원하다", meaning: "to be cool / refreshing" },
    { term: "수분 보충", meaning: "replenishing fluids / hydration" },
    { term: "일사병", meaning: "sunstroke / heat exhaustion" },
    { term: "냉방병", meaning: "illness from too much AC" },
    { term: "익숙해지다", meaning: "to get used to (something)" },
    { term: "건기", meaning: "the dry season (Cambodia)" },
    { term: "우기", meaning: "the wet/rainy season (Cambodia)" },
    { term: "기후", meaning: "climate" },
    { term: "계절", meaning: "season" },
    { term: "사계절", meaning: "the four seasons" },
    { term: "폭염", meaning: "a heat wave" },
    { term: "자외선", meaning: "UV rays" },
    { term: "그늘", meaning: "shade" },
    { term: "환절기", meaning: "the changing-of-seasons period" },
    { term: "적응하다", meaning: "to adapt (to something)" },
    { term: "그립다", meaning: "to miss, to long for" },
    { term: "견디다", meaning: "to endure, to bear" },
    { term: "차이", meaning: "a difference" },
    // From TalkToMeInKorean "1100 Short & Useful Korean Phrases" (Pattern 009 example).
    { term: "미세먼지", meaning: "fine dust / particulate pollution" },
    { term: "불쾌지수", meaning: "discomfort index" },
    { term: "차이점", meaning: "point of difference" },
    { term: "반면에", meaning: "on the other hand" },
    { term: "식중독", meaning: "food poisoning" },
    { term: "탈수 증상", meaning: "dehydration symptoms" },
    { term: "수분 섭취", meaning: "water intake" },
    { term: "실내 활동", meaning: "indoor activities" },
    { term: "체력 관리", meaning: "physical strength management" },
    { term: "비슷하다", meaning: "to be similar" },
    // Everyday summer-heat intensifiers every Korean weather chat uses
    // (source: Korean weather-expression guides, e.g. aigokor.com, TOPIK Guide).
    { term: "무더위", meaning: "sweltering heat (noun)" },
    { term: "찜통더위", meaning: "steaming, sauna-like heat" },
    { term: "후텁지근하다", meaning: "to be muggy and stuffy" },
    { term: "햇볕", meaning: "sunshine, direct sunlight" },
    { term: "태풍", meaning: "typhoon" },
    { term: "일교차", meaning: "daily temperature swing" },
    // Heat-illness terms from the KDCA heat-wave health guidance
    // (질병관리청 온열질환 예방수칙: 물·그늘·휴식).
    { term: "온열질환", meaning: "heat-related illness (official term)" },
    { term: "열사병", meaning: "severe heatstroke" },
    { term: "어지럽다", meaning: "to feel dizzy" },
    { term: "두통", meaning: "a headache" },
    { term: "메스껍다", meaning: "to feel nauseous" },
    { term: "예방하다", meaning: "to prevent" },
    { term: "무리하다", meaning: "to overdo it, push too hard" },
    { term: "양산", meaning: "a parasol (sun umbrella)" },
    // Korean summer food culture — a very likely follow-up question.
    { term: "복날", meaning: "the dog days (hottest days; stamina-food days)" },
    { term: "보양식", meaning: "stamina food (eaten to beat the heat)" },
    { term: "삼계탕", meaning: "ginseng chicken soup" },
    { term: "이열치열", meaning: "fighting heat with heat (idiom)" },
    { term: "팥빙수", meaning: "shaved ice with red beans" },
    { term: "냉면", meaning: "cold noodles" },
    // Cambodia-side climate words for the comparison answers.
    { term: "열대 기후", meaning: "tropical climate" },
    { term: "스콜", meaning: "a squall (short intense tropical downpour)" },
  ].map((entry) => ({
    ...entry,
    priority: WEATHER_VOCAB_DETAILS[entry.term]?.priority ?? "stretch",
    exampleKo: WEATHER_VOCAB_DETAILS[entry.term]?.exampleKo,
    exampleEn: WEATHER_VOCAB_DETAILS[entry.term]?.exampleEn,
  })),
  keyPhrases: [
    { ko: "한국 여름은 정말 덥고 습해요.", en: "Korean summer is really hot and humid." },
    { ko: "캄보디아는 일 년 내내 더워요.", en: "Cambodia is hot all year round." },
    { ko: "장마철에는 비가 많이 와요.", en: "During the rainy season it rains a lot." },
    { ko: "저는 더위를 잘 타요.", en: "I'm very sensitive to the heat." },
    { ko: "에어컨이 없으면 잠을 못 자요.", en: "Without air conditioning I can't sleep." },
    { ko: "출근할 때 땀이 많이 나요.", en: "I sweat a lot on my commute to work." },
    { ko: "물을 자주 마시려고 해요.", en: "I try to drink water often." },
    {
      ko: "처음에는 힘들었지만 지금은 익숙해졌어요.",
      en: "At first it was hard, but now I've gotten used to it.",
    },
    {
      ko: "한국 여름이 캄보디아보다 더 습한 것 같아요.",
      en: "Korean summer feels more humid than Cambodia's.",
    },
    {
      ko: "건강을 위해서 무리하지 않으려고 해요.",
      en: "For my health, I try not to overdo it.",
    },
    {
      ko: "캄보디아는 건기와 우기로 나뉘어요.",
      en: "Cambodia is divided into a dry season and a rainy season.",
    },
    {
      ko: "한국은 사계절이 있지만 캄보디아는 그렇지 않아요.",
      en: "Korea has four seasons, but Cambodia doesn't.",
    },
    {
      ko: "한국 장마가 캄보디아 우기보다 짧은 것 같아요.",
      en: "Korea's rainy season seems shorter than Cambodia's wet season.",
    },
    { ko: "그늘에 있어도 더울 때가 많아요.", en: "Even in the shade, it's often still hot." },
    { ko: "고향 날씨가 그리울 때도 있어요.", en: "Sometimes I miss the weather back home." },
    {
      ko: "이제는 한국 더위를 잘 견딜 수 있어요.",
      en: "Now I can endure the Korean heat well.",
    },
    // From TalkToMeInKorean "Real-Life Korean Conversations: Intermediate",
    // Dialogue 02 "Exchanging Numbers" (formal small talk about weather).
    {
      ko: "날씨가 추워서 오시느라 고생하셨죠?",
      en: "It must've been hard to come here because of the cold weather, right?",
    },
    // Natural heat-talk lines built on 무더위/찜통더위/열대야/후텁지근하다
    // (standard summer expressions; see prep sources).
    { ko: "요즘 무더위가 계속되고 있어요.", en: "The sweltering heat continues these days." },
    {
      ko: "한국 여름은 후텁지근해서 밖에 나가기 힘들어요.",
      en: "Korean summer is so muggy that it's hard to go outside.",
    },
    {
      ko: "열대야 때문에 밤에 잠을 설칠 때가 있어요.",
      en: "Because of tropical nights, I sometimes sleep badly.",
    },
    // The official KDCA heat-safety rule — knowing it makes a strong answer.
    {
      ko: "폭염에는 물, 그늘, 휴식이 중요하다고 들었어요.",
      en: "I heard that in a heat wave, water, shade, and rest are important.",
    },
    {
      ko: "갈증이 없어도 물을 자주 마시는 게 좋아요.",
      en: "It's good to drink water often, even when you're not thirsty.",
    },
    {
      ko: "가장 더운 시간에는 야외 활동을 피하려고 해요.",
      en: "I try to avoid outdoor activities during the hottest hours.",
    },
    {
      ko: "어지럽거나 두통이 있으면 시원한 곳에서 쉬어야 해요.",
      en: "If you feel dizzy or have a headache, you should rest somewhere cool.",
    },
    // Korean summer food culture (복날 · 이열치열).
    {
      ko: "한국 사람들은 복날에 삼계탕을 먹어요.",
      en: "Koreans eat samgyetang on boknal, the dog days.",
    },
    {
      ko: "이열치열이라는 말처럼 뜨거운 음식으로 더위를 이겨요.",
      en: "As the saying 'fight heat with heat' goes, they beat the heat with hot food.",
    },
    {
      ko: "여름에는 팥빙수나 냉면을 먹으면 시원해져요.",
      en: "In summer, eating patbingsu or naengmyeon cools you down.",
    },
    // Cambodia-side comparison lines.
    {
      ko: "캄보디아는 열대 기후라서 일 년 내내 여름 같아요.",
      en: "Cambodia has a tropical climate, so it feels like summer all year.",
    },
    {
      ko: "우기에는 스콜처럼 비가 짧고 강하게 와요.",
      en: "In the wet season, rain falls short and hard, like a squall.",
    },
  ],
  answerFrames: WEATHER_ANSWER_FRAMES,
  sampleQuestions: [
    { ko: "한국의 여름 날씨는 어때요?", en: "How is Korea's summer weather?" },
    {
      ko: "캄보디아의 날씨와 어떻게 달라요?",
      en: "How is it different from Cambodia's weather?",
    },
    {
      ko: "한국 여름과 캄보디아 여름 중에서 어디가 더 더워요?",
      en: "Which is hotter — Korean or Cambodian summer?",
    },
    { ko: "장마철에 대해 어떻게 생각해요?", en: "What do you think about the rainy season?" },
    {
      ko: "더운 날씨가 건강에 어떤 영향을 줘요?",
      en: "How does hot weather affect your health?",
    },
    { ko: "더위를 이기기 위해서 무엇을 해요?", en: "What do you do to beat the heat?" },
    {
      ko: "한국에 와서 날씨 때문에 힘들었던 적이 있어요?",
      en: "Since coming to Korea, have you struggled because of the weather?",
    },
    {
      ko: "여름에 건강을 지키기 위해서 어떻게 해요?",
      en: "How do you stay healthy in the summer?",
    },
    { ko: "고향 날씨가 그리울 때가 있어요?", en: "Do you ever miss the weather back home?" },
    {
      ko: "한국 날씨에 적응하는 데 얼마나 걸렸어요?",
      en: "How long did it take you to adapt to Korean weather?",
    },
    {
      ko: "캄보디아의 건기와 우기에 대해 설명해 줄 수 있어요?",
      en: "Can you explain Cambodia's dry and rainy seasons?",
    },
    {
      ko: "여름에 더위를 식히기 위해 어떤 음식이나 음료를 마셔요?",
      en: "What food or drinks do you have to cool down in the summer?",
    },
    // From TalkToMeInKorean "1100 Short & Useful Korean Phrases" (Pattern 024 example).
    { ko: "날씨 어떤 것 같아요?", en: "What do you think about the weather?" },
    {
      ko: "냉방병을 예방하기 위해 어떤 노력을 하고 있어요?",
      en: "What efforts are you making to prevent air-conditioning sickness?",
    },
    {
      ko: "한국과 캄보디아 중 어느 쪽이 건강에 더 나쁘다고 생각해요?",
      en: "Which do you think is worse for health — Korean or Cambodian weather?",
    },
    {
      ko: "한국 여름에 가장 힘들었던 건강 문제는 무엇이었어요?",
      en: "What was the most difficult health issue you faced during Korean summer?",
    },
    {
      ko: "캄보디아에서는 더운 날씨에 어떻게 대처했어요?",
      en: "How did you cope with the hot weather in Cambodia?",
    },
    {
      ko: "습도가 높을 때 일상생활에 어떤 변화가 생겼어요?",
      en: "What changes happened in your daily life when humidity was high?",
    },
    ...WEATHER_SCRIPT_FOLLOW_UPS,
    // Follow-up territory the examiner can reach from the topic: tropical
    // nights, the KDCA heat rules, and Korean summer food culture. Each model
    // answer is 2–3 short sentences in the exam's answer-first, show-growth
    // style, ready to shadow and then personalize.
    {
      ko: "열대야가 뭔지 알아요?",
      en: "Do you know what a tropical night is?",
      answerKo:
        "네, 밤에도 기온이 25도 아래로 안 내려가는 밤이에요. 열대야 때문에 잠을 설칠 때가 있어요. 그래서 자기 전에 샤워를 하고 선풍기를 틀어요.",
      answerEn:
        "Yes, it's a night when the temperature doesn't drop below 25°C. Because of tropical nights I sometimes sleep badly. So I shower before bed and turn on the fan.",
      keywords: ["열대야", "기온", "잠"],
    },
    {
      ko: "폭염 때 건강을 지키는 방법을 알고 있어요?",
      en: "Do you know how to protect your health during a heat wave?",
      answerKo:
        "네, 물, 그늘, 휴식이 중요하다고 들었어요. 갈증이 없어도 물을 자주 마시고, 가장 더운 시간에는 밖에 안 나가려고 해요.",
      answerEn:
        "Yes, I heard water, shade, and rest are important. I drink water often even when I'm not thirsty, and I try not to go out during the hottest hours.",
      keywords: ["물", "그늘", "휴식"],
    },
    {
      ko: "더위 때문에 몸이 안 좋으면 어떻게 해야 돼요?",
      en: "What should you do if the heat makes you feel unwell?",
      answerKo:
        "어지럽거나 두통이 있으면 바로 시원한 곳으로 가야 해요. 그리고 물을 마시면서 쉬는 게 좋아요. 심하면 병원에 가야 해요.",
      answerEn:
        "If you feel dizzy or have a headache, you should go somewhere cool right away. Then it's good to rest while drinking water. If it's serious, you should go to the hospital.",
      keywords: ["어지럽다", "시원한 곳", "쉬다"],
    },
    {
      ko: "복날에 대해 들어 본 적이 있어요?",
      en: "Have you heard about boknal (the dog days)?",
      answerKo:
        "네, 일 년 중 가장 더운 날이에요. 한국 사람들은 복날에 삼계탕 같은 보양식을 먹어요. 저도 이번 여름에 삼계탕을 먹어 봤는데 맛있었어요.",
      answerEn:
        "Yes, they are the hottest days of the year. Koreans eat stamina food like samgyetang on boknal. I tried samgyetang this summer too, and it was delicious.",
      keywords: ["복날", "삼계탕", "보양식"],
    },
    {
      ko: "한국의 여름 음식 중에서 뭘 먹어 봤어요?",
      en: "Which Korean summer foods have you tried?",
      answerKo:
        "삼계탕하고 냉면을 먹어 봤어요. 삼계탕은 뜨겁지만 힘이 나고, 냉면은 시원해서 좋았어요. 다음에는 팥빙수도 먹어 보고 싶어요.",
      answerEn:
        "I've tried samgyetang and naengmyeon. Samgyetang is hot but gives me energy, and naengmyeon was nice and cool. Next I want to try patbingsu too.",
      keywords: ["삼계탕", "냉면", "팥빙수"],
    },
    {
      ko: "장마철에 출근할 때 어떻게 준비해요?",
      en: "How do you prepare for your commute during the rainy season?",
      answerKo:
        "우산을 항상 가방에 가지고 다녀요. 그리고 비가 많이 오는 날에는 조금 일찍 집에서 나가요. 신발이 젖을 때가 많아서 조심해요.",
      answerEn:
        "I always carry an umbrella in my bag. And on days with heavy rain, I leave home a little early. My shoes often get wet, so I'm careful.",
      keywords: ["우산", "일찍", "비"],
    },
    {
      ko: "캄보디아 우기에는 비가 어떻게 와요?",
      en: "How does it rain in Cambodia's wet season?",
      answerKo:
        "스콜처럼 짧고 강하게 와요. 보통 오후에 갑자기 비가 오고, 한 시간 후에 그쳐요. 한국 장마처럼 하루 종일 오지 않아요.",
      answerEn:
        "It comes short and hard, like a squall. It usually rains suddenly in the afternoon and stops an hour later. It doesn't rain all day like the Korean jangma.",
      keywords: ["스콜", "오후", "그치다"],
    },
    {
      ko: "여름과 겨울 중에서 어느 계절이 더 좋아요?",
      en: "Which season do you like more, summer or winter?",
      answerKo:
        "저는 여름이 더 좋아요. 캄보디아 날씨와 비슷해서 익숙하기 때문이에요. 그런데 한국 겨울도 한번 경험해 보고 싶어요.",
      answerEn:
        "I like summer more. It's because it's similar to Cambodian weather, so it's familiar. But I'd also like to experience a Korean winter once.",
      keywords: ["여름", "비슷하다", "익숙하다"],
    },
    {
      ko: "주말에 더울 때 보통 뭘 해요?",
      en: "What do you usually do on hot weekends?",
      answerKo:
        "낮에는 집에서 쉬거나 카페에 가요. 저녁에 시원해지면 산책을 해요. 캄보디아에서도 저녁에 친구들과 밖에 나가곤 했어요.",
      answerEn:
        "During the day I rest at home or go to a cafe. When it cools down in the evening, I take a walk. In Cambodia too, I used to go out with friends in the evening.",
      keywords: ["쉬다", "저녁", "산책"],
    },
    {
      ko: "한국의 가을 날씨는 기대돼요?",
      en: "Are you looking forward to Korea's autumn weather?",
      answerKo:
        "네, 정말 기대돼요. 캄보디아에는 가을이 없기 때문이에요. 시원한 날씨에 단풍을 꼭 보고 싶어요.",
      answerEn:
        "Yes, I'm really looking forward to it. That's because Cambodia doesn't have autumn. I definitely want to see the fall leaves in the cool weather.",
      keywords: ["가을", "시원하다", "단풍"],
    },
  ].map((question) => {
    const model = WEATHER_CORE_ANSWERS[question.ko]
    return model ? { ...question, ...model } : question
  }),
  sources: [
    {
      publisher: "질병관리청 (KDCA)",
      title: "2026 폭염 대비 건강수칙",
      url: "https://www.kdca.go.kr/bbs/kdca/263/306758/download.do",
      usedFor:
        "Staying cool, drinking water regularly, sun protection, rest, and heat-illness response",
    },
    {
      publisher: "기상청 (KMA)",
      title: "2025년 여름철 기후 특성",
      url: "https://www.weather.go.kr/kma/news/press_01.jsp?mode=view&num=1194521",
      usedFor: "Korean summer, heat-wave, tropical-night, rainy-season, and heavy-rain language",
    },
    {
      publisher: "TOPIK Guide",
      title: "Ultimate list of weather-related terms in Korean",
      url: "https://www.topikguide.com/ultimate-list-of-weather-related-terms-in-korean/",
      usedFor: "Summer weather expressions (무더위, 찜통더위, 열대야, 후텁지근하다)",
    },
    {
      publisher: "Korea.net",
      title: "Korea’s red-hot summers are a foodie’s delight",
      url: "https://www.korea.net/NewsFocus/Opinion/view?articleId=147824",
      usedFor: "Boknal food culture (복날, 보양식, 삼계탕, 이열치열)",
    },
    {
      publisher: "World Bank Climate Change Knowledge Portal",
      title: "Climate Risk Country Profile: Cambodia",
      url: "https://climateknowledgeportal.worldbank.org/sites/default/files/2018-10/wb_gfdrr_climate_change_country_profile_for_KHM.pdf",
      usedFor: "Cambodia's tropical climate, dry season, wet season, and hottest period",
    },
    {
      publisher: "국립국어원",
      title: "한국어기초사전",
      url: "https://krdict.korean.go.kr/eng",
      usedFor: "Learner-friendly Korean meanings, example usage, and pronunciation reference",
    },
  ],
}

// Curated study material for common workplace status-check Q&A: daily
// stand-up style questions about current work, deadlines, difficulties,
// and meeting/report follow-ups. Source: team-shared prep docs
// ("회의에서 자주 사용하는 표현" / "자주 묻는 질문과 답변").
const WORKPLACE_QA_PREP: InterviewPrep = {
  vocabulary: [
    { term: "작업", meaning: "task, work" },
    { term: "진행하다", meaning: "to proceed, to carry out" },
    { term: "완료하다", meaning: "to complete" },
    { term: "마감일", meaning: "deadline" },
    { term: "끝내다", meaning: "to finish" },
    { term: "어려운 점", meaning: "difficulty, hard part" },
    { term: "도와주다", meaning: "to help" },
    { term: "담당하다", meaning: "to be in charge of" },
    { term: "맡다", meaning: "to take on, to be responsible for" },
    { term: "보고서", meaning: "report" },
    { term: "작성하다", meaning: "to write, to draft" },
    { term: "일정", meaning: "schedule" },
    { term: "회의", meaning: "meeting" },
    { term: "정보", meaning: "information" },
    { term: "확인하다", meaning: "to check, to confirm" },
    { term: "피드백", meaning: "feedback" },
    { term: "검토하다", meaning: "to review" },
    { term: "버그를 수정하다", meaning: "to fix a bug" },
    { term: "업무", meaning: "work, duties" },
    { term: "집중하다", meaning: "to focus" },
  ],
  keyPhrases: [
    { ko: "현재 API 개발을 진행하고 있습니다.", en: "I am currently developing the API." },
    { ko: "지금은 버그를 수정하고 있습니다.", en: "I am fixing a bug." },
    { ko: "오늘 안에 완료하겠습니다.", en: "I will complete it by today." },
    { ko: "내일까지 완료할 예정입니다.", en: "I plan to complete it by tomorrow." },
    { ko: "네, 조금 어려운 부분이 있습니다.", en: "Yes, there are some difficult parts." },
    { ko: "아니요, 현재는 없습니다.", en: "No, there aren't any at the moment." },
    { ko: "네, 조금 도와주시면 감사하겠습니다.", en: "Yes, I would appreciate your help." },
    { ko: "괜찮습니다. 혼자 해보겠습니다.", en: "It's okay. I'll try to do it myself." },
    { ko: "제가 담당하고 있습니다.", en: "I am responsible for it." },
    { ko: "마감일은 이번 주 금요일이에요.", en: "The deadline is this Friday." },
    { ko: "네, 방금 완료했습니다.", en: "I just finished it a moment ago." },
    {
      ko: "오전에는 회의가 있고 오후에는 개발 업무를 할 예정입니다.",
      en: "I have a meeting in the morning, and in the afternoon I will work on development tasks.",
    },
    {
      ko: "네, 필요한 정보는 모두 확인했습니다.",
      en: "I have checked all the necessary information.",
    },
    { ko: "네, 확인 후 피드백 드리겠습니다.", en: "Sure. I'll review it and give you feedback." },
  ],
  sampleQuestions: [
    { ko: "현재 어떤 작업을 하고 계신가요?", en: "What are you currently working on?" },
    { ko: "언제까지 완료할 수 있을까요?", en: "When can it be completed?" },
    { ko: "어려운 점이 있나요?", en: "Are there any difficulties?" },
    { ko: "도움이 필요하신가요?", en: "Do you need any help?" },
    { ko: "이 작업은 누가 담당하나요?", en: "Who is responsible for this task?" },
    { ko: "마감일이 언제예요?", en: "When is the deadline?" },
    { ko: "보고서 다 작성하셨어요?", en: "Have you finished your report?" },
    { ko: "오늘 일정이 어떻게 되세요?", en: "What is your schedule for today?" },
    { ko: "필요한 정보는 다 받으셨나요?", en: "Have you received all the necessary information?" },
    { ko: "피드백 주실 수 있을까요?", en: "Could you give me some feedback?" },
  ],
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
  {
    id: "weather",
    label:
      "Differences between Korean summer weather and Cambodian weather, and their effects on daily life and health",
    labelKo: "한국 여름 날씨와 캄보디아 날씨의 차이와 생활·건강에 미치는 영향",
    description:
      "Compare summer weather in Korea and Cambodia and how it affects daily life and health.",
    difficulty: "Easy–Medium",
    recommended: true,
    examinerBrief: [
      "The candidate is from Cambodia and is living through a Korean summer right now (June–August).",
      "Follow this natural question arc, one question per turn, going a little deeper each time:",
      "1) Describe Korea's summer weather (덥다, 습하다, 무덥다, 장마, 폭염, 자외선).",
      "2) Compare it with Cambodia's weather (Korea's 사계절 vs Cambodia's 건기/우기, which is hotter, which is more humid, climate/기후 differences, 차이).",
      "3) The rainy season 장마 and daily life (commute, 땀, 에어컨, 그늘, sleep, 열대야, 환절기).",
      "4) Health effects of the heat (더위를 먹다, 온열질환, 일사병, 냉방병, 어지럽다, 두통) and how the candidate copes — the 물·그늘·휴식 heat-safety rules (수분 보충, avoiding the hottest hours, rest).",
      "5) Korean summer culture and food (복날, 보양식, 삼계탕, 이열치열, 팥빙수, 냉면) — has the candidate tried them, what do people eat in Cambodia when it's hot.",
      "6) A personal reflection (a hard day because of the weather, missing home weather: 고향이 그립다, or how they adapted/endured: 익숙해지다, 적응하다, 견디다) and looking ahead to autumn (단풍).",
      "Keep vocabulary practical and everyday; encourage the candidate to compare with Cambodia and to give personal examples.",
    ].join("\n"),
    prep: WEATHER_PREP,
    scriptOutline: WEATHER_SCRIPT_OUTLINE,
    scriptSeed: WEATHER_SCRIPT_SEED,
    scriptSeedEn: WEATHER_SCRIPT_SEED_EN,
  },
  {
    id: "workplace-qa",
    label: "Workplace status Q&A & meeting expressions",
    labelKo: "업무 현황 질문과 답변 및 회의 표현",
    description:
      "Practice the everyday questions a manager or teammate asks in Korean: current task, deadlines, difficulties, and report/meeting follow-ups.",
    difficulty: "Easy–Medium",
    examinerBrief: [
      "The candidate is a software developer in a Korean workplace. Play the role of a manager or teammate doing a quick daily check-in, one question per turn.",
      "Draw questions from this natural arc, going a little deeper each time:",
      "1) What are they currently working on (작업, 진행하다, 개발, 버그 수정).",
      "2) When can it be completed (마감일, 완료하다, 끝내다, 일정).",
      "3) Any difficulties or blockers (어려운 점, 도와주다, 도움이 필요하다).",
      "4) Who owns/is responsible for a task (담당하다, 맡다).",
      "5) Follow-ups on reports, meetings, and feedback (보고서, 작성하다, 회의, 피드백, 검토하다, 정보를 확인하다).",
      "Keep questions short, natural, and workplace-appropriate; encourage concise status-update style answers.",
    ].join("\n"),
    prep: WORKPLACE_QA_PREP,
  },
]

export function getInterviewTopic(id: string): InterviewTopic {
  return INTERVIEW_TOPICS.find((topic) => topic.id === id) ?? INTERVIEW_TOPICS[0]
}

// ── Q&A preparation ───────────────────────────────────────────────────────
// The exam is spoken Q&A, so beyond the written script the candidate drafts an
// answer to each likely question. Answers are keyed by item id and ride in the
// same `values` map the script uses, so they autosave + sync with no new wiring.

export interface QAItem {
  id: string
  questionKo: string
  questionEn: string
}

/** Likely exam questions for the topic, seeded as the starting Q&A list. */
export function getSeedQA(topic: InterviewTopic): QAItem[] {
  return (topic.prep?.sampleQuestions ?? []).map((q, i) => ({
    id: `qa-seed-${i}`,
    questionKo: q.ko,
    questionEn: q.en,
  }))
}

/**
 * Renders the Q&A section of the exportable document. Skips items with neither a
 * question nor an answer so blank rows don't clutter what the mentor receives.
 */
export function buildQADocument(items: QAItem[], answers: Record<string, string>): string {
  const blocks: string[] = []
  for (const item of items) {
    const question = item.questionKo.trim()
    const answer = (answers[item.id] ?? "").trim()
    if (!question && !answer) continue
    if (question) blocks.push(`Q: ${question}`)
    blocks.push(answer ? `A: ${answer}` : "A: (작성 예정)")
    blocks.push("")
  }
  return blocks.join("\n").trim()
}

/**
 * Assembles the written sections into one submittable document, skipping empty
 * sections, with a Korean heading per section.
 */
export function buildScriptDocument(
  topic: InterviewTopic,
  values: Record<string, string>,
  /** Candidate-added sections, appended after the fixed exam outline. */
  extraSections: { id: string; title: string }[] = [],
): string {
  const blocks: string[] = [topic.labelKo, ""]

  const sections = [
    ...(topic.scriptOutline ?? []).map((s) => ({ id: s.id, titleKo: s.titleKo })),
    ...extraSections.map((s) => ({ id: s.id, titleKo: s.title.trim() || "Untitled" })),
  ]

  for (const section of sections) {
    const text = (values[section.id] ?? "").trim()
    if (!text) continue
    blocks.push(`【 ${section.titleKo} 】`, text, "")
  }

  return blocks.join("\n").trim()
}

// Markers the examiner must use so we can split each turn into feedback,
// the Korean question (for TTS), and an English translation (for the
// candidate, who is still building listening comprehension).
const FEEDBACK_TAG = "[FEEDBACK]"
const QUESTION_KO_TAG = "[QUESTION_KO]"
const QUESTION_EN_TAG = "[QUESTION_EN]"

// Per-mode response contract. Practice keeps the full three-tag turn; exam is
// Korean-only — no feedback, no translation — like the real interviewer.
function responseFormatRules(mode: InterviewModeConfig): string {
  if (!mode.showFeedback && !mode.showEnglish) {
    return [
      "Reply ONLY in this exact format, nothing before or after:",
      QUESTION_KO_TAG,
      "<exactly ONE interview question in natural spoken Korean>",
      "Do NOT include feedback, English, or translations of any kind.",
    ].join("\n")
  }
  return [
    "Reply ONLY in this exact format, nothing before or after:",
    FEEDBACK_TAG,
    "<one or two short sentences of English feedback on the candidate's PREVIOUS answer — comment on vocabulary, grammar, and confidence, and when useful give a more natural way to say it. For the very first turn, write: Let's begin — relax and answer naturally.>",
    QUESTION_KO_TAG,
    "<exactly ONE interview question in natural spoken Korean>",
    QUESTION_EN_TAG,
    "<a plain English translation of that question>",
  ].join("\n")
}

/**
 * The kickoff message sent as the first turn of the conversation. It sets up
 * the examiner persona and asks for the first question. Defaults keep the old
 * one-argument call (and its tests) behaving exactly as before.
 */
export function buildInterviewSystemPrompt(
  topic: InterviewTopic,
  mode: InterviewModeConfig = INTERVIEW_MODES.practice,
  unexpected: UnexpectedQuestion[] = [],
): string {
  const unexpectedBlock =
    unexpected.length > 0
      ? [
          "- Roughly every 2-3 questions, break from the topic and ask ONE unexpected everyday interview question, adapted naturally in your own words (do not read verbatim):",
          ...unexpected.map((q) => `  · ${q.ko}`),
          "  Return to the topic arc afterwards.",
        ]
      : []

  return [
    "You are a Korean-language interviewer for the K-Specialist (케이 스페셜리스트) Korean speaking exam.",
    "This is a spoken Q&A interview — there is no presentation. You ask one question at a time and the candidate answers out loud.",
    `Interview topic: ${topic.labelKo} (${topic.label}).`,
    topic.examinerBrief,
    "Rules:",
    "- Ask ONE question per turn, but NEVER move to a new sub-topic after only one question.",
    "- After every answer, probe it at least once with a natural follow-up before advancing the arc. Use probes like: 왜 그렇게 생각합니까? / 예를 들어 설명해 주세요 / 조금 더 자세히 말해 주세요 / 그때 기분이 어땠습니까?",
    "- If the answer is short or vague, dig into it; if it is detailed, challenge one detail.",
    ...unexpectedBlock,
    "- Keep questions short and clearly spoken, suitable for an intermediate learner.",
    "- The candidate is evaluated on speaking ability, pronunciation, vocabulary, and confidence.",
    mode.showFeedback
      ? "- Be encouraging but honest in your feedback."
      : "- Stay formal and neutral, like a real examiner. Give no feedback during the interview.",
    "",
    responseFormatRules(mode),
    "",
    "Begin the interview now with your first question.",
  ].join("\n")
}

/**
 * Wraps the candidate's spoken answer for the next turn, with a light reminder
 * to keep the examiner on-format (models drift over long chats).
 */
export function buildAnswerMessage(
  answer: string,
  mode: InterviewModeConfig = INTERVIEW_MODES.practice,
): string {
  const reminder = mode.showFeedback
    ? "[Give brief feedback on that answer, then ask the next question. Use the required format.]"
    : "[Ask the next question in the required format. No feedback, no English.]"
  return `${answer.trim()}\n\n${reminder}`
}

export interface ExaminerTurn {
  feedback: string
  questionKo: string
  questionEn: string
}

/**
 * Parses a completed examiner reply into its sections. Tolerant of missing
 * tags — falls back to treating the whole text as the Korean question so the
 * UI never ends up blank if the model ignores the format.
 */
export function parseExaminerTurn(raw: string): ExaminerTurn {
  const text = (raw ?? "").trim()

  const feedback = extractSection(text, FEEDBACK_TAG, [QUESTION_KO_TAG, QUESTION_EN_TAG])
  const questionKo = extractSection(text, QUESTION_KO_TAG, [QUESTION_EN_TAG])
  const questionEn = extractSection(text, QUESTION_EN_TAG, [])

  if (!questionKo && !questionEn && !feedback) {
    return { feedback: "", questionKo: text, questionEn: "" }
  }

  return {
    feedback,
    questionKo: questionKo || text,
    questionEn,
  }
}

// ── End-of-session evaluation ────────────────────────────────────────────
// After the Q&A the candidate can ask for an overall verdict. The examiner
// already has the full conversation, so we just switch it out of the per-turn
// question format and into a one-off scorecard keyed to the four official exam
// criteria (speaking, pronunciation, vocabulary, confidence).

const SCORES_TAG = "[SCORES]"
const SUMMARY_TAG = "[SUMMARY]"
const ADVICE_TAG = "[ADVICE]"

/** The four official K-Specialist criteria, in the order the exam lists them. */
export const EVALUATION_CRITERIA = [
  "Speaking",
  "Pronunciation",
  "Vocabulary",
  "Confidence",
] as const

export interface EvaluationScore {
  label: string
  score: number
  max: number
}

export interface InterviewEvaluation {
  scores: EvaluationScore[]
  summary: string
  advice: string[]
}

// Richer end-of-session analysis from the structured evaluate route
// (app/api/ai/interview/evaluate). All values are ESTIMATED from the
// speech-recognition transcript — there is no audio analysis.

export interface InterviewGrammarIssue {
  issue: string
  example: string
  fix: string
}

export interface InterviewAnalytics {
  fillerNotes: string
  avgSentenceLengthWords: number
  vocabRangeNotes: string
  grammarIssues: InterviewGrammarIssue[]
  wordsToPractice: string[]
}

/** The evaluate route's per-criterion scores, keyed by criterion. */
export interface CriterionScores {
  speaking: number
  pronunciation: number
  vocabulary: number
  confidence: number
}

/**
 * Maps the evaluate route's keyed scores into the ordered EvaluationScore list
 * the scorecard UI and history already consume, clamped to 1–5.
 */
export function toEvaluationScores(scores: CriterionScores): EvaluationScore[] {
  const byLabel: Record<(typeof EVALUATION_CRITERIA)[number], number> = {
    Speaking: scores.speaking,
    Pronunciation: scores.pronunciation,
    Vocabulary: scores.vocabulary,
    Confidence: scores.confidence,
  }
  return EVALUATION_CRITERIA.map((label) => ({
    label,
    score: Math.max(1, Math.min(5, Math.round(byLabel[label]))),
    max: 5,
  }))
}

/**
 * Final-turn message that ends the interview and asks for a scorecard instead
 * of another question. Sent on the same conversation, so the model judges the
 * whole transcript it already has.
 */
export function buildEvaluationPrompt(): string {
  return [
    "The interview is now over. Do NOT ask another question.",
    "Evaluate the candidate's overall spoken performance across the whole interview, judging the four official exam criteria on a 1–5 scale.",
    "Reply ONLY in this exact format, nothing before or after:",
    SCORES_TAG,
    "Speaking: <1-5>",
    "Pronunciation: <1-5>",
    "Vocabulary: <1-5>",
    "Confidence: <1-5>",
    SUMMARY_TAG,
    "<two or three sentences of honest, encouraging English feedback on the overall performance>",
    ADVICE_TAG,
    "- <one short, actionable tip in English>",
    "- <one short, actionable tip in English>",
    "- <one short, actionable tip in English>",
  ].join("\n")
}

/**
 * Parses the scorecard reply. Tolerant of formatting drift: missing scores are
 * dropped, and any bullet style (-, •, *, or 1.) is accepted for the advice.
 */
export function parseEvaluation(raw: string): InterviewEvaluation {
  const text = (raw ?? "").trim()

  const scoresBlock = extractSection(text, SCORES_TAG, [SUMMARY_TAG, ADVICE_TAG])
  const summary = extractSection(text, SUMMARY_TAG, [ADVICE_TAG])
  const adviceBlock = extractSection(text, ADVICE_TAG, [])

  const scores: EvaluationScore[] = []
  for (const line of scoresBlock.split("\n")) {
    // Match "Label: 4" or "Label: 4/5" (the "/5" is optional).
    const match = line.match(/^\s*(.+?)\s*[:：]\s*(\d+)\s*(?:\/\s*(\d+))?/)
    if (!match) continue
    const max = match[3] ? Number(match[3]) : 5
    const score = Math.max(0, Math.min(max, Number(match[2])))
    scores.push({ label: match[1].trim(), score, max })
  }

  const advice = adviceBlock
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)

  return { scores, summary, advice }
}

function extractSection(text: string, startTag: string, endTags: string[]): string {
  const startIndex = text.indexOf(startTag)
  if (startIndex === -1) {
    return ""
  }

  const contentStart = startIndex + startTag.length
  let contentEnd = text.length

  for (const endTag of endTags) {
    const endIndex = text.indexOf(endTag, contentStart)
    if (endIndex !== -1 && endIndex < contentEnd) {
      contentEnd = endIndex
    }
  }

  return text.slice(contentStart, contentEnd).trim()
}
