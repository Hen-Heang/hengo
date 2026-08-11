import { describe, expect, it } from "vitest"

import { getHolidaysForDate, HOLIDAY_COUNTRY_META } from "./holidays"

describe("getHolidaysForDate", () => {
  it("returns an empty array for a non-holiday date", () => {
    expect(getHolidaysForDate(new Date(2026, 5, 15))).toEqual([])
  })

  it("finds a single-country holiday by local date", () => {
    // 2026-10-09 — Hangeul Day (Korea)
    const holidays = getHolidaysForDate(new Date(2026, 9, 9))
    expect(holidays).toHaveLength(1)
    expect(holidays[0]).toMatchObject({ country: "KR", name: "Hangeul Day" })
  })

  it("finds Cambodia holidays independently of Korea's", () => {
    // 2026-10-29 — King's Coronation Day (Cambodia only)
    const holidays = getHolidaysForDate(new Date(2026, 9, 29))
    expect(holidays).toHaveLength(1)
    expect(holidays[0].country).toBe("KH")
  })

  it("returns both countries when their holidays coincide", () => {
    // 2026-01-01 — New Year's Day in both Korea and Cambodia
    const holidays = getHolidaysForDate(new Date(2026, 0, 1))
    const countries = holidays.map((h) => h.country).sort()
    expect(countries).toEqual(["KH", "KR"])
  })

  it("covers 2025 and 2027 as well as 2026", () => {
    expect(getHolidaysForDate(new Date(2025, 0, 1))).not.toEqual([])
    expect(getHolidaysForDate(new Date(2027, 0, 1))).not.toEqual([])
  })

  it("provides a country label for every supported holiday", () => {
    expect(HOLIDAY_COUNTRY_META).toEqual({
      KR: { label: "South Korea" },
      KH: { label: "Cambodia" },
    })
  })
})
