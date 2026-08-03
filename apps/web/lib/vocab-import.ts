export interface PreparedVocabImport {
  /** Cleaned entries, one word/phrase per line, ready to send to the import API. */
  entries: string[]
  /** Entries joined back into the text payload for the import API. */
  cleanedText: string
  /** Lines dropped because the same term appeared earlier in the pasted list. */
  duplicatesRemoved: number
  /** Lines dropped because the term is already in the user's dictionary. */
  alreadySaved: number
}

const LIST_MARKER = /^(?:[([]?\d{1,3}[)\].:]?|[•·▪‣◦*]|[-–—]|[①-⑳])\s+/
const TERM_SEPARATOR = /\s*(?:—|–|\s-\s|:|=|\(|,|\t)\s*/

function normalizeTerm(line: string): string {
  const term = line.split(TERM_SEPARATOR)[0]?.trim() ?? ""
  return (term || line).toLowerCase()
}

/**
 * Cleans a pasted word list before import: strips numbering and bullets,
 * normalizes whitespace, and drops empty lines, repeated terms, and terms
 * that are already saved. Meanings/translations are left exactly as written.
 */
export function prepareVocabImport(raw: string, existingTerms: string[] = []): PreparedVocabImport {
  const saved = new Set(existingTerms.map((term) => term.trim().toLowerCase()).filter(Boolean))
  const seen = new Set<string>()
  const entries: string[] = []
  let duplicatesRemoved = 0
  let alreadySaved = 0

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine
      .replace(LIST_MARKER, "")
      .replace(/\t+/g, " — ")
      .replace(/ {2,}/g, " ")
      .trim()

    if (!line) continue
    // Lines with no letters (e.g. stray numbering or dividers) carry no vocab.
    if (!/\p{L}/u.test(line)) continue

    const term = normalizeTerm(line)
    if (seen.has(term)) {
      duplicatesRemoved += 1
      continue
    }
    if (saved.has(term)) {
      alreadySaved += 1
      continue
    }

    seen.add(term)
    entries.push(line)
  }

  return {
    entries,
    cleanedText: entries.join("\n"),
    duplicatesRemoved,
    alreadySaved,
  }
}
