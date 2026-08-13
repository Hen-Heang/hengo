import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { getInterviewTopic, getSeedQA } from "./interview"
import {
  selectTodaysQueue,
  versionsToDeactivate,
  type QuestionBankItem,
} from "./interview-practice"

const KOREA_SUMMER_KO =
  "한국의 여름은 6월부터 8월까지입니다. 더운 날에는 기온이 30도를 넘고 습도도 높습니다. 장마철에는 비가 며칠 동안 계속 오기도 합니다. 그래서 기온이 캄보디아보다 낮아도 더 답답하고 덥게 느껴질 때가 있습니다.\n\n한국 사람들은 우산을 가지고 다니고, 에어컨이 있는 곳에서 시간을 보냅니다. 수영장이나 바다에 가기도 하고, 삼계탕을 먹으면서 힘을 내기도 합니다.\n\n저는 한국에서 더운 날에 수박 주스를 마시는 것을 좋아합니다. 수박 주스는 시원하고 달아서 마시면 기분이 좋아집니다."
const KOREA_SUMMER_EN =
  "Summer in Korea is from June to August. On hot days, the temperature rises above 30 degrees, and the humidity is also high. During the rainy season, it can rain continuously for several days. Therefore, even when the temperature is lower than in Cambodia, it sometimes feels more uncomfortable and hotter.\n\nKorean people carry umbrellas and spend time in places with air conditioning. They also go to swimming pools or the beach, and some people eat samgyetang to regain their energy.\n\nIn Korea, I like drinking watermelon juice on hot days. Watermelon juice is cool and sweet, so it makes me feel good."
const CAMBODIA_COMPARE_KO =
  "캄보디아에는 한국처럼 봄, 여름, 가을, 겨울이 없습니다. 대신 건기와 우기, 두 계절이 있습니다. 3월부터 5월까지는 매우 덥고, 특히 4월이 가장 덥습니다. 기온이 40도 가까이 올라갈 때도 있습니다.\n\n4월에는 캄보디아 새해가 있습니다. 날씨는 아주 덥지만, 많은 사람들이 가족과 시간을 보내거나 여행을 갑니다.\n\n저도 더운 계절에는 친구들과 캄폿이나 시아누크빌에 가곤 했습니다. 낮에는 너무 더워서 주로 실내에서 쉬었습니다. 저녁에는 조금 시원해져서 친구들과 밖에 나갔습니다.\n\n캄보디아에서는 더운 날에 코코넛 커피를 자주 마셨습니다. 코코넛 커피는 달고 시원해서 더운 날씨와 잘 어울립니다. 한국에서는 수박 주스를 마시고, 캄보디아에서는 코코넛 커피를 마신다는 점도 재미있는 차이입니다.\n\n비가 오는 모습도 다릅니다. 한국에서는 장마철에 비가 오랫동안 내립니다. 하지만 캄보디아에서는 비가 갑자기 많이 내렸다가 빨리 그칠 때가 많습니다.\n\n그래서 한국에서는 우산이 중요하지만, 캄보디아에서는 그늘을 찾는 것이 더 중요하다고 생각합니다."
const CAMBODIA_COMPARE_EN =
  "Cambodia does not have spring, summer, autumn, and winter like Korea. Instead, it has two seasons: the dry season and the rainy season. The period from March to May is very hot, and April is especially hot. Sometimes, the temperature rises to nearly 40 degrees.\n\nCambodian New Year is also in April. Although the weather is very hot, many people spend time with their families or travel.\n\nDuring the hot season, I often went to Kampot or Sihanoukville with my friends. During the daytime, it was too hot, so I usually rested indoors. In the evening, the weather became a little cooler, so I went outside with my friends.\n\nIn Cambodia, I often drank coconut coffee on hot days. Coconut coffee is sweet and cool, so it is a good drink for hot weather. It is also an interesting difference that I drink watermelon juice in Korea and coconut coffee in Cambodia.\n\nThe rain is also different. In Korea, rain continues for a long time during the rainy season. However, in Cambodia, it often rains heavily and suddenly and then stops quickly.\n\nTherefore, I think an umbrella is important in Korea, but finding shade is more important in Cambodia."

