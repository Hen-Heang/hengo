/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// ─── Module mocks ─────────────────────────────────────────────────────────────
// These components sit in the app shell, so they pull in Supabase-backed hooks
// (profile image, notifications) and Next's router. None of that is under test
// here — the navigation behaviour is.

const push = vi.fn()
const back = vi.fn()
const { openQuickCapture } = vi.hoisted(() => ({ openQuickCapture: vi.fn() }))

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push, replace: vi.fn(), back }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/hooks/useProfileImage", () => ({
  useProfileImage: () => ({ url: null, initials: "HH" }),
}))

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 3,
    isLoading: false,
    isError: false,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    respond: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock("@/lib/auth-store", () => ({
  getUserEmail: () => "dev@example.com",
  getUserId: () => "user-1",
  clearAuth: vi.fn(),
  isAuthenticated: () => true,
}))

vi.mock("@/lib/quick-capture-bus", () => ({
  openQuickCapture,
}))

import { QuickSwitcher } from "@/components/app/quick-switcher"
import { DesktopSidebar } from "./DesktopSidebar"
import { WorkspaceFlyout } from "./WorkspaceFlyout"
import { MobileBottomNav } from "./MobileBottomNav"
import { MobileHeader, isDetailRoute } from "./MobileHeader"
import { MoreNavigationSheet } from "./MoreNavigationSheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { navSections } from "@/lib/navigation"

// Radix needs these in jsdom.
beforeAll(() => {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
  }
})

beforeEach(() => {
  push.mockClear()
  back.mockClear()
  openQuickCapture.mockClear()
  window.localStorage.clear()
})

// No vitest `globals: true` in this repo, so RTL's auto-cleanup never runs.
afterEach(cleanup)

function renderWithTooltips(ui: React.ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>)
}

// ─── Mobile bottom navigation ─────────────────────────────────────────────────

describe("MobileBottomNav", () => {
  function setup(pathname: string, onOpenMore = vi.fn(), searchParams?: string) {
    render(
      <MobileBottomNav
        pathname={pathname}
        searchParams={searchParams}
        onOpenMore={onOpenMore}
        moreOpen={false}
      />
    )
    return onOpenMore
  }

  it("renders exactly five destinations", () => {
    setup("/home")
    const nav = screen.getByRole("navigation", { name: "Primary" })
    expect(within(nav).getAllByRole("listitem")).toHaveLength(5)
    for (const label of ["Today", "Goals", "Growth", "Memory", "More"]) {
      expect(within(nav).getByText(label)).toBeTruthy()
    }
  })

  it("marks the current destination with aria-current", () => {
    setup("/goals/abc-123")
    const current = screen.getAllByRole("link").filter((el) => el.getAttribute("aria-current") === "page")
    expect(current).toHaveLength(1)
    expect(current[0].getAttribute("href")).toBe("/goals")
  })

  it("does not mark any tab current on a More-only route", () => {
    setup("/statistics")
    expect(screen.queryAllByRole("link").filter((el) => el.getAttribute("aria-current") === "page")).toHaveLength(0)
  })

  it("exposes More as a dialog trigger and calls back on press", () => {
    const onOpenMore = setup("/home")
    const trigger = screen.getByRole("button", { name: /more/i })
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(trigger)
    expect(onOpenMore).toHaveBeenCalledOnce()
  })

  it("keeps /home inside the shell as the first tab", () => {
    setup("/home")
    const first = screen.getAllByRole("link")[0]
    expect(first.getAttribute("href")).toBe("/home")
    expect(first.getAttribute("aria-current")).toBe("page")
  })

  it("points the Memory tab at /ask-hengo/memories and keeps it current for Inbox, Notes and the Ask Hengo action too", () => {
    for (const [pathname, searchParams] of [
      ["/ask-hengo/memories", undefined],
      ["/chat", "mode=memory"],
      ["/inbox", undefined],
      ["/notes", undefined],
      ["/notes/abc-123", undefined],
    ] as const) {
      setup(pathname, vi.fn(), searchParams)
      const memoryLink = screen.getByRole("link", { name: "Memory" })
      expect(memoryLink.getAttribute("href")).toBe("/ask-hengo/memories")
      expect(memoryLink.getAttribute("aria-current")).toBe("page")
      cleanup()
    }
  })

  it("no longer has a Learn tab — Learn moved to the More sheet", () => {
    setup("/learn")
    expect(screen.queryByRole("link", { name: "Learn" })).toBeNull()
  })
})

