import { marked, Renderer } from "marked"

// Client-side markdown → HTML for study notes. koriai is a client SPA, so the
// original server-side shiki highlighter is dropped; code blocks are wrapped in
// `.shiki-wrapper` so CodeCopy + globals.css can style them. Headings get stable
// ids (h2/h3) so the TOC and reading-progress observers can anchor to them.

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function renderMarkdown(content: string): string {
  const renderer = new Renderer()

  renderer.link = ({ href, title, tokens }) => {
    const text = tokens.map((t) => ("raw" in t ? t.raw : "")).join("")
    if (href === "../README.md" || href === "../README") {
      return `<a href="/notes">← Back</a>`
    }
    const resolvedHref = href?.replace(/\.md$/, "") ?? "#"
    const titleAttr = title ? ` title="${title}"` : ""
    return `<a href="${resolvedHref}"${titleAttr}>${text}</a>`
  }

  renderer.code = ({ text, lang }) => {
    const rawLang = (lang ?? "").toLowerCase().trim()
    const langAttr = rawLang ? ` data-lang="${rawLang}"` : ""
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    return `<div class="shiki-wrapper"${langAttr}><pre><code>${escaped}</code></pre></div>`
  }

  renderer.heading = ({ text, depth, tokens }) => {
    const rawText = tokens.map((t) => ("raw" in t ? t.raw : "")).join("")
    const id = slugifyHeading(rawText)
    if (depth === 2 || depth === 3) {
      return `<h${depth} id="${id}">${text}</h${depth}>`
    }
    return `<h${depth}>${text}</h${depth}>`
  }

  return marked(content, { renderer, gfm: true, breaks: false }) as string
}
