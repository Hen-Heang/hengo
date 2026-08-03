import { createHighlighter, type Highlighter } from "shiki";
import { marked, Renderer } from "marked";

// Language aliases — map markdown fence names to shiki lang IDs
const LANG_MAP: Record<string, string> = {
  js:         "javascript",
  ts:         "typescript",
  jsx:        "jsx",
  tsx:        "tsx",
  java:       "java",
  sql:        "sql",
  xml:        "xml",
  jsp:        "html",   // JSP is close enough to HTML
  html:       "html",
  css:        "css",
  bash:       "bash",
  sh:         "bash",
  shell:      "bash",
  json:       "json",
  properties: "properties",
  yaml:       "yaml",
  text:       "text",
  txt:        "text",
};

const SUPPORTED_LANGS = [
  "javascript", "typescript", "jsx", "tsx",
  "java", "sql", "xml", "html", "css",
  "bash", "json", "properties", "yaml", "text",
];

let _highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!_highlighter) {
    _highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: SUPPORTED_LANGS,
    });
  }
  return _highlighter;
}

export async function renderMarkdown(content: string): Promise<string> {
  const highlighter = await getHighlighter();

  const renderer = new Renderer();

  // Rewrite markdown internal links so they work as Next.js routes
  renderer.link = ({ href, title, tokens }) => {
    const text = tokens.map((t) => ("raw" in t ? t.raw : "")).join("");
    // ../README.md  →  /  (back to home)
    if (href === "../README.md" || href === "../README") {
      return `<a href="/">← Back</a>`;
    }
    // Any other relative .md link — strip extension (not used currently but safe)
    const resolvedHref = href?.replace(/\.md$/, "") ?? "#";
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${resolvedHref}"${titleAttr}>${text}</a>`;
  };

  renderer.code = ({ text, lang }) => {
    const rawLang = (lang ?? "").toLowerCase().trim();
    const resolvedLang = LANG_MAP[rawLang] ?? rawLang;
    const safeLang = SUPPORTED_LANGS.includes(resolvedLang) ? resolvedLang : "text";

    try {
      const html = highlighter.codeToHtml(text, {
        lang: safeLang,
        theme: "github-dark",
      });
      // Wrap so we can style / attach copy button + show language label
      const langAttr = rawLang ? ` data-lang="${rawLang}"` : "";
      return `<div class="shiki-wrapper"${langAttr}>${html}</div>`;
    } catch {
      // Fallback plain block
      return `<pre><code>${text}</code></pre>`;
    }
  };

  renderer.heading = ({ text, depth, tokens }) => {
    const rawText = tokens.map((t) => ("raw" in t ? t.raw : "")).join("");
    const id = rawText.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const Tag = `h${depth}` as const;
    if (depth === 2 || depth === 3) {
      return `<${Tag} id="${id}">${text}</${Tag}>`;
    }
    return `<${Tag}>${text}</${Tag}>`;
  };

  return marked(content, { renderer, gfm: true, breaks: false }) as Promise<string>;
}
