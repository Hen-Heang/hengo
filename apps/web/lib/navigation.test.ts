import { describe, expect, it } from "vitest"

import {
  aiCoachItem,
  allNavItems,
  askHengoItem,
  bottomTabs,
  comingSoonItems,
  getActiveBottomTabIndex,
  getActiveNavItem,
  getSectionForPath,
  isMoreRoute,
  isNavigationItemActive,
  memoryHubItem,
  moreComingSoon,
  moreGroups,
  navItem,
  navSections,
  primarySections,
  secondaryNavItems,
  sectionRoutePrefixes,
  shippedItems,
  todayItem,
  workspaceNavSections,
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
      "review",
      "memory",
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
      "/phrasebook?mode=reading",
      "/listening",
      "/scenarios",
      "/interview",
      "/goals/overview",
      "/goals",
      "/goals/tasks",
      "/goals/calendar",
      "/roadmap",
      "/notes",
      "/inbox",
      "/growth/habits",
      "/growth/recovery",
      "/achievements",
      "/statistics",
      "/history",
      "/timeline",
      "/review/morning",
      "/ask-hengo/memories",
      "/chat",
      "/chat?mode=analyze",
      "/chat?mode=generate",
      "/chat?mode=corrections",
      "/chat?mode=memory",
      "/settings",
    ]) {
      expect(hrefs).toContain(href)
    }
  })

  it("has no separate Account nav item — /account is a legacy alias for Settings, not a distinct destination", () => {
    expect(allNavItems.some((i) => i.id === "account")).toBe(false)
    expect(allNavItems.some((i) => i.href === "/account")).toBe(false)
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
    expect(getSectionForPath("/statistics")?.id).toBe("review")
    expect(getSectionForPath("/ask-hengo/memories")?.id).toBe("memory")
    expect(getSectionForPath("/chat", "mode=memory")?.id).toBe("memory")
    expect(getSectionForPath("/notes")?.id).toBe("memory")
    expect(getSectionForPath("/inbox")?.id).toBe("memory")
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
    expect(Object.keys(sectionRoutePrefixes).sort()).toEqual([
      "ai",
      "goals",
      "growth",
      "learn",
      "memory",
      "review",
    ])
    expect(sectionRoutePrefixes.ai).toContain("/chat")
  })
})