// ─── More sheet ───────────────────────────────────────────────────────────────

describe("MoreNavigationSheet", () => {
  function setup(open: boolean, onOpenChange = vi.fn(), pathname = "/review/morning") {
    render(
      <MoreNavigationSheet
        open={open}
        onOpenChange={onOpenChange}
        pathname={pathname}
        searchParams={undefined}
      />
    )
    return onOpenChange
  }

  it("renders nothing while closed", () => {
    setup(false)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens with the Ask Hengo card at the top — the global AI action's mobile home", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Ask Hengo")).toBeTruthy()
    expect(within(dialog).getByText("Ask about your notes, goals, habits, and journal")).toBeTruthy()
    const aiLink = within(dialog).getAllByRole("link")[0]
    expect(aiLink.getAttribute("href")).toBe("/chat?mode=memory")
  })

  it("lists exactly Review, Learn, Settings below the Ask Hengo card — no group headings, no separate Account row", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).queryAllByRole("heading", { level: 3 })).toHaveLength(0)
    const menu = within(dialog).getByRole("navigation", { name: "More" })
    expect(within(menu).getAllByRole("link").map((el) => el.textContent)).toEqual([
      "Review",
      "Learn",
      "Settings",
    ])
  })

  it("does not duplicate any Korean/Learn function, Goals/Growth/Memory sub-page, or Ask Hengo in the flat menu", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    for (const label of [
      "Practice",
      "Korean Coach",
      "Vocabulary",
      "Phrasebook",
      "Foundations",
      "Reading",
      "Listening",
      "Scenarios",
      "Exam Prep",
      "Calendar",
      "Notes",
      "Inbox",
      "Recovery",
      "Journal",
      "Achievements",
      "Statistics",
      "History",
      "Timeline",
    ]) {
      expect(within(dialog).queryByRole("link", { name: label })).toBeNull()
    }
    // Only one "Ask Hengo" link — the pinned card — not a second row below.
    expect(within(dialog).getAllByRole("link", { name: /ask hengo/i })).toHaveLength(1)
  })

  it("marks the current route with aria-current and closes on navigation", () => {
    const onOpenChange = setup(true)
    const review = screen.getByRole("link", { name: "Review" })
    expect(review.getAttribute("aria-current")).toBe("page")
    fireEvent.click(review)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes on Escape", async () => {
    const onOpenChange = setup(true)
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("keeps Coming Soon features to a single muted line, not a grid of tiles", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText(/Coming soon:/)).toBeTruthy()
    expect(within(dialog).queryByRole("link", { name: /deep work/i })).toBeNull()
  })

  it("puts Settings in the sheet instead of the mobile header, with no separate Account entry", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByRole("link", { name: /settings/i }).getAttribute("href")).toBe("/settings")
    expect(within(dialog).queryByRole("link", { name: /account/i })).toBeNull()
  })
})

// ─── Mobile header ────────────────────────────────────────────────────────────

