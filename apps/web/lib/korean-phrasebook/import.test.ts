import { describe, expect, it } from "vitest"
import {
  IMPORT_CSV_TEMPLATE,
  importDedupKey,
  importableRows,
  isRowComplete,
  parseCsvImport,
  parseJsonImport,
  validateImportRows,
} from "./import"

describe("parseCsvImport", () => {
  it("parses a simple CSV with header row", () => {
    const csv = "category,situation,questionKorean,answerKorean\nworkplace,deadline,질문,답변"
    const rows = parseCsvImport(csv)
    expect(rows).toEqual([{ category: "workplace", situation: "deadline", questionKorean: "질문", answerKorean: "답변" }])
  })

  it("handles quoted fields containing commas", () => {
    const csv = 'category,usageNote\nworkplace,"Use in a meeting, not casually"'
    const rows = parseCsvImport(csv)
    expect(rows[0].usageNote).toBe("Use in a meeting, not casually")
  })

  it("handles escaped double quotes inside quoted fields", () => {
    const csv = 'category,usageNote\nworkplace,"She said ""hello"""'
    const rows = parseCsvImport(csv)
    expect(rows[0].usageNote).toBe('She said "hello"')
  })

  it("the downloadable template itself parses into one valid row", () => {
    const rows = parseCsvImport(IMPORT_CSV_TEMPLATE)
    expect(rows).toHaveLength(1)
    expect(rows[0].category).toBe("workplace")
  })
})

describe("parseJsonImport", () => {
  it("parses a JSON array", () => {
    expect(parseJsonImport('[{"a":1}]')).toEqual([{ a: 1 }])
  })
  it("rejects non-array JSON", () => {
    expect(() => parseJsonImport('{"a":1}')).toThrow()
  })
})

const validRow = {
  category: "workplace",
  situation: "deadline",
  questionKorean: "언제까지 완료할 수 있을까요?",
  answerKorean: "오늘 안에 완료하겠습니다.",
}

describe("validateImportRows", () => {
  it("accepts a valid minimal row", () => {
    const preview = validateImportRows([validRow])
    expect(preview.validRows).toHaveLength(1)
    expect(preview.invalidRows).toHaveLength(0)
    expect(preview.duplicateRows).toHaveLength(0)
  })

  it("rejects a row missing required fields, with a reason", () => {
    const preview = validateImportRows([{ category: "workplace" }])
    expect(preview.validRows).toHaveLength(0)
    expect(preview.invalidRows).toHaveLength(1)
    expect(preview.invalidRows[0].errors.length).toBeGreaterThan(0)
  })

  it("coerces a pipe-separated tags string into an array", () => {
    const preview = validateImportRows([{ ...validRow, tags: "standup|deadline" }])
    expect(preview.validRows[0].tags).toEqual(["standup", "deadline"])
  })

  it("flags duplicates against existing content without dropping them from validRows", () => {
    const existingKeys = new Set([importDedupKey(validRow as never)])
    const preview = validateImportRows([validRow], existingKeys)
    expect(preview.validRows).toHaveLength(1)
    expect(preview.duplicateRows).toEqual([0])
    expect(importableRows(preview)).toHaveLength(0)
  })

  it("flags duplicates within the same import batch, keeping the first occurrence importable", () => {
    const preview = validateImportRows([validRow, { ...validRow }])
    expect(preview.duplicateRows).toEqual([1])
    expect(importableRows(preview)).toHaveLength(1)
  })

  it("treats question+answer text as the identity, ignoring unrelated field differences", () => {
    const variant = { ...validRow, difficulty: "hard" as const, usageNote: "different note" }
    const preview = validateImportRows([validRow, variant])
    expect(preview.duplicateRows).toEqual([1])
  })
})

describe("isRowComplete", () => {
  it("is false when romanization is missing, even though the row parses", () => {
    const preview = validateImportRows([validRow])
    expect(preview.validRows[0]).toBeDefined()
    expect(isRowComplete(preview.validRows[0])).toBe(false)
  })

  it("is true once every romanization/english/register field is present", () => {
    const complete = {
      ...validRow,
      questionRomanization: "eonjekkaji wallyohal su isseulkkayo?",
      questionEnglish: "By when can it be completed?",
      questionRegister: "formal" as const,
      answerRomanization: "oneul ane wallyohagesseumnida.",
      answerEnglish: "I will complete it today.",
      answerRegister: "formal" as const,
    }
    const preview = validateImportRows([complete])
    expect(isRowComplete(preview.validRows[0])).toBe(true)
  })
})
