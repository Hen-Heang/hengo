import { describe, expect, it } from "vitest"

import { DESKTOP_MIN_WIDTH, TABLET_MIN_WIDTH, navigationModeForWidth } from "./useNavigationMode"

describe("navigationModeForWidth", () => {
  it("uses explicit 768 / 1200 boundaries, not Tailwind's lg (1024)", () => {
    expect(TABLET_MIN_WIDTH).toBe(768)
    expect(DESKTOP_MIN_WIDTH).toBe(1200)
  })

  it("is mobile below 768", () => {
    expect(navigationModeForWidth(320)).toBe("mobile")
    expect(navigationModeForWidth(767)).toBe("mobile")
  })

  it("is tablet from 768 up to (but not including) 1200", () => {
    expect(navigationModeForWidth(768)).toBe("tablet")
    expect(navigationModeForWidth(1024)).toBe("tablet") // the old `lg` breakpoint — must stay tablet
    expect(navigationModeForWidth(1199)).toBe("tablet")
  })

  it("is desktop from 1200 up", () => {
    expect(navigationModeForWidth(1200)).toBe("desktop")
    expect(navigationModeForWidth(1440)).toBe("desktop")
  })
})
