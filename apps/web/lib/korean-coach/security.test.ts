import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = fileURLToPath(new URL("../../", import.meta.url))

describe("Korean Coach client security boundary", () => {
  it("never references the OpenAI API key from client modules", () => {
    const clientFiles = [
      "lib/api/korean-coach.ts",
      "hooks/useAudioRecorder.ts",
      "components/korean-coach/AudioRecorder.tsx",
      "components/korean-coach/CoachAudioPlayer.tsx",
      "app/(main)/korean-coach/practice/[scenarioId]/page.tsx",
    ]
    for (const relativePath of clientFiles) {
      const source = readFileSync(`${root}${relativePath}`, "utf8")
      expect(source, relativePath).not.toContain("OPENAI_API_KEY")
      expect(source, relativePath).not.toMatch(/sk-[A-Za-z0-9_-]{8,}/)
    }
  })

  it("sends recordings only to the authenticated application route", () => {
    const source = readFileSync(`${root}lib/api/korean-coach.ts`, "utf8")
    expect(source).toContain('"/api/ai/korean/transcribe"')
    expect(source).not.toContain("api.openai.com")
  })
})

