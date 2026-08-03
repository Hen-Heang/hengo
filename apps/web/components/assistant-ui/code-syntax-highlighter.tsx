"use client"

import { useTheme } from "next-themes"
import { PrismLight } from "react-syntax-highlighter"
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import css from "react-syntax-highlighter/dist/esm/languages/prism/css"
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript"
import json from "react-syntax-highlighter/dist/esm/languages/prism/json"
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx"
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup"
import python from "react-syntax-highlighter/dist/esm/languages/prism/python"
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql"
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx"
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light"
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown"

// Only the languages actually likely to show up in a Korean-tutoring chat
// (code snippets, config, shell commands) — registering the full Prism
// language set would bloat the bundle for a feature that's a small part of
// this app.
PrismLight.registerLanguage("javascript", javascript)
PrismLight.registerLanguage("js", javascript)
PrismLight.registerLanguage("jsx", jsx)
PrismLight.registerLanguage("typescript", typescript)
PrismLight.registerLanguage("ts", typescript)
PrismLight.registerLanguage("tsx", tsx)
PrismLight.registerLanguage("json", json)
PrismLight.registerLanguage("bash", bash)
PrismLight.registerLanguage("sh", bash)
PrismLight.registerLanguage("shell", bash)
PrismLight.registerLanguage("zsh", bash)
PrismLight.registerLanguage("python", python)
PrismLight.registerLanguage("py", python)
PrismLight.registerLanguage("sql", sql)
PrismLight.registerLanguage("css", css)
PrismLight.registerLanguage("html", markup)
PrismLight.registerLanguage("xml", markup)
PrismLight.registerLanguage("yaml", yaml)
PrismLight.registerLanguage("yml", yaml)

// Plugs into MarkdownTextPrimitive's `components.SyntaxHighlighter` slot
// (see components/assistant-ui/markdown-text.tsx). `components.Pre`/`Code`
// passed in here are already OUR styled pre/code overrides (border, padding,
// rounded corners) — this only adds the colored token spans inside them, so
// visual chrome stays identical whether or not a language was recognized.
export function CodeSyntaxHighlighter({ components, language, code }: SyntaxHighlighterProps) {
  const { resolvedTheme } = useTheme()
  const style = resolvedTheme === "dark" ? oneDark : oneLight

  return (
    <PrismLight
      language={language}
      style={style}
      PreTag={components.Pre}
      CodeTag={components.Code}
      customStyle={{ margin: 0, padding: 0, background: "transparent" }}
      codeTagProps={{ style: { background: "transparent" } }}
    >
      {code}
    </PrismLight>
  )
}
