import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { getInterviewTopic } from "./interview"
import {
  selectTodaysQueue,
  versionsToDeactivate,
  type QuestionBankItem,
} from "./interview-practice"

const KOREA_SUMMER_KO =
  "한국의 여름은 보통 6월부터 8월까지입니다. 기온은 보통 30도 정도이지만, 더운 날에는 35도가 넘을 때도 있습니다. 장마철에는 비가 많이 오고 습도도 높아서 실제 기온보다 더 덥게 느껴집니다. 그래서 사람들은 우산을 가지고 다니고, 에어컨이 있는 실내에서 많은 시간을 보냅니다."
const KOREA_SUMMER_EN =
  "Summer in Korea is usually from June to August. The temperature is normally around 30°C, but it can rise above 35°C on very hot days. During the rainy season, it rains a lot and the humidity is high, so it feels hotter than the actual temperature. Therefore, people carry umbrellas and spend a lot of time indoors with air conditioning."
const CAMBODIA_COMPARE_KO =
  "캄보디아는 한국과 조금 다릅니다. 캄보디아는 일 년 내내 덥고, 건기와 우기 두 계절이 있습니다. 가장 더운 시기는 3월부터 5월까지이고, 기온이 40도 가까이 올라갈 때도 있습니다. 낮에는 너무 더워서 밖에 잘 나가지 않고, 저녁에 날씨가 조금 시원해지면 친구들과 밖에 나가곤 했습니다.\n\n가장 더운 시기에는 가끔 친구들과 캄폿이나 시아누크빌, 즉 껌뽕솜 같은 바닷가에 갔습니다. 바다에서 수영하고 시원한 바람을 느끼면서 더위를 식혔습니다. 친구들과 함께 즐거운 시간을 보내서 좋은 추억이 되었습니다.\n\n한국도 비슷한 점이 있습니다. 날씨가 더울 때 사람들은 수영장이나 바다에 가고, 에어컨이 있는 카페나 쇼핑몰에서 시간을 보냅니다. 하지만 한국은 캄보디아보다 습도가 높아서 실제 기온이 더 낮아도 더 덥고 답답하게 느껴질 때가 있습니다."
const CAMBODIA_COMPARE_EN =
  "Cambodia is a little different from Korea. It is hot throughout the year and has two seasons: the dry season and the rainy season. The hottest period is from March to May, and the temperature can sometimes rise to nearly 40°C. During the day, it is often too hot to go outside. When the weather becomes cooler in the evening, I used to go out with my friends.\n\nDuring the hottest period, I sometimes went to seaside areas such as Kampot or Sihanoukville, also known as Kampong Som, with my friends. We swam in the sea and enjoyed the cool breeze to escape the heat. Spending time there with my friends became a good memory.\n\nKorea is similar in some ways. When the weather is hot, people visit swimming pools or beaches and spend time in air-conditioned cafés or shopping malls. However, Korea has higher humidity, so it can sometimes feel hotter and more uncomfortable even when the actual temperature is lower than in Cambodia."

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
    expect(weather.scriptSeed?.compare).toContain("껌뽕솜")
    expect(weather.scriptSeedEn?.compare).toContain("Kampot")
    expect(weather.scriptSeedEn?.compare).toContain("Sihanoukville")
    expect(weather.scriptSeedEn?.compare).toContain("Kampong Som")
    expect(weather.scriptSeed?.compare).toContain("가장 더운 시기")
    expect(weather.scriptSeedEn?.compare).toContain("the hottest period")
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
})

describe("Cambodia experience question seed", () => {
  it("has five conflict-safe slugs that do not duplicate the base seed", () => {
    const focusedSlugs = weatherSlugs(focusedSeed)
    const allSlugs = [...weatherSlugs(baseSeed), ...focusedSlugs]
    expect(focusedSlugs).toEqual(expectedSlugs)
    expect(new Set(allSlugs).size).toBe(allSlugs.length)
    expect(focusedSeed).toContain("on conflict (slug) do nothing")
  })

  it("uses allowed categories, difficulties, and priorities", () => {
    expect(focusedSeed.match(/'personal_experience'/g)).toHaveLength(4)
    expect(focusedSeed.match(/'comparison'/g)).toHaveLength(1)
    expect(focusedSeed.match(/'beginner'/g)).toHaveLength(3)
    expect(focusedSeed.match(/'normal'/g)).toHaveLength(2)
    expect(focusedSeed.match(/'must_practice'/g)).toHaveLength(2)
    expect(focusedSeed.match(/'recommended'/g)).toHaveLength(3)
  })

  it("allows all five new records to participate in Today's 5 selection", () => {
    const questions = [
      seedQuestion(expectedSlugs[0], 51, "beginner", "must_practice"),
      seedQuestion(expectedSlugs[1], 52, "beginner", "recommended"),
      seedQuestion(expectedSlugs[2], 53, "beginner", "recommended"),
      seedQuestion(expectedSlugs[3], 54, "normal", "recommended"),
      seedQuestion(expectedSlugs[4], 55, "normal", "must_practice"),
    ]
    expect(selectTodaysQueue(questions, {}, "mixed", 5).map((question) => question.id)).toEqual([
      expectedSlugs[0],
      expectedSlugs[4],
      expectedSlugs[1],
      expectedSlugs[2],
      expectedSlugs[3],
    ])
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