describe("Simplified AI + Memory/Review navigation", () => {
  it("only shows Goals, Growth, Memory, Review as primary sidebar/rail groups, in that order", () => {
    expect(workspaceNavSections.map((s) => s.id)).toEqual(["goals", "growth", "memory", "review"])
  })

  it("lists Learn as the only secondary destination — Settings lives in the account menu", () => {
    expect(secondaryNavItems.map((i) => i.id)).toEqual(["learn-hub"])
  })

  it("keeps Chat, Analyze, Generate and Corrections as real, hidden-from-chrome routes", () => {
    for (const id of ["ai-chat", "ai-analyze", "ai-generate", "ai-corrections"]) {
      const item = navItem(id)
      expect(item.showInSidebar).toBe(false)
      expect(allNavItems).toContain(item)
    }
  })

  it("resolves AI Coach and its mode variants by title even though they're hidden", () => {
    expect(getActiveNavItem("/chat")?.label).toBe("AI Coach")
    expect(getActiveNavItem("/chat", "mode=analyze")?.label).toBe("Analyze")
    expect(getActiveNavItem("/chat", "mode=generate")?.label).toBe("Generate")
  })

  it("separates the Memory workspace (browse) from the Ask Hengo action (ask) as distinct routes", () => {
    expect(memoryHubItem.href).toBe("/ask-hengo/memories")
    expect(askHengoItem.href).toBe("/chat?mode=memory")
    expect(memoryHubItem.href).not.toBe(askHengoItem.href)
    // Memories is a visible sidebar row now (alongside Inbox/Notes); Ask
    // Hengo stays a hidden global action reachable only via header/More/Quick
    // Switcher, never a second visible row in the Memory group.
    expect(memoryHubItem.showInSidebar).not.toBe(false)
    expect(askHengoItem.showInSidebar).toBe(false)
  })

  it("activates the Memory workspace for /ask-hengo/memories, /chat?mode=memory, /notes and /inbox", () => {
    expect(getSectionForPath("/ask-hengo/memories")?.id).toBe("memory")
    expect(getSectionForPath("/chat", "mode=memory")?.id).toBe("memory")
    expect(getSectionForPath("/notes")?.id).toBe("memory")
    expect(getSectionForPath("/notes/abc-123")?.id).toBe("memory")
    expect(getSectionForPath("/inbox")?.id).toBe("memory")
  })

  it("gives Memory a visible sidebar row for Inbox, Notes and Memories, in that order", () => {
    const memory = navSections.find((s) => s.id === "memory")!
    expect(memory.items.map((i) => i.id)).toEqual(["memory-inbox", "memory-notes", "memory-hub", "memory-ask-hengo"])
    expect(memory.items.filter((i) => i.showInSidebar !== false).map((i) => i.label)).toEqual([
      "Inbox",
      "Notes",
      "Memories",
    ])
  })

  it("folds the old Progress workspace's routes into Review, visible like Goals/Growth", () => {
    const review = navSections.find((s) => s.id === "review")!
    expect(review.items.map((i) => i.id)).toEqual([
      "review-hub",
      "review-achievements",
      "review-statistics",
      "review-history",
      "review-timeline",
    ])
    expect(review.items.every((i) => i.showInSidebar !== false)).toBe(true)
    for (const route of ["/review/morning", "/achievements", "/statistics", "/history", "/timeline"]) {
      expect(getSectionForPath(route)?.id).toBe("review")
    }
  })
})

describe("Learning Hub consolidation", () => {
  const learnRoutes = [
    "/learn",
    "/practice",
    "/korean-coach",
    "/vocab",
    "/phrasebook",
    "/listening",
    "/scenarios",
    "/interview",
  ]

  it("keeps every Korean route inside the learn section", () => {
    for (const route of learnRoutes) {
      expect(getSectionForPath(route)?.id).toBe("learn")
    }
    // Reading and Foundations are merged into Phrasebook as ?mode= query
    // variants, not their own pathnames — see learn-reading/learn-foundations
    // in lib/navigation.ts.
    expect(getSectionForPath("/phrasebook", "mode=reading")?.id).toBe("learn")
    expect(getSectionForPath("/phrasebook", "mode=foundations")?.id).toBe("learn")
  })

  it("resolves a specific child title for every route, and 'Learn' for the hub itself", () => {
    expect(getActiveNavItem("/learn")?.label).toBe("Learn")
    expect(getActiveNavItem("/practice")?.label).toBe("Practice")
    expect(getActiveNavItem("/korean-coach")?.label).toBe("Korean Coach")
    expect(getActiveNavItem("/phrasebook", { mode: "reading" })?.label).toBe("Reading")
    expect(getActiveNavItem("/interview")?.label).toBe("Exam Prep")
  })

  it("hides every Learn child from the sidebar/rail while keeping it a real, searchable route", () => {
    const learn = navSections.find((s) => s.id === "learn")!
    const hidden = learn.items.filter((i) => i.id !== "learn-hub")
    expect(hidden).toHaveLength(9)
    expect(hidden.every((i) => i.showInSidebar === false)).toBe(true)
    expect(hidden.every((i) => allNavItems.includes(i))).toBe(true)
  })

  it("has no mobile bottom tab of its own — Learn moved to the More sheet as a secondary destination", () => {
    expect(bottomTabs.some((t) => t.id === "tab-learn")).toBe(false)
    for (const route of ["/learn", "/practice", "/korean-coach", "/phrasebook", "/interview"]) {
      expect(getActiveBottomTabIndex(route)).toBe(bottomTabs.length)
    }
  })
})

