import { describe, expect, it } from "vitest"
import {
  containsHangul,
  createCorrectionFingerprint,
  normalizeKoreanText,
  shouldAnalyzeKoreanTurn,
} from "./korean-text"

describe("containsHangul", () => {
  it("detects Hangul syllables", () => {
    expect(containsHangul("안녕하세요")).toBe(true)
  })

  it("detects lone jamo", () => {
    expect(containsHangul("ㅋㅋㅋ")).toBe(true)
  })

  it("returns false for English-only text", () => {
    expect(containsHangul("hello there")).toBe(false)
  })

  it("returns false for empty text", () => {
    expect(containsHangul("")).toBe(false)
  })
})

describe("normalizeKoreanText", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeKoreanText("  안녕   하세요  ")).toBe("안녕 하세요")
  })

  it("strips trailing punctuation", () => {
    expect(normalizeKoreanText("안녕하세요!!!")).toBe("안녕하세요")
    expect(normalizeKoreanText("괜찮아요~~")).toBe("괜찮아요")
  })

  it("is idempotent", () => {
    const once = normalizeKoreanText("저는 학생이에요.")
    expect(normalizeKoreanText(once)).toBe(once)
  })
})

describe("shouldAnalyzeKoreanTurn", () => {
  it("rejects empty input", () => {
    expect(shouldAnalyzeKoreanTurn("")).toBe(false)
    expect(shouldAnalyzeKoreanTurn("   ")).toBe(false)
  })

  it("rejects non-Korean text", () => {
    expect(shouldAnalyzeKoreanTurn("How do I say thank you?")).toBe(false)
  })

  it("rejects bare acknowledgements", () => {
    expect(shouldAnalyzeKoreanTurn("네")).toBe(false)
    expect(shouldAnalyzeKoreanTurn("감사합니다!")).toBe(false)
    expect(shouldAnalyzeKoreanTurn("아니요~")).toBe(false)
  })

  it("accepts an acknowledgement followed by real content", () => {
    expect(shouldAnalyzeKoreanTurn("네 알겠습니다 근데 회의는 몇시에요")).toBe(true)
  })

  it("accepts meaningful Korean sentences", () => {
    expect(shouldAnalyzeKoreanTurn("저는 어제 회사에서 발표 했어요")).toBe(true)
  })

  it("rejects text over the max length", () => {
    const long = "안녕하세요 ".repeat(100)
    expect(shouldAnalyzeKoreanTurn(long)).toBe(false)
  })
})

describe("createCorrectionFingerprint", () => {
  it("is stable for the same inputs", () => {
    const a = createCorrectionFingerprint({
      originalText: "나는 학교에 갔다",
      correctedText: "저는 학교에 갔어요",
      category: "politeness",
    })
    const b = createCorrectionFingerprint({
      originalText: "나는 학교에 갔다",
      correctedText: "저는 학교에 갔어요",
      category: "politeness",
    })
    expect(a).toBe(b)
  })

  it("ignores whitespace/punctuation/case differences", () => {
    const a = createCorrectionFingerprint({
      originalText: "나는  학교에 갔다!!",
      correctedText: "저는 학교에 갔어요.",
      category: "Politeness",
    })
    const b = createCorrectionFingerprint({
      originalText: "나는 학교에 갔다",
      correctedText: "저는 학교에 갔어요",
      category: "politeness",
    })
    expect(a).toBe(b)
  })

  it("differs when the correction differs", () => {
    const a = createCorrectionFingerprint({
      originalText: "나는 학교에 갔다",
      correctedText: "저는 학교에 갔어요",
      category: "politeness",
    })
    const b = createCorrectionFingerprint({
      originalText: "나는 학교에 갔다",
      correctedText: "저는 학교에 갔습니다",
      category: "politeness",
    })
    expect(a).not.toBe(b)
  })

  it("defaults category to general when missing", () => {
    const a = createCorrectionFingerprint({ originalText: "a", correctedText: "b" })
    const b = createCorrectionFingerprint({ originalText: "a", correctedText: "b", category: "general" })
    expect(a).toBe(b)
  })
})
