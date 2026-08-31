import { describe, expect, it } from "vitest"

import { SUPABASE_CONFIGURATION_MESSAGE, resolveSupabaseClientConfig } from "./supabase"

describe("Supabase client configuration", () => {
  it("uses an inert valid client configuration when environment values are absent", () => {
    const config = resolveSupabaseClientConfig(undefined, undefined)
    expect(config.configured).toBe(false)
    expect(config.url).toMatch(/^https:\/\//)
    expect(config.key.length).toBeGreaterThan(0)
  })

  it("uses trimmed project values only when both are present", () => {
    expect(
      resolveSupabaseClientConfig(" https://example.supabase.co ", " publishable-key "),
    ).toEqual({
      url: "https://example.supabase.co",
      key: "publishable-key",
      configured: true,
    })
    expect(resolveSupabaseClientConfig("https://example.supabase.co", "").configured).toBe(false)
  })

  it("provides an actionable setup message", () => {
    expect(SUPABASE_CONFIGURATION_MESSAGE).toContain(".env.local")
    expect(SUPABASE_CONFIGURATION_MESSAGE).toContain("NEXT_PUBLIC_SUPABASE_URL")
    expect(SUPABASE_CONFIGURATION_MESSAGE).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  })
})
