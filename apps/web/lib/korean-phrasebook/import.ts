import { phraseImportRowSchema, type PhraseImportRow } from "./schemas"
import type { PhraseCardContentInput } from "./schemas"

// Pure JSON/CSV import parsing + validation + dedup for the Phrasebook
// "New" flow's import dialog. No network, no Supabase — the caller (a
// component) shows the preview this produces and only writes rows the user
// confirms. Deliberately hand-rolled (no CSV dependency): the app has none
// today and the format is simple enough not to justify adding one.

export const IMPORT_CSV_COLUMNS = [
  "category",
  "situation",
  "difficulty",
  "questionKorean",
  "questionRomanization",
  "questionEnglish",
  "questionRegister",
  "answerKorean",
  "answerRomanization",
  "answerEnglish",
  "answerRegister",
  "usageNote",
  "tags",
] as const

// Downloadable template a user can fill in and re-import — one example row
// plus the header, "tags" pipe-separated since commas are the delimiter.
export const IMPORT_CSV_TEMPLATE = [
  IMPORT_CSV_COLUMNS.join(","),
  [
    "workplace",
    "status-update",
    "medium",
    "지금 어떤 작업을 하고 계신가요?",
    "jigeum eotteon jageobeul hago gyesin-gayo?",
    "What are you working on right now?",
    "formal",
    "저는 배포 스크립트를 작성하고 있습니다.",
    "jeoneun baepo seukeuripteureul jakseonghago itseumnida.",
    "I am writing a deployment script.",
    "formal",
    "Use in a standup.",
    "standup|deploy",
  ]
    .map((field) => (field.includes(",") ? `"${field.replace(/"/g, '""')}"` : field))
    .join(","),
].join("\n")

// ── CSV parsing (RFC4180-ish: quoted fields, escaped "" quotes, \r\n) ──────

function parseCsvLines(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0
  const normalized = text.replace(/\r\n/g, "\n")

  while (i < normalized.length) {
    const char = normalized[i]
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (char === ",") {
      row.push(field)
      field = ""
      i += 1
      continue
    }
    if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i += 1
      continue
    }
    field += char
    i += 1
  }
  // Trailing field/row (files without a final newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

export function parseCsvImport(text: string): Record<string, string>[] {
  const lines = parseCsvLines(text)
  if (lines.length === 0) return []
  const header = lines[0].map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const record: Record<string, string> = {}
    header.forEach((key, idx) => {
      const value = (line[idx] ?? "").trim()
      if (value) record[key] = value
    })
    return record
  })
}

export function parseJsonImport(text: string): unknown[] {
  const parsed: unknown = JSON.parse(text)
  if (Array.isArray(parsed)) return parsed
  throw new Error("JSON import must be an array of row objects")
}

// ── Validation + dedup ──────────────────────────────────────────────────────

export interface ImportRowIssue {
  index: number
  errors: string[]
}

export interface ImportPreview {
  validRows: PhraseImportRow[]
  invalidRows: ImportRowIssue[]
  duplicateRows: number[] // indices among validRows that were dropped as duplicates
}

function normalizeForDedup(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim()
}

function dedupKey(row: PhraseImportRow): string {
  return `${normalizeForDedup(row.questionKorean)}::${normalizeForDedup(row.answerKorean)}`
}

// tags column: pipe-separated in CSV/template, but JSON rows may already
// supply an array — this normalizes both into the schema's string[] shape
// before validation runs.
function coerceTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "string" && value.trim()) return value.split("|").map((t) => t.trim()).filter(Boolean)
  return undefined
}

/**
 * Validates every raw row against phraseImportRowSchema, then drops rows
 * that duplicate either an already-existing card (existingKeys, built by the
 * caller from question+answer text already in the database) or another row
 * earlier in the same import batch. Nothing here writes anything — the
 * caller shows this preview and only imports validRows minus duplicateRows.
 */
export function validateImportRows(rawRows: unknown[], existingKeys: Set<string> = new Set()): ImportPreview {
  const validRows: PhraseImportRow[] = []
  const invalidRows: ImportRowIssue[] = []
  const duplicateRows: number[] = []
  const seenInBatch = new Set<string>()

  rawRows.forEach((raw, index) => {
    const candidate =
      raw && typeof raw === "object"
        ? { ...(raw as Record<string, unknown>), tags: coerceTags((raw as Record<string, unknown>).tags) }
        : raw
    const result = phraseImportRowSchema.safeParse(candidate)
    if (!result.success) {
      invalidRows.push({ index, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) })
      return
    }
    const key = dedupKey(result.data)
    if (existingKeys.has(key) || seenInBatch.has(key)) {
      duplicateRows.push(validRows.length)
      validRows.push(result.data) // kept in validRows so the preview can show it struck through
      return
    }
    seenInBatch.add(key)
    validRows.push(result.data)
  })

  return { validRows, invalidRows, duplicateRows }
}

/** Rows the caller should actually write — valid and not a duplicate. */
export function importableRows(preview: ImportPreview): PhraseImportRow[] {
  const duplicateSet = new Set(preview.duplicateRows)
  return preview.validRows.filter((_, index) => !duplicateSet.has(index))
}

// The brief requires romanization on every question and recommended answer
// (it's learning support, not decoration) — a row missing it parses fine
// (those columns are optional so a minimal import doesn't reject outright)
// but isn't ready to write as a card until the gap is filled in.
export function isRowComplete(row: PhraseImportRow): boolean {
  return Boolean(
    row.questionRomanization &&
      row.questionEnglish &&
      row.questionRegister &&
      row.answerRomanization &&
      row.answerEnglish &&
      row.answerRegister,
  )
}

// Only call this on a row that isRowComplete() has already accepted — the
// empty-string fallbacks exist purely so this stays total (never throws);
// they'd fail phraseCardContentSchema's min-length check if actually written.
export function rowToCardContent(row: PhraseImportRow): PhraseCardContentInput {
  return {
    category: row.category,
    situation: row.situation,
    difficulty: row.difficulty ?? "medium",
    question: {
      korean: row.questionKorean,
      romanization: row.questionRomanization ?? "",
      english: row.questionEnglish ?? "",
      register: row.questionRegister ?? "polite",
    },
    questionVariants: [],
    answers: [
      {
        korean: row.answerKorean,
        romanization: row.answerRomanization ?? "",
        english: row.answerEnglish ?? "",
        register: row.answerRegister ?? "polite",
        isRecommended: true,
      },
    ],
    usageNote: row.usageNote,
    vocabulary: [],
    tags: row.tags ?? [],
  }
}

export { dedupKey as importDedupKey }
