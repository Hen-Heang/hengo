import { describe, expect, it } from "vitest"

import { FOUNDATIONS_SEED, seedLessonsByTrack } from "./foundations-data"
import type { LearnTrack } from "./types"

const TRACKS: LearnTrack[] = ["survival", "alphabet", "grammar"]

describe("Foundations curriculum", () => {
  it("uses unique lesson and exercise IDs", () => {
    const lessonIds = FOUNDATIONS_SEED.map((lesson) => lesson.id)
    const exerciseIds = FOUNDATIONS_SEED.flatMap((lesson) =>
      lesson.exercises.map((exercise) => exercise.id)
    )

    expect(new Set(lessonIds).size).toBe(lessonIds.length)
    expect(new Set(exerciseIds).size).toBe(exerciseIds.length)
  })

  it.each(TRACKS)("keeps the %s track ordered and contiguous", (track) => {
    const lessons = seedLessonsByTrack(track)

    expect(lessons.length).toBeGreaterThan(0)
    expect(lessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: lessons.length }, (_, index) => index + 1)
    )
  })

  it("gives every lesson valid teaching and practice content", () => {
    for (const lesson of FOUNDATIONS_SEED) {
      expect(lesson.title.trim(), lesson.id).not.toBe("")
      expect(lesson.intro.trim(), lesson.id).not.toBe("")
      expect(lesson.cards.length, lesson.id).toBeGreaterThan(0)
      expect(lesson.exercises.length, lesson.id).toBeGreaterThan(0)

      for (const exercise of lesson.exercises) {
        expect(exercise.prompt.trim(), exercise.id).not.toBe("")

        if (exercise.type === "multiple-choice") {
          const options = exercise.options ?? []
          const answerIndex = exercise.answerIndex ?? -1
          expect(options.length, exercise.id).toBeGreaterThanOrEqual(2)
          expect(Number.isInteger(exercise.answerIndex), exercise.id).toBe(true)
          expect(answerIndex, exercise.id).toBeGreaterThanOrEqual(0)
          expect(answerIndex, exercise.id).toBeLessThan(options.length)
        } else {
          expect(exercise.answer?.trim(), exercise.id).toBeTruthy()
        }
      }
    }
  })

  it("covers all modern Korean initial consonants and vowels", () => {
    const alphabetCards = seedLessonsByTrack("alphabet")
      .flatMap((lesson) => lesson.cards)
      .map((card) => card.hangul)
      .join(" ")
    const initialConsonants = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"]
    const vowels = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"]

    for (const consonant of initialConsonants) {
      expect(alphabetCards, `missing consonant ${consonant}`).toContain(consonant)
    }
    for (const vowel of vowels) {
      expect(alphabetCards, `missing vowel ${vowel}`).toContain(vowel)
    }
  })

  it("includes final-sound, connected-reading, and location foundations", () => {
    const batchim = FOUNDATIONS_SEED.find((lesson) => lesson.id === "alpha-7")
    const connectedReading = FOUNDATIONS_SEED.find((lesson) => lesson.id === "alpha-8")
    const locations = FOUNDATIONS_SEED.find((lesson) => lesson.id === "grammar-18")

    expect(batchim?.intro).toContain("seven representative sounds")
    expect(connectedReading?.cards.some((card) => card.hangul.includes("머거요"))).toBe(true)
    expect(locations?.cards.some((card) => card.hangul.includes("에서"))).toBe(true)
    expect(locations?.order).toBe(5)
  })
})
