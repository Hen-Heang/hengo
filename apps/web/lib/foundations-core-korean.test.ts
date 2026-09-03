import { describe, expect, it } from "vitest"

import { FOUNDATIONS_SEED, seedLessonsByTrack } from "./foundations-curriculum"
import { CORE_KOREAN_FOUNDATIONS } from "./foundations-core-korean"

describe("Core Korean Foundations extension", () => {
  it("extends the grammar track additively after the original 18 lessons", () => {
    const grammar = seedLessonsByTrack("grammar")
    const added = grammar.filter((lesson) => lesson.order >= 19)

    expect(added.map((lesson) => lesson.order)).toEqual([19, 20, 21, 22, 23, 24])
    expect(added.map((lesson) => lesson.id)).toEqual([
      "grammar-19",
      "grammar-20",
      "grammar-21",
      "grammar-22",
      "grammar-23",
      "grammar-24",
    ])
  })

  it("keeps lesson and exercise IDs unique in the active curriculum", () => {
    const lessonIds = FOUNDATIONS_SEED.map((lesson) => lesson.id)
    const exerciseIds = FOUNDATIONS_SEED.flatMap((lesson) =>
      lesson.exercises.map((exercise) => exercise.id),
    )

    expect(new Set(lessonIds).size).toBe(lessonIds.length)
    expect(new Set(exerciseIds).size).toBe(exerciseIds.length)
  })

  it("covers the practical beginner gaps this batch is meant to fill", () => {
    const text = CORE_KOREAN_FOUNDATIONS.flatMap((lesson) => [
      lesson.title,
      lesson.subtitle,
      lesson.intro,
      ...lesson.cards.flatMap((card) => [
        card.hangul,
        card.meaning,
        card.example ?? "",
        card.note ?? "",
      ]),
    ]).join(" ")

    expect(text).toContain("명사")
    expect(text).toContain("동사")
    expect(text).toContain("어떻게")
    expect(text).toContain("하나")
    expect(text).toContain("시 / 분")
    expect(text).toContain("-(으)시-")
    expect(text).toContain("여쭙다")
    expect(text).toContain("-아/어 주실 수 있을까요?")
  })

  it("gives every new lesson valid teaching and practice content", () => {
    for (const lesson of CORE_KOREAN_FOUNDATIONS) {
      expect(lesson.cards.length, lesson.id).toBeGreaterThanOrEqual(4)
      expect(lesson.exercises.length, lesson.id).toBeGreaterThanOrEqual(3)

      for (const exercise of lesson.exercises) {
        expect(exercise.prompt.trim(), exercise.id).not.toBe("")
        if (exercise.type === "multiple-choice") {
          const options = exercise.options ?? []
          const answerIndex = exercise.answerIndex ?? -1
          expect(options.length, exercise.id).toBeGreaterThanOrEqual(2)
          expect(answerIndex, exercise.id).toBeGreaterThanOrEqual(0)
          expect(answerIndex, exercise.id).toBeLessThan(options.length)
        } else {
          expect(exercise.answer?.trim(), exercise.id).toBeTruthy()
        }
      }
    }
  })
})