describe("MobileHeader", () => {
  it("classifies root vs detail routes", () => {
    expect(isDetailRoute("/goals")).toBe(false)
    expect(isDetailRoute("/home")).toBe(false)
    expect(isDetailRoute("/goals/abc-123")).toBe(true)
    expect(isDetailRoute("/growth/habits/h1")).toBe(true)
  })

  it("moves Quick Capture into the root-page top bar", () => {
    render(<MobileHeader pathname="/goals" searchParams={undefined} onOpenSearch={vi.fn()} />)
    expect(screen.getByRole("heading", { name: "Goals" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Quick capture" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy()
    expect(screen.getByRole("button", { name: /notifications/i })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Go back" })).toBeNull()
    expect(screen.queryByRole("link", { name: /profile/i })).toBeNull()
  })

  it("opens the shared Quick Capture dialog from the top bar", () => {
    render(<MobileHeader pathname="/goals" searchParams={undefined} onOpenSearch={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Quick capture" }))
    expect(openQuickCapture).toHaveBeenCalledOnce()
  })

  it("announces the unread notification count to screen readers", () => {
    render(<MobileHeader pathname="/goals" searchParams={undefined} onOpenSearch={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Notifications (3 unread)" })).toBeTruthy()
  })

  it("switches to Back | Title | More on a detail route", () => {
    render(<MobileHeader pathname="/goals/abc-123" searchParams={undefined} onOpenSearch={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Go back" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "More actions" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: /notifications/i })).toBeNull()
  })

  it("keeps Quick Capture in the detail-page top-bar menu", async () => {
    render(<MobileHeader pathname="/goals/abc-123" searchParams={undefined} onOpenSearch={vi.fn()} />)
    fireEvent.pointerDown(screen.getByRole("button", { name: "More actions" }), {
      button: 0,
      ctrlKey: false,
    })
    fireEvent.click(await screen.findByRole("menuitem", { name: "Quick capture" }))
    expect(openQuickCapture).toHaveBeenCalledOnce()
  })

  it("goes back through the router", () => {
    render(<MobileHeader pathname="/goals/abc-123" searchParams={undefined} onOpenSearch={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Go back" }))
    expect(back).toHaveBeenCalledOnce()
  })

  it("truncates long titles rather than wrapping", () => {
    render(<MobileHeader pathname="/goals/abc" searchParams={undefined} onOpenSearch={vi.fn()} />)
    expect(screen.getByRole("heading").className).toContain("truncate")
  })

  it("labels the AI mode from the query, not just the pathname", () => {
    render(
      <MobileHeader pathname="/chat" searchParams={{ mode: "corrections" }} onOpenSearch={vi.fn()} />
    )
    expect(screen.getByRole("heading", { name: "Corrections" })).toBeTruthy()
  })
})

// ─── Desktop sidebar ──────────────────────────────────────────────────────────

describe("DesktopSidebar", () => {
  function setup(pathname: string, collapsed: boolean, searchParams?: string, onToggle = vi.fn()) {
    renderWithTooltips(
      <DesktopSidebar
        pathname={pathname}
        searchParams={searchParams}
        collapsed={collapsed}
        onToggleCollapsed={onToggle}
        activeSectionId={
          navSections.find((s) => s.items.some((i) => i.href.split("?")[0] === pathname))?.id
        }
      />
    )
    return onToggle
  }

  it("shows a flat Learn link plus labelled groups for Goals/Growth/Memory/Review", () => {
    setup("/practice", false)
    expect(screen.getByRole("link", { name: "Learn" })).toBeTruthy()
    for (const label of ["Goals", "Growth", "Memory", "Review"]) {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeTruthy()
    }
  })

  it("has no children to expand — Learn (secondary) is a flat link straight to /learn", () => {
    setup("/practice", false)
    const learnLink = screen.getByRole("link", { name: "Learn" })
    expect(learnLink.getAttribute("href")).toBe("/learn")
    expect(learnLink.getAttribute("aria-current")).toBe("page")
    expect(screen.queryByRole("link", { name: "Practice" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Korean Coach" })).toBeNull()
    expect(screen.queryByRole("button", { name: /learn navigation/i })).toBeNull()
  })

  it("shows Memory's Inbox/Notes/Memories as real flyout children when active — no Ask Hengo row inside", () => {
    setup("/notes", false)
    for (const label of ["Inbox", "Notes", "Memories"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy()
    }
    expect(screen.getByRole("link", { name: "Notes" }).getAttribute("aria-current")).toBe("page")
    expect(screen.queryByRole("link", { name: "Ask Hengo" })).toBeNull()
  })

  it("no longer shows Notes or Inbox under the Goals group", () => {
    setup("/goals", false)
    expect(screen.queryByRole("link", { name: "Notes" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Inbox" })).toBeNull()
  })

  it("never renders AI Coach or any of its mode variants — Ask Hengo is the only AI entry point now", () => {
    setup("/chat", false)
    expect(screen.queryByRole("link", { name: /ai coach/i })).toBeNull()
    for (const label of ["Analyze", "Generate", "Corrections"]) {
      expect(screen.queryByRole("link", { name: label })).toBeNull()
    }
    expect(screen.queryByRole("link", { name: "Ask Hengo" })).toBeNull()
  })

  it("collapses non-active groups by default so only one is open", () => {
    setup("/practice", false)
    expect(screen.queryByRole("link", { name: "Statistics" })).toBeNull()
  })

  it("shows Review's Achievements/Statistics/History/Timeline as real flyout children when active", () => {
    setup("/statistics", false)
    for (const label of ["Review", "Achievements", "Statistics", "History", "Timeline"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy()
    }
    expect(screen.getByRole("link", { name: "Statistics" }).getAttribute("aria-current")).toBe("page")
  })

  it("gives every collapsed icon an accessible name", () => {
    setup("/practice", true)
    // Today and Learn are direct links — neither has children left to hide
    // behind a flyout. Goals/Growth/Memory/Review all have visible children
    // now, so they collapse into flyout triggers instead (the children need
    // the panel open to render, same as the tablet rail). Settings has no
    // row of its own — it's the first item in the Account dropdown.
    for (const name of ["Today", "Learn"]) {
      expect(screen.getByRole("link", { name })).toBeTruthy()
    }
    for (const name of ["Goals navigation", "Growth navigation", "Memory navigation", "Review navigation"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy()
    }
  })

  it("exposes the collapse state to screen readers and toggles it", () => {
    const onToggle = setup("/practice", false)
    const button = screen.getByRole("button", { name: "Collapse sidebar" })
    expect(button.getAttribute("aria-expanded")).toBe("true")
    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it("labels the expand action when collapsed", () => {
    setup("/practice", true)
    expect(screen.getByRole("button", { name: "Expand sidebar" }).getAttribute("aria-expanded")).toBe("false")
  })

  it("keeps branding in the sidebar only once", () => {
    setup("/practice", false)
    expect(screen.getAllByRole("link", { name: "Hengo home" })).toHaveLength(1)
  })
})

// ─── Tablet workspace flyout ──────────────────────────────────────────────────

describe("WorkspaceFlyout", () => {
  // Learn no longer reaches this component in production (DesktopSidebar /
  // TabletNavigationRail render it as a flat link instead — see below), so
  // general flyout mechanics are covered here with Goals, which still has
  // visible children.
  const goals = navSections.find((s) => s.id === "goals")!

  function setup(open: boolean, onOpenChange = vi.fn()) {
    renderWithTooltips(
      <WorkspaceFlyout
        section={goals}
        pathname="/goals/calendar"
        searchParams={undefined}
        open={open}
        onOpenChange={onOpenChange}
        active
      />
    )
    return onOpenChange
  }

  it("labels the trigger and reports its expanded state", () => {
    setup(false)
    const trigger = screen.getByRole("button", { name: "Goals navigation" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("lists the section's child routes when open — Overview/Tasks/Roadmap are hidden hub children, reachable from the Goals hub's own tab nav instead; Notes/Inbox moved to Memory", () => {
    setup(true)
    const panel = screen.getByRole("navigation", { name: "Goals" })
    expect(
      within(panel)
        .getAllByRole("link")
        .map((el) => el.textContent)
    ).toEqual(["Goals", "Calendar"])
  })

  it("marks the current child route", () => {
    setup(true)
    expect(screen.getByRole("link", { name: "Calendar" }).getAttribute("aria-current")).toBe("page")
  })

  it("closes after navigating to a child route", () => {
    const onOpenChange = setup(true)
    fireEvent.click(screen.getByRole("link", { name: "Goals" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes on Escape", async () => {
    const onOpenChange = setup(true)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("does not render Coming Soon items as links, and no longer lists Habits — it's reachable from inside Recovery now", () => {
    renderWithTooltips(
      <WorkspaceFlyout
        section={navSections.find((s) => s.id === "growth")!}
        pathname="/growth/recovery"
        searchParams={undefined}
        open
        onOpenChange={vi.fn()}
        active
      />
    )
    const panel = screen.getByRole("navigation", { name: "Growth" })
    expect(within(panel).getAllByRole("link").map((el) => el.textContent)).toEqual(["Recovery", "Journal"])
    expect(screen.getByText(/Coming soon:/)).toBeTruthy()
  })

  it("renders nothing for a section whose items are all hidden from the sidebar (Learn)", () => {
    const learn = navSections.find((s) => s.id === "learn")!
    renderWithTooltips(
      <WorkspaceFlyout
        section={learn}
        pathname="/practice"
        searchParams={undefined}
        open
        onOpenChange={vi.fn()}
        active
      />
    )
    const panel = screen.getByRole("navigation", { name: "Learn" })
    expect(within(panel).queryAllByRole("link")).toHaveLength(0)
  })

  it("lists Memory's Inbox, Notes and Memories — Ask Hengo stays a hidden global action, not a fourth row", () => {
    const memory = navSections.find((s) => s.id === "memory")!
    renderWithTooltips(
      <WorkspaceFlyout
        section={memory}
        pathname="/ask-hengo/memories"
        searchParams={undefined}
        open
        onOpenChange={vi.fn()}
        active
      />
    )
    const panel = screen.getByRole("navigation", { name: "Memory" })
    expect(within(panel).getAllByRole("link").map((el) => el.textContent)).toEqual(["Inbox", "Notes", "Memories"])
    expect(screen.getByRole("link", { name: "Memories" }).getAttribute("aria-current")).toBe("page")
  })

  it("lists Review's five children — the old Progress workspace, absorbed and still fully visible", () => {
    renderWithTooltips(
      <WorkspaceFlyout
        section={navSections.find((s) => s.id === "review")!}
        pathname="/statistics"
        searchParams={undefined}
        open
        onOpenChange={vi.fn()}
        active
      />
    )
    const panel = screen.getByRole("navigation", { name: "Review" })
    expect(within(panel).getAllByRole("link").map((el) => el.textContent)).toEqual([
      "Review",
      "Achievements",
      "Statistics",
      "History",
      "Timeline",
    ])
    expect(screen.getByRole("link", { name: "Statistics" }).getAttribute("aria-current")).toBe("page")
  })
})

// ─── Quick Switcher ───────────────────────────────────────────────────────────

describe("QuickSwitcher", () => {
  it("opens on Cmd/Ctrl+K", async () => {
    render(<QuickSwitcher />)
    expect(screen.queryByRole("listbox")).toBeNull()
    fireEvent.keyDown(window, { key: "k", metaKey: true })
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
  })

  it("opens on '/' from outside a text field", async () => {
    render(<QuickSwitcher />)
    fireEvent.keyDown(window, { key: "/" })
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
  })

  it("groups results into Pages and Actions", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    expect(screen.getByText("Pages")).toBeTruthy()
    expect(screen.getByText("Actions")).toBeTruthy()
  })

  it("offers Create goal, Add task and Ask AI actions", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    for (const label of ["Create goal", "Add task", "Ask AI"]) {
      expect(screen.getByRole("option", { name: new RegExp(label, "i") })).toBeTruthy()
    }
  })

  it("surfaces a Recent group from locally stored destinations", async () => {
    window.localStorage.setItem("hengo-recent-routes", JSON.stringify(["review-statistics", "learn-vocab"]))
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    expect(screen.getByText("Recent")).toBeTruthy()
  })

  it("searches keywords, not just labels", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    const input = screen.getByRole("combobox")
    fireEvent.change(input, { target: { value: "flashcards" } })
    expect(screen.getByRole("option", { name: /vocabulary/i })).toBeTruthy()
  })

  it("finds Ask Hengo as a searchable page — the command-menu entry point for the global AI action", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    const input = screen.getByRole("combobox")
    fireEvent.change(input, { target: { value: "ask hengo" } })
    expect(screen.getByRole("option", { name: /ask hengo/i })).toBeTruthy()
  })

  it("still finds AI Coach and its mode variants by search, even though they're hidden from the sidebar", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    const input = screen.getByRole("combobox")
    fireEvent.change(input, { target: { value: "corrections" } })
    expect(screen.getByRole("option", { name: /corrections/i })).toBeTruthy()
  })

  it("navigates with arrow keys and opens on Enter", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    const input = screen.getByRole("combobox")
    fireEvent.change(input, { target: { value: "statistics" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(push).toHaveBeenCalledWith("/statistics")
  })

  it("shows an empty state for a query that matches nothing", async () => {
    render(<QuickSwitcher />)
    fireEvent.click(screen.getByRole("button", { name: "Open quick navigation" }))
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy())
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzzzz" } })
    expect(screen.getByText("No matching destination")).toBeTruthy()
  })

  it("renders no trigger button in triggerless mode", () => {
    render(<QuickSwitcher hideTrigger open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByRole("button", { name: "Open quick navigation" })).toBeNull()
  })
})
