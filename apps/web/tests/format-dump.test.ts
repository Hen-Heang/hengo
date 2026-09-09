import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"

describe("temporary formatter dump", () => {
  it("prints the Prettier diff for the vocab files", () => {
    const files = [
      "components/vocab/EssentialBooksPanel.tsx",
      "components/vocab/VocabDictionary.tsx",
    ]

    execFileSync("pnpm", ["exec", "prettier", "--write", ...files], {
      cwd: process.cwd(),
      stdio: "pipe",
    })
    const diff = execFileSync("git", ["diff", "--", ...files], {
      cwd: process.cwd(),
      encoding: "utf8",
    })

    console.log(`FORMAT_DIFF_START\n${diff}\nFORMAT_DIFF_END`)
    expect(diff.length).toBeGreaterThan(0)
  })
})
