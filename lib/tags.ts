// Shared free-text tag parsing — used by Inbox and Notes tag inputs.
// Framework-free, tested.

/** Parses a free-typed "tag1, tag2, tag2" string into trimmed, deduped, lowercase tags. */
export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(",")) {
    const tag = part.trim().toLowerCase()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
  }
  return out
}