describe("Goals Hub consolidation", () => {
  it("keeps every Goals hub route inside the goals section", () => {
    for (const route of ["/goals", "/goals/overview", "/goals/tasks", "/goals/calendar"]) {
      expect(getSectionForPath(route)?.id).toBe("goals")
    }
  })

  it("resolves a specific child title for Overview/Tasks/Calendar, and 'Goals' for the hub's own list route", () => {
    expect(getActiveNavItem("/goals")?.label).toBe("Goals")
    expect(getActiveNavItem("/goals/overview")?.label).toBe("Overview")
    expect(getActiveNavItem("/goals/tasks")?.label).toBe("Tasks")
    expect(getActiveNavItem("/goals/calendar")?.label).toBe("Calendar")
  })

  it("hides Overview, Tasks and Roadmap from the sidebar/rail while keeping them real, searchable routes", () => {
    const goals = navSections.find((s) => s.id === "goals")!
    const hidden = goals.items.filter((i) => i.showInSidebar === false)
    expect(hidden.map((i) => i.id).sort()).toEqual(["goals-overview", "goals-roadmap", "goals-tasks"])
    expect(hidden.every((i) => allNavItems.includes(i))).toBe(true)
  })

  it("no longer has a standalone Dashboard nav entry — its content moved into Overview", () => {
    expect(allNavItems.some((i) => i.id === "goals-dashboard")).toBe(false)
    expect(allNavItems.some((i) => i.label === "Dashboard")).toBe(false)
  })

  it("no longer owns Notes or Inbox — they moved to the Memory section", () => {
    const goals = navSections.find((s) => s.id === "goals")!
    expect(goals.items.some((i) => i.id === "goals-notes" || i.id === "goals-inbox")).toBe(false)
    expect(goals.items.some((i) => i.label === "Notes" || i.label === "Inbox")).toBe(false)
  })

  it("keeps the Goals bottom tab lit while browsing hidden hub children, not just /goals itself", () => {
    const goalsIndex = bottomTabs.findIndex((t) => t.id === "tab-goals")
    for (const route of ["/goals", "/goals/overview", "/goals/tasks"]) {
      expect(getActiveBottomTabIndex(route)).toBe(goalsIndex)
    }
    // Calendar keeps its own distinct sidebar/rail presence, so it still
    // falls through to More on the bottom bar — pre-existing behaviour,
    // unchanged by the hub consolidation.
    expect(getActiveBottomTabIndex("/goals/calendar")).toBe(bottomTabs.length)
  })
})

describe("Growth workspace consolidation (Habits folded into Recovery)", () => {
  it("hides Habits from the sidebar/rail while keeping it a real, searchable route", () => {
    const growth = navSections.find((s) => s.id === "growth")!
    const hidden = growth.items.filter((i) => i.showInSidebar === false && !i.soon)
    expect(hidden.map((i) => i.id)).toEqual(["growth-habits"])
    expect(allNavItems).toContain(navItem("growth-habits"))
  })

  it("makes Recovery the section's default href, not Habits", () => {
    const growth = navSections.find((s) => s.id === "growth")!
    expect(growth.href).toBe("/growth/recovery")
  })

  it("still resolves /growth/habits to the growth section and the Habits title", () => {
    expect(getSectionForPath("/growth/habits")?.id).toBe("growth")
    expect(getActiveNavItem("/growth/habits")?.label).toBe("Habits")
  })
})