const focusedSeedPath = new URL(
  "../supabase/seed/kori_interview_questions_cambodia_experience.sql",
  import.meta.url,
)
const baseSeedPath = new URL("../supabase/seed/kori_interview_questions.sql", import.meta.url)
const focusedSeed = readFileSync(focusedSeedPath, "utf8")
const baseSeed = readFileSync(baseSeedPath, "utf8")
const expectedSlugs = [
  "weather-cambodia-hot-place",
  "weather-cambodia-why-seaside",
  "weather-cambodia-seaside-activities",
  "weather-cambodia-seaside-memory",
  "weather-korea-cambodia-summer-activities",
  "weather-cambodia-new-year",
  "weather-korea-hot-day-drink",
  "weather-cambodia-hot-day-drink",
  "weather-summer-drink-difference",
  "weather-rain-pattern-difference",
  "weather-umbrella-or-shade",
  "weather-han-river-cycling",
  "weather-why-evening-cycling",
  "weather-yeongjongdo-plan",
  "weather-summer-lesson",
]
const revisedScriptQuestionKo = [
  "캄보디아 새해는 언제이고, 사람들은 보통 무엇을 합니까?",
  "한국에서 더운 날에 어떤 음료를 좋아합니까?",
  "캄보디아에서 더운 날에 어떤 음료를 자주 마셨습니까?",
  "한국과 캄보디아에서 마시는 여름 음료는 어떻게 다릅니까?",
  "한국과 캄보디아에서는 비가 오는 모습이 어떻게 다릅니까?",
  "왜 한국에서는 우산이 중요하고 캄보디아에서는 그늘이 중요하다고 생각합니까?",
  "한국 여름에 꼭 해 보고 싶은 일은 무엇입니까?",
  "왜 저녁에 한강에서 자전거를 타고 싶습니까?",
  "영종도에 가면 무엇을 하고 싶습니까?",
  "두 나라의 여름을 경험하면서 무엇을 배웠습니까?",
]

