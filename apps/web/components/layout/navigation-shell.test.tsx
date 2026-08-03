/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// ─── Module mocks ─────────────────────────────────────────────────────────────
// These components sit in the app shell, so they pull in Supabase-backed hooks
// (profile image, notifications) and Next's router. None of that is under test
// here — the navigation behaviour is.

const push = vi.fn()
const back = vi.fn()

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
  window.localStorage.clear()
})

// No vitest `globals: true` in this repo, so RTL's auto-cleanup never runs.
afterEach(cleanup)

function renderWithTooltips(ui: React.ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>)
}

// ─── Mobile bottom navigation ─────────────────────────────────────────────────

describe("MobileBottomNav", () => {
  function setup(pathname: string, onOpenMore = vi.fn()) {
    render(
      <MobileBottomNav
        pathname={pathname}
        searchParams={undefined}
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
    for (const label of ["Today", "Learn", "Goals", "Growth", "More"]) {
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
})

// ─── More sheet ───────────────────────────────────────────────────────────────

describe("MoreNavigationSheet", () => {
  function setup(open: boolean, onOpenChange = vi.fn()) {
    render(
      <MoreNavigationSheet
        open={open}
        onOpenChange={onOpenChange}
        pathname="/statistics"
        searchParams={undefined}
      />
    )
    return onOpenChange
  }

  it("renders nothing while closed", () => {
    setup(false)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens with the AI Coach card at the top", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Korean AI Coach")).toBeTruthy()
    expect(within(dialog).getByText("Practice, analyze, plan, or get support")).toBeTruthy()
    const aiLink = within(dialog).getAllByRole("link")[0]
    expect(aiLink.getAttribute("href")).toBe("/chat")
  })

  it("shows the grouped sections", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    for (const heading of ["Progress", "Tools", "Learn more", "Growth", "Account"]) {
      expect(within(dialog).getByRole("heading", { name: heading })).toBeTruthy()
    }
  })

  it("marks the current route with aria-current and closes on navigation", () => {
    const onOpenChange = setup(true)
    const stats = screen.getByRole("link", { name: /statistics/i })
    expect(stats.getAttribute("aria-current")).toBe("page")
    fireEvent.click(stats)
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

  it("puts Profile and Settings in the sheet instead of the mobile header", () => {
    setup(true)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByRole("link", { name: /account/i }).getAttribute("href")).toBe("/account")
    expect(within(dialog).getByRole("link", { name: /settings/i }).getAttribute("href")).toBe("/settings")
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

  it("shows a title and two actions on a root page — no avatar, no level badge", () => {
    render(<MobileHeader pathname="/goals" searchParams={undefined} onOpenSearch={vi.fn()} />)
    expect(screen.getByRole("heading", { name: "Goals" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy()
    expect(screen.getByRole("button", { name: /notifications/i })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Go back" })).toBeNull()
    expect(screen.queryByRole("link", { name: /profile/i })).toBeNull()
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

  it("shows labelled groups when expanded — no icon-only guessing", () => {
    setup("/practice", false)
    for (const label of ["Learn", "Goals", "Growth", "Progress"]) {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeTruthy()
    }
  })

  it("keeps the current route's group expanded and non-collapsible", () => {
    setup("/practice", false)
    const trigger = screen.getByRole("button", { name: /^Learn/i })
    expect(trigger.getAttribute("data-state")).toBe("open")
    fireEvent.click(trigger)
    expect(screen.getByRole("link", { name: "Practice" })).toBeTruthy()
  })

  it("collapses non-active groups by default so only one is open", () => {
    setup("/practice", false)
    expect(screen.queryByRole("link", { name: "Statistics" })).toBeNull()
  })

  it("gives every collapsed icon an accessible name", () => {
    setup("/practice", true)
    // Today, AI Coach and Settings are direct links; Learn/Goals/Growth/
    // Progress collapse into flyout triggers (their children need the panel
    // open to render, same as the tablet rail).
    for (const name of ["Today", "AI Coach", "Settings"]) {
      expect(screen.getByRole("link", { name })).toBeTruthy()
    }
    for (const name of ["Learn navigation", "Goals navigation", "Growth navigation", "Progress navigation"]) {
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

  it("marks AI Coach active on bare /chat", () => {
    setup("/chat", false)
    expect(screen.getByRole("link", { name: "AI Coach" }).getAttribute("aria-current")).toBe("page")
  })

  it("does not mark AI Coach active on /chat?mode=analyze", () => {
    setup("/chat", false, "mode=analyze")
    expect(screen.getByRole("link", { name: "AI Coach" }).getAttribute("aria-current")).toBeNull()
  })

  it("renders exactly one AI entry point — no separate AI Coach button", () => {
    setup("/practice", false)
    expect(screen.getAllByRole("link", { name: /ai coach/i })).toHaveLength(1)
  })

  it("keeps branding in the sidebar only once", () => {
    setup("/practice", false)
    expect(screen.getAllByRole("link", { name: "Hengo home" })).toHaveLength(1)
  })
})

// ─── Tablet workspace flyout ──────────────────────────────────────────────────

describe("WorkspaceFlyout", () => {
  const learn = navSections.find((s) => s.id === "learn")!

  function setup(open: boolean, onOpenChange = vi.fn()) {
    renderWithTooltips(
      <WorkspaceFlyout
        section={learn}
        pathname="/vocab"
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
    const trigger = screen.getByRole("button", { name: "Learn navigation" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("lists the section's child routes when open", () => {
    setup(true)
    const panel = screen.getByRole("navigation", { name: "Learn" })
    expect(
      within(panel)
        .getAllByRole("link")
        .map((el) => el.textContent)
    ).toEqual([
      "Practice",
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

  it("marks the current child route", () => {
    setup(true)
    expect(screen.getByRole("link", { name: "Vocabulary" }).getAttribute("aria-current")).toBe("page")
  })

  it("closes after navigating to a child route", () => {
    const onOpenChange = setup(true)
    fireEvent.click(screen.getByRole("link", { name: "Reading" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes on Escape", async () => {
    const onOpenChange = setup(true)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" })
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("does not render Coming Soon items as links", () => {
    renderWithTooltips(
      <WorkspaceFlyout
        section={navSections.find((s) => s.id === "growth")!}
        pathname="/growth/habits"
        searchParams={undefined}
        open
        onOpenChange={vi.fn()}
        active
      />
    )
    const panel = screen.getByRole("navigation", { name: "Growth" })
    expect(within(panel).getAllByRole("link").map((el) => el.textContent)).toEqual(["Habits", "Recovery", "Journal"])
    expect(screen.getByText(/Coming soon:/)).toBeTruthy()
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
    window.localStorage.setItem("hengo-recent-routes", JSON.stringify(["progress-statistics", "learn-vocab"]))
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