describe("bottom tabs", () => {
  it("has exactly four routed tabs (plus the More trigger)", () => {
    expect(bottomTabs).toHaveLength(4)
    expect(bottomTabs.map((t) => t.label)).toEqual(["Today", "Goals", "Growth", "Memory"])
  })

  it("uses the recommended route mapping — Recovery anchors Growth now, not Habits", () => {
    expect(bottomTabs.map((t) => t.href)).toEqual(["/home", "/goals", "/growth/recovery", "/ask-hengo/memories"])
  })

  it("selects the right tab index per route", () => {
    expect(getActiveBottomTabIndex("/home")).toBe(0)
    expect(getActiveBottomTabIndex("/goals/abc")).toBe(1)
    expect(getActiveBottomTabIndex("/growth/recovery/pause")).toBe(2)
    expect(getActiveBottomTabIndex("/ask-hengo/memories")).toBe(3)
  })

  it("falls through to More for /growth/habits — it's reachable from inside Recovery's dashboard now, not its own tab", () => {
    expect(getActiveBottomTabIndex("/growth/habits")).toBe(bottomTabs.length)
    expect(getActiveBottomTabIndex("/growth/habits/h1")).toBe(bottomTabs.length)
  })

  it("keeps the Memory tab lit for the Ask Hengo action too — a hidden child activates its parent tab", () => {
    expect(getActiveBottomTabIndex("/chat", "mode=memory")).toBe(3)
  })

  it("falls back to the More slot for routes no tab owns", () => {
    expect(getActiveBottomTabIndex("/statistics")).toBe(bottomTabs.length)
    expect(getActiveBottomTabIndex("/settings")).toBe(bottomTabs.length)
    expect(getActiveBottomTabIndex("/learn")).toBe(bottomTabs.length)
    expect(getActiveBottomTabIndex("/chat")).toBe(bottomTabs.length)
  })
})

describe("More-route detection", () => {
  it("is false on the four direct tabs and any route inside a tab's section", () => {
    expect(isMoreRoute("/home")).toBe(false)
    expect(isMoreRoute("/goals")).toBe(false)
    expect(isMoreRoute("/growth/recovery")).toBe(false)
    expect(isMoreRoute("/ask-hengo/memories")).toBe(false)
    expect(isMoreRoute("/chat", "mode=memory")).toBe(false)
  })

  it("is true for routes reachable only through More — Learn and AI Coach included, now that they're not bottom tabs; Habits too, now that Recovery anchors Growth", () => {
    expect(isMoreRoute("/achievements")).toBe(true)
    expect(isMoreRoute("/goals/calendar")).toBe(true)
    expect(isMoreRoute("/settings")).toBe(true)
    expect(isMoreRoute("/chat")).toBe(true)
    expect(isMoreRoute("/learn")).toBe(true)
    expect(isMoreRoute("/practice")).toBe(true)
    expect(isMoreRoute("/growth/habits")).toBe(true)
    expect(isMoreRoute("/growth/journal")).toBe(true)
  })
})

describe("More sheet grouping", () => {
  it("collapses to one flat menu: Review, Learn, Settings — no separate Account row", () => {
    expect(moreGroups).toHaveLength(1)
    expect(moreGroups[0].items.map((i) => i.id)).toEqual(["review-hub", "learn-hub", "settings"])
  })

  it("omits destinations already reachable from a bottom tab, and Ask Hengo (it's the pinned card instead)", () => {
    const ids = moreGroups.flatMap((g) => g.items.map((i) => i.id))
    expect(ids).not.toContain("goals-goals")
    expect(ids).not.toContain("growth-habits")
    expect(ids).not.toContain("memory-hub")
    expect(ids).not.toContain("memory-ask-hengo")
    expect(ids).not.toContain("today")
  })

  it("does not duplicate Goals/Growth/Memory sub-pages or Review's Achievements/Statistics/History/Timeline", () => {
    const ids = moreGroups.flatMap((g) => g.items.map((i) => i.id))
    for (const id of [
      "goals-calendar",
      "memory-notes",
      "memory-inbox",
      "growth-recovery",
      "growth-journal",
      "review-achievements",
      "review-statistics",
      "review-history",
      "review-timeline",
    ]) {
      expect(ids).not.toContain(id)
    }
  })

  it("keeps those routes real and searchable even though the More sheet no longer lists them", () => {
    for (const route of ["/goals/calendar", "/notes", "/inbox", "/growth/recovery", "/growth/journal"]) {
      expect(getActiveNavItem(route)).toBeDefined()
    }
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
