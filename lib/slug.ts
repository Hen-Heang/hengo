// Shared slug generation — used wherever a title needs to become a URL-safe,
// stable identifier (Notes, Inbox → Note conversion). Framework-free, tested.

export function slugify(source: string): string {
  return source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Appends a numeric suffix until the slug no longer collides with `existingSlugs`. */
export function dedupeSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) return slug
  let suffix = 2
  while (existingSlugs.includes(`${slug}-${suffix}`)) suffix += 1
  return `${slug}-${suffix}`
}
