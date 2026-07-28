import { describe, expect, it } from "vitest"

import {
  aiCoachItem,
  allNavItems,
  bottomTabs,
  comingSoonItems,
  getActiveBottomTabIndex,
  getActiveNavItem,
  getSectionForPath,
  isMoreRoute,
  isNavigationItemActive,
  moreComingSoon,
  moreGroups,
  navItem,
  navSections,
  primarySections,
  sectionRoutePrefixes,
  shippedItems,
  todayItem,
} from "./navigation"

function active(pathname: string, id: string, search?: string) {
  return isNavigationItemActive({ pathname, searchParams: search, item: navItem(id) })
}

describe("nav model integrity", () => {
  it("gives every item a unique stable id", () => {
    const ids = allNavItems.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("exposes the agreed top-level sections in order", () => {
    expect(navSections.map((s) => s.id)).toEqual([
      "today",
      "learn",
      "goals",
      "growth",
      "progress",
      "ai",
    ])
  })

  it("keeps Today out of the primary section list (rendered on its own)", () => {
    expect(primarySections.map((s) => s.id)).not.toContain("today")
  })

  it("renames the old learning 'Today' entry to Practice", () => {
    const learn = navSections.find((s) => s.id === "learn")!
    expect(learn.items[0]).toMatchObject({ href: "/practice", label: "Practice" })
    expect(learn.items.map((i) => i.label)).not.toContain("Today")
  })

  it("represents /home as the global Today destination", () => {
    expect(todayItem).toMatchObject({ href: "/home", label: "Today" })
  })

  it("keeps every previously shipped route reachable", () => {
    const hrefs = allNavItems.map((i) => i.href)
    for (const href of [
      "/home",
      "/practice",
      "/vocab",
      "/learn",
      "/reading",
      "/listening",
      "/scenarios",
      "/interview",
      "/dashboard",
      "/goals",
      "/goals/calendar",
      "/roadmap",
      "/notes",
      "/growth/habits",
      "/growth/recovery",
      "/achievements",
      "/statistics",
      "/history",
      "/chat",
      "/settings",
      "/account",
    ]) {
      expect(hrefs).toContain(href)
    }
  })
})

describe("pathname active matching", () => {
  it("matches an exact pathname", () => {
    expect(active("/goals", "goals-goals")).toBe(true)
    expect(active("/vocab", "learn-vocab")).toBe(true)
  })

  it("does not match an unrelated pathname", () => {
    expect(active("/vocab", "goals-goals")).toBe(false)
  })

  it("does not match a pathname that merely shares a prefix string", () => {
    // "/goalsomething" must not activate "/goals"
    expect(isNavigationItemActive({ pathname: "/goalsomething", item: navItem("goals-goals") })).toBe(false)
  })

  it("never marks a Coming Soon item active", () => {
    expect(active("/growth/focus", "growth-deep-work")).toBe(false)
  })
})

describe("nested route active matching", () => {
  it("activates Goals for /goals/create and /goals/[id]", () => {
    expect(active("/goals/create", "goals-goals")).toBe(true)
    expect(active("/goals/abc-123", "goals-goals")).toBe(true)
  })

  it("activates Habits for /growth/habits/[id]", () => {
    expect(active("/growth/habits/h1", "growth-habits")).toBe(true)
  })

  it("activates Recovery for /growth/recovery/pause", () => {
    expect(active("/growth/recovery/pause", "growth-recovery")).toBe(true)
  })

  it("lets a more specific sibling win over its parent prefix", () => {
    expect(active("/goals/calendar", "goals-calendar")).toBe(true)
    expect(active("/goals/calendar", "goals-goals")).toBe(false)
  })

  it("keeps Today pinned to /home only", () => {
    expect(active("/home", "today")).toBe(true)
    expect(active("/home/anything", "today")).toBe(false)
  })
})

describe("query-aware AI active matching", () => {
  const modes = ["ai-chat", "ai-analyze", "ai-generate", "ai-corrections"]

  function activeAiIds(search?: string) {
    return modes.filter((id) => active("/chat", id, search))
  }

  it("activates plain Chat when no mode is present", () => {
    expect(activeAiIds()).toEqual(["ai-chat"])
    expect(activeAiIds("")).toEqual(["ai-chat"])
  })

  it("activates only Analyze for ?mode=analyze", () => {
    expect(activeAiIds("mode=analyze")).toEqual(["ai-analyze"])
  })

  it("activates only Generate for ?mode=generate", () => {
    expect(activeAiIds("mode=generate")).toEqual(["ai-generate"])
  })

  it("activates only Corrections for ?mode=corrections", () => {
    expect(activeAiIds("mode=corrections")).toEqual(["ai-corrections"])
  })

  it("activates nothing extra for an unknown mode", () => {
    expect(activeAiIds("mode=unknown")).toEqual([])
  })

  it("accepts URLSearchParams as well as a raw string", () => {
    const params = new URLSearchParams({ mode: "analyze" })
    expect(isNavigationItemActive({ pathname: "/chat", searchParams: params, item: navItem("ai-analyze") })).toBe(true)
    expect(isNavigationItemActive({ pathname: "/chat", searchParams: params, item: aiCoachItem })).toBe(false)
  })

  it("accepts a plain object", () => {
    expect(
      isNavigationItemActive({ pathname: "/chat", searchParams: { mode: "generate" }, item: navItem("ai-generate") })
    ).toBe(true)
  })
})

describe("section (workspace) selection", () => {
  it("maps routes to their owning section", () => {
    expect(getSectionForPath("/practice")?.id).toBe("learn")
    expect(getSectionForPath("/goals/create")?.id).toBe("goals")
    expect(getSectionForPath("/growth/recovery")?.id).toBe("growth")
    expect(getSectionForPath("/statistics")?.id).toBe("progress")
    expect(getSectionForPath("/chat")?.id).toBe("ai")
    expect(getSectionForPath("/home")?.id).toBe("today")
  })

  it("returns undefined for routes outside every section", () => {
    expect(getSectionForPath("/settings")).toBeUndefined()
  })

  it("resolves the active item for header titles", () => {
    expect(getActiveNavItem("/statistics")?.label).toBe("Statistics")
    expect(getActiveNavItem("/chat", "mode=corrections")?.label).toBe("Corrections")
  })

  it("gives every primary section a route prefix list for last-visited tracking", () => {
    expect(Object.keys(sectionRoutePrefixes).sort()).toEqual(["ai", "goals", "growth", "learn", "progress"])
    expect(sectionRoutePrefixes.ai).toContain("/chat")
  })
})

describe("bottom tabs", () => {
  it("has exactly four routed tabs (plus the More trigger)", () => {
    expect(bottomTabs).toHaveLength(4)
    expect(bottomTabs.map((t) => t.label)).toEqual(["Today", "Learn", "Goals", "Growth"])
  })

  it("uses the recommended route mapping", () => {
    expect(bottomTabs.map((t) => t.href)).toEqual(["/home", "/practice", "/goals", "/growth/habits"])
  })

  it("selects the right tab index per route", () => {
    expect(getActiveBottomTabIndex("/home")).toBe(0)
    expect(getActiveBottomTabIndex("/practice")).toBe(1)
    expect(getActiveBottomTabIndex("/goals/abc")).toBe(2)
    expect(getActiveBottomTabIndex("/growth/habits/h1")).toBe(3)
  })

  it("falls back to the More slot for routes no tab owns", () => {
    expect(getActiveBottomTabIndex("/statistics")).toBe(bottomTabs.length)
    expect(getActiveBottomTabIndex("/settings")).toBe(bottomTabs.length)
  })
})

describe("More-route detection", () => {
  it("is false on the four direct tabs", () => {
    expect(isMoreRoute("/home")).toBe(false)
    expect(isMoreRoute("/practice")).toBe(false)
    expect(isMoreRoute("/goals")).toBe(false)
    expect(isMoreRoute("/growth/habits")).toBe(false)
  })

  it("is true for routes reachable only through More", () => {
    expect(isMoreRoute("/vocab")).toBe(true)
    expect(isMoreRoute("/achievements")).toBe(true)
    expect(isMoreRoute("/goals/calendar")).toBe(true)
    expect(isMoreRoute("/settings")).toBe(true)
    expect(isMoreRoute("/chat")).toBe(true)
  })
})

describe("More sheet grouping", () => {
  it("groups by Progress / Tools / Learn more / Growth / Account", () => {
    expect(moreGroups.map((g) => g.id)).toEqual([
      "progress",
      "tools",
      "learn-more",
      "growth-more",
      "account",
    ])
  })

  it("omits destinations already reachable from a bottom tab", () => {
    const ids = moreGroups.flatMap((g) => g.items.map((i) => i.id))
    expect(ids).not.toContain("learn-practice")
    expect(ids).not.toContain("goals-goals")
    expect(ids).not.toContain("growth-habits")
    expect(ids).not.toContain("today")
  })

  it("puts the less-used learning pages under Learn more", () => {
    const learnMore = moreGroups.find((g) => g.id === "learn-more")!
    expect(learnMore.items.map((i) => i.label)).toEqual([
      "Korean Coach",
      "Vocabulary",
      "Phrasebook",
      "Foundations",
      "Reading",
      "Listening",
      "Scenarios",
      "Exam Prep",
    ])
  })

  it("offers Notifications-adjacent account rows", () => {
    const account = moreGroups.find((g) => g.id === "account")!
    expect(account.items.map((i) => i.href)).toEqual(["/account", "/settings"])
  })
})

describe("Coming Soon filtering", () => {
  it("keeps soon items out of every More group", () => {
    const ids = moreGroups.flatMap((g) => g.items.map((i) => i.id))
    expect(ids.some((id) => moreComingSoon.some((s) => s.id === id))).toBe(false)
  })

  it("collects the soon placeholders separately", () => {
    expect(moreComingSoon.map((i) => i.label)).toEqual(["Deep Work", "Mood", "Rewards"])
  })

  it("shippedItems / comingSoonItems partition a list", () => {
    const growth = navSections.find((s) => s.id === "growth")!.items
    expect(shippedItems(growth).length + comingSoonItems(growth).length).toBe(growth.length)
  })
})

describe("/home stays inside the app shell", () => {
  it("is a first-class nav destination, not a standalone gate", () => {
    expect(bottomTabs[0].href).toBe("/home")
    expect(navSections.find((s) => s.id === "today")!.items).toContain(todayItem)
  })

  it("resolves a section and a title for /home like any other route", () => {
    expect(getSectionForPath("/home")?.label).toBe("Today")
    expect(getActiveNavItem("/home")?.label).toBe("Today")
  })
})
