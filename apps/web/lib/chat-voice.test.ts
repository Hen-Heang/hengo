import { describe, expect, it } from "vitest"

import {
  extractKoreanForSpeech,
  parseVoiceSubtitles,
  splitKoreanSentences,
} from "./chat-voice"

describe("extractKoreanForSpeech", () => {
  it("keeps the Korean turn and removes subtitle lines", () => {
    const reply = [
      "오늘 회사에서 무슨 일을 했어요?",
      "EN: What did you do at work today?",
      "RR: Oneul hoeseseo museun ireul haesseoyo?",
      "FIX: 오늘 회사에서 뭐 했어요?",
    ].join("\n")

    expect(extractKoreanForSpeech(reply)).toBe("오늘 회사에서 무슨 일을 했어요?")
  })

  it("recognizes markdown-formatted labels and strips markdown", () => {
    const reply = [
      "## **한국어:** 정말 잘됐네요!",
      "- 다음에는 어떤 기능을 만들 거예요?",
      "**EN:** Great news — 다음 is next.",
      "> **FIX:** 다음에 어떤 기능을 만들 거예요?",
    ].join("\n")

    expect(extractKoreanForSpeech(reply)).toBe(
      "정말 잘됐네요! 다음에는 어떤 기능을 만들 거예요?",
    )
  })

  it("returns an empty string when there is no Korean to speak", () => {
    expect(extractKoreanForSpeech("EN: Tell me about your day.")).toBe("")
  })
})

describe("parseVoiceSubtitles", () => {
  it("splits a voice reply into Korean and subtitle parts", () => {
    const reply = [
      "아, 좋았겠어요.",
      "어떤 카페에 갔어요?",
      "EN: Oh, that sounds nice. Which café did you go to?",
      "RR: A, joh-assgesseoyo. Eotteon kape-e gasseoyo?",
      "FIX: '카페에 갔다 왔어요'가 더 자연스러워요.",
    ].join("\n")

    expect(parseVoiceSubtitles(reply)).toEqual({
      korean: "아, 좋았겠어요. 어떤 카페에 갔어요?",
      en: "Oh, that sounds nice. Which café did you go to?",
      rr: "A, joh-assgesseoyo. Eotteon kape-e gasseoyo?",
      fix: "'카페에 갔다 왔어요'가 더 자연스러워요.",
    })
  })

  it("returns null for regular prose replies so markdown rendering is kept", () => {
    expect(
      parseVoiceSubtitles("Here is the difference between 이/가 and 은/는:\n- 이/가 marks the subject"),
    ).toBeNull()
  })

  it("returns null when there are no subtitle labels at all", () => {
    expect(parseVoiceSubtitles("오늘 뭐 했어요?")).toBeNull()
  })
})

describe("splitKoreanSentences", () => {
  it("splits on sentence-ending punctuation", () => {
    expect(splitKoreanSentences("아, 좋았겠어요. 어떤 카페에 갔어요?")).toEqual([
      "아, 좋았겠어요.",
      "어떤 카페에 갔어요?",
    ])
  })

  it("keeps a trailing sentence without punctuation", () => {
    expect(splitKoreanSentences("좋아요! 내일 만나요")).toEqual(["좋아요!", "내일 만나요"])
  })

  it("merges tiny fragments into the previous sentence", () => {
    expect(splitKoreanSentences("정말 맛있었어요. 네!")).toEqual(["정말 맛있었어요. 네!"])
  })
})
