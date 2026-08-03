import { describe, expect, it } from "vitest"
import { dateKeyInTimeZone } from "./date-key"

describe("dateKeyInTimeZone", () => {
  it("uses Asia/Seoul by default", () => {
    // 2026-07-20T15:30:00Z is 2026-07-21 00:30 in KST (UTC+9) — the whole
    // point of this helper is that these two must NOT match.
    const utc = new Date("2026-07-20T15:30:00Z")
    expect(dateKeyInTimeZone(utc)).toBe("2026-07-21")
  })

  it("differs from the naive UTC slice across the KST midnight boundary", () => {
    const utc = new Date("2026-07-20T15:30:00Z")
    const naiveUtcKey = utc.toISOString().slice(0, 10)
    expect(naiveUtcKey).toBe("2026-07-20")
    expect(dateKeyInTimeZone(utc)).toBe("2026-07-21")
  })

  it("stays on the same Korean day just before KST midnight", () => {
    // 2026-07-20T14:59:00Z is 2026-07-20 23:59 KST.
    const utc = new Date("2026-07-20T14:59:00Z")
    expect(dateKeyInTimeZone(utc)).toBe("2026-07-20")
  })

  it("crosses a month boundary correctly", () => {
    // 2026-01-31T15:01:00Z is 2026-02-01 00:01 KST.
    const utc = new Date("2026-01-31T15:01:00Z")
    expect(dateKeyInTimeZone(utc)).toBe("2026-02-01")
  })

  it("crosses a year boundary correctly", () => {
    // 2025-12-31T15:01:00Z is 2026-01-01 00:01 KST.
    const utc = new Date("2025-12-31T15:01:00Z")
    expect(dateKeyInTimeZone(utc)).toBe("2026-01-01")
  })

  it("honors an explicit time zone", () => {
    const utc = new Date("2026-07-20T15:30:00Z")
    expect(dateKeyInTimeZone(utc, "UTC")).toBe("2026-07-20")
  })

  it("falls back to Asia/Seoul for an invalid time zone", () => {
    const utc = new Date("2026-07-20T15:30:00Z")
    expect(dateKeyInTimeZone(utc, "Not/AZone")).toBe("2026-07-21")
  })
})
