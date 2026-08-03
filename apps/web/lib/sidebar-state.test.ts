/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { SIDEBAR_STORAGE_KEY, readSidebarCollapsed, writeSidebarCollapsed } from "./sidebar-state"

describe("sidebar state persistence", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it("uses an application-specific storage key", () => {
    expect(SIDEBAR_STORAGE_KEY).toBe("hengo-sidebar-collapsed")
  })

  it("defaults to expanded when nothing is stored", () => {
    expect(readSidebarCollapsed()).toBe(false)
  })

  it("round-trips the collapsed flag", () => {
    writeSidebarCollapsed(true)
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true")
    expect(readSidebarCollapsed()).toBe(true)

    writeSidebarCollapsed(false)
    expect(readSidebarCollapsed()).toBe(false)
  })

  it("treats any non-'true' stored value as expanded", () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, "garbage")
    expect(readSidebarCollapsed()).toBe(false)
  })

  it("falls back to expanded when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied")
    })
    expect(readSidebarCollapsed()).toBe(false)
  })

  it("does not throw when writing to unavailable storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied")
    })
    expect(() => writeSidebarCollapsed(true)).not.toThrow()
  })
})