function weatherSlugs(sql: string): string[] {
  return [...sql.matchAll(/\(?\s*'(weather-[a-z0-9-]+)'\s*,/g)].map((match) => match[1])
}

function seedQuestion(
  slug: string,
  displayOrder: number,
  difficulty: QuestionBankItem["difficulty"],
  priority: QuestionBankItem["priority"],
): QuestionBankItem {
  return {
    id: slug,
    questionKo: slug,
    questionEn: slug,
    sampleAnswerKo: null,
    sampleAnswerEn: null,
    category: slug === expectedSlugs.at(-1) ? "comparison" : "personal_experience",
    difficulty,
    priority,
    keywords: [],
    displayOrder,
    ownedByUser: false,
  }
}

describe("weather exam-week script content", () => {
  const weather = getInterviewTopic("weather")

  it("keeps the canonical Korean and English summer sections synchronized", () => {
    expect(weather.scriptSeed?.["korea-summer"]).toBe(KOREA_SUMMER_KO)
    expect(weather.scriptSeedEn?.["korea-summer"]).toBe(KOREA_SUMMER_EN)
    expect(weather.scriptSeed?.["korea-summer"]).toContain("장마철")
    expect(weather.scriptSeedEn?.["korea-summer"]).toContain("rainy season")
  })

  it("contains the matching Cambodia experience in Korean and English", () => {
    expect(weather.scriptSeed?.compare).toBe(CAMBODIA_COMPARE_KO)
    expect(weather.scriptSeedEn?.compare).toBe(CAMBODIA_COMPARE_EN)
    expect(weather.scriptSeed?.compare).toContain("캄폿")
    expect(weather.scriptSeed?.compare).toContain("시아누크빌")
    expect(weather.scriptSeedEn?.compare).toContain("Kampot")
    expect(weather.scriptSeedEn?.compare).toContain("Sihanoukville")
    expect(weather.scriptSeed?.compare).toContain("코코넛 커피")
    expect(weather.scriptSeedEn?.compare).toContain("coconut coffee")
  })

  it("retains every canonical section in both languages", () => {
    const sectionIds = weather.scriptOutline?.map((section) => section.id) ?? []
    expect(Object.keys(weather.scriptSeed ?? {})).toEqual(sectionIds)
    expect(Object.keys(weather.scriptSeedEn ?? {})).toEqual(sectionIds)
    for (const id of sectionIds) {
      expect(weather.scriptSeed?.[id]?.trim()).not.toBe("")
      expect(weather.scriptSeedEn?.[id]?.trim()).not.toBe("")
    }
  })

  it("keeps the revised-script follow-ups available to the page offline", () => {
    const offlineQA = getSeedQA(weather)
    const prepQuestions = weather.prep?.sampleQuestions ?? []

    for (const questionKo of revisedScriptQuestionKo) {
      expect(offlineQA.some((question) => question.questionKo === questionKo)).toBe(true)
      const model = prepQuestions.find((question) => question.ko === questionKo)
      expect(model?.answerKo?.trim()).not.toBe("")
      expect(model?.answerEn?.trim()).not.toBe("")
      expect(model?.keywords?.length).toBeGreaterThan(0)
      expect(focusedSeed).toContain(questionKo)
    }
  })
})

describe("script-aligned weather question seed", () => {
  it("has fifteen conflict-safe slugs that do not duplicate the base seed", () => {
    const focusedSlugs = weatherSlugs(focusedSeed)
    const allSlugs = [...weatherSlugs(baseSeed), ...focusedSlugs]
    expect(focusedSlugs).toEqual(expectedSlugs)
    expect(new Set(allSlugs).size).toBe(allSlugs.length)
    expect(focusedSeed).toContain("on conflict (slug) do nothing")
  })

  it("uses allowed categories, difficulties, and priorities", () => {
    expect(focusedSeed.match(/'personal_experience'/g)).toHaveLength(9)
    expect(focusedSeed.match(/'comparison'/g)).toHaveLength(4)
    expect(focusedSeed.match(/'cambodian_weather'/g)).toHaveLength(1)
    expect(focusedSeed.match(/'adaptation'/g)).toHaveLength(1)
    expect(focusedSeed.match(/'beginner'/g)).toHaveLength(7)
    expect(focusedSeed.match(/'normal'/g)).toHaveLength(5)
    expect(focusedSeed.match(/'challenging'/g)).toHaveLength(3)
    expect(focusedSeed.match(/'must_practice'/g)).toHaveLength(6)
    expect(focusedSeed.match(/'recommended'/g)).toHaveLength(9)
  })

  it("covers every fact newly introduced by the revised script", () => {
    for (const detail of [
      "캄보디아 새해",
      "Cambodian New Year",
      "수박 주스",
      "watermelon juice",
      "코코넛 커피",
      "coconut coffee",
      "갑자기 많이 내렸다가 빨리 그칠",
      "rains heavily and suddenly and then stops quickly",
      "그늘",
      "shade",
      "한강에서 자전거",
      "bicycle along the Han River",
      "영종도",
      "Yeongjongdo",
    ]) {
      expect(focusedSeed).toContain(detail)
    }
  })

  it("allows every new record to participate in the daily mixed queue", () => {
    const questions = expectedSlugs.map((slug, index) =>
      seedQuestion(
        slug,
        51 + index,
        index % 3 === 0 ? "beginner" : index % 3 === 1 ? "normal" : "challenging",
        index % 2 === 0 ? "must_practice" : "recommended",
      ),
    )
    const queue = selectTodaysQueue(questions, {}, "mixed", questions.length)
    expect(queue).toHaveLength(expectedSlugs.length)
    expect(new Set(queue.map((question) => question.id))).toEqual(new Set(expectedSlugs))
  })

  it("keeps activation helpers able to leave one selected version active", () => {
    expect(
      versionsToDeactivate(
        [
          { id: "previous-active", isActive: true },
          { id: "older-inactive", isActive: false },
          { id: "exam-week", isActive: false },
        ],
        "exam-week",
      ),
    ).toEqual(["previous-active"])
  })
})
