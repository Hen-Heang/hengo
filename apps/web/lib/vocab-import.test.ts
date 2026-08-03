import { describe, expect, it } from "vitest"

import { prepareVocabImport } from "./vocab-import"

describe("prepareVocabImport", () => {
  it("strips numbering and bullets while keeping translations as written", () => {
    const result = prepareVocabImport(
      "1. 공감 (empathy)\n2) 관계 (relationship)\n• 배포 - deployment\n- 서버 : server"
    )
    expect(result.entries).toEqual([
      "공감 (empathy)",
      "관계 (relationship)",
      "배포 - deployment",
      "서버 : server",
    ])
  })

  it("drops blank lines and lines without letters", () => {
    const result = prepareVocabImport("공감 - empathy\n\n   \n3.\n---\n관계 - relationship")
    expect(result.entries).toEqual(["공감 - empathy", "관계 - relationship"])
  })

  it("removes repeated terms within the pasted list", () => {
    const result = prepareVocabImport("배포 - deployment\n배포 (deploy)\n서버 - server")
    expect(result.entries).toEqual(["배포 - deployment", "서버 - server"])
    expect(result.duplicatesRemoved).toBe(1)
  })

  it("skips terms that are already in the dictionary", () => {
    const result = prepareVocabImport("배포 - deployment\n서버 - server", ["배포", "회의"])
    expect(result.entries).toEqual(["서버 - server"])
    expect(result.alreadySaved).toBe(1)
  })

  it("normalizes tabs and repeated spaces from spreadsheet pastes", () => {
    const result = prepareVocabImport("공감\tempathy\n관계    relationship")
    expect(result.entries).toEqual(["공감 — empathy", "관계 relationship"])
  })

  it("joins cleaned entries into the API payload", () => {
    const result = prepareVocabImport("1. 공감 - empathy\n1. 공감 - empathy\n2. 관계 - relationship")
    expect(result.cleanedText).toBe("공감 - empathy\n관계 - relationship")
  })
})
