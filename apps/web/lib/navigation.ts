import {
  BarChart3,
  BookOpen,
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Compass,
  Drama,
  Gauge,
  GraduationCap,
  Headphones,
  History,
  Home,
  Inbox,
  Languages,
  ListChecks,
  Map,
  MessageCircle,
  MessagesSquare,
  Mic,
  NotebookPen,
  RotateCcw,
  ScanText,
  Settings,
  Smile,
  Sparkles,
  Sunrise,
  Target,
  TreeDeciduous,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react"

// Single source of truth for the whole nav surface — desktop sidebar, tablet
// rail, mobile bottom bar, the "More" sheet, and the Quick Switcher all render
// from this file. Adding a new module later (Career, Fitness, …) means adding
// one section entry here, not touching the shell components.

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * How a route is matched to a nav item. Split out from `href` so query-string
 * destinations (`/chat?mode=analyze`) can be told apart from their bare
 * pathname sibling (`/chat`) — pathname-only matching cannot do that.
 */
export type NavMatch = {
  pathname: string
  /** Every entry must be present in the URL with exactly this value. */
  query?: Record<string, string>
  /**
   * Query keys that must be ABSENT for the item to be active. Lets `/chat`
   * stay inactive while `/chat?mode=analyze` is the current route, so only one
   * AI mode is ever highlighted.
   */
  absentQuery?: string[]
  /** Whether nested routes (`/goals/create`) activate this item. Default true. */
  includeChildren?: boolean
  /**
   * Active whenever the current route belongs to this section, regardless of
   * URL prefix. For hub items that represent a whole section (e.g. mobile's
   * Learn tab) whose child routes (`/practice`, `/korean-coach`, …) don't
   * share a common path with the hub itself.
   */
  sectionId?: NavSectionId
}

export type NavItem = {
  /** Stable identity — never derive identity from `href`. */
  id: string
  href: string
  label: string
  /** Tighter label for the mobile bottom bar / tablet rail. */
  shortLabel?: string
  icon: React.ElementType
  description?: string
  /** Extra search terms for the Quick Switcher. */
  keywords?: string[]
  soon?: boolean
  match?: NavMatch
  /**
   * Whether this item gets its own row in the sidebar / rail / bottom nav.
   * Defaults to visible. Set `false` for routes that are still first-class,
   * reachable, searchable destinations (Quick Switcher, breadcrumbs, page
   * titles) but shouldn't clutter the nav chrome individually — e.g. the
   * Learn section's children, which are all reachable from the `/learn` hub
   * instead. Never remove an item from `navSections` just to hide it; that
   * would also break route matching, page titles, and the Quick Switcher.
   */
  showInSidebar?: boolean
}

export type NavSectionId = "today" | "learn" | "goals" | "growth" | "review" | "memory" | "ai"

export type NavSection = {
  id: NavSectionId
  label: string
  icon: React.ElementType
  /** Where the rail / switcher lands when the section itself is clicked. */
  href: string
  items: NavItem[]
}

// ─── Standalone destinations ──────────────────────────────────────────────────

export const todayItem: NavItem = {
  id: "today",
  href: "/home",
  label: "Today",
  icon: Home,
  description: "Your daily overview",
  keywords: ["home", "dashboard", "start", "overview"],
  // /home has no children; keep the match tight so nothing else lights it up.
  match: { pathname: "/home", includeChildren: false },
}

export const settingsItem: NavItem = {
  id: "settings",
  href: "/settings",
  label: "Settings",
  icon: Settings,
  keywords: ["preferences", "account", "profile", "theme"],
}

export const accountItem: NavItem = {
  id: "account",
  href: "/account",
  label: "Account",
  icon: Settings,
  keywords: ["profile", "sign out", "subscription"],
}

// AI Coach and its mode variants are preserved routes (Chat, Analyze,
// Generate, Corrections all still work), but no longer get their own primary
// sidebar/rail presence — `showInSidebar: false` keeps them real, searchable,
// breadcrumb-able destinations without cluttering the simplified nav chrome.
// The single global AI entry point users see is "Ask Hengo" (see below).
export const aiCoachItem: NavItem = {
  id: "ai-chat",
  href: "/chat",
  label: "AI Coach",
  shortLabel: "AI",
  icon: MessageCircle,
  description: "Practice, analyze, plan, or get support",
  keywords: ["ai", "coach", "chat", "ask", "assistant", "korean", "speaking"],
  // Bare /chat only — the mode variants below own their own active state.
  match: { pathname: "/chat", absentQuery: ["mode"] },
  showInSidebar: false,
}

// The one global AI action: "Ask Hengo" answers from the user's own notes,
// goals, habits, and journal (see components/memory/AskHengoChat). It lives
// as the "My Data" mode on the merged /chat surface, alongside Coach/
// Analyze/Generate/Corrections (see the "ai" section below) — /ask-hengo
// itself is now a legacy redirect stub, same pattern as /mistakes. It's a
// hidden child of the "memory" section below — reachable from the header
// button, the Quick Switcher, and the mobile More sheet's pinned card, not
// from a dedicated sidebar row, per the "doesn't need a large navigation
// section" requirement. Do not build a second chat surface for this — reuse
// this route everywhere a global Ask Hengo entry point is needed.
export const askHengoItem: NavItem = {
  id: "memory-ask-hengo",
  href: "/chat?mode=memory",
  label: "Ask Hengo",
  shortLabel: "Ask Hengo",
  icon: BrainCircuit,
  description: "Ask about your notes, goals, habits, and journal",
  keywords: ["memory", "ask", "second brain", "recall", "remember", "search"],
  match: { pathname: "/chat", query: { mode: "memory" } },
  showInSidebar: false,
}

/**
 * The "Memory" workspace: what Hengo remembers about you, browsable on its
 * own (distinct from the *action* of asking — see `askHengoItem` above).
 * Hidden like `learn-hub` — the "memory" section has no other visible
 * children, so it renders as one flat sidebar/rail/bottom-tab link straight
 * to this route instead of an expandable group.
 */
export const memoryHubItem: NavItem = {
  id: "memory-hub",
  href: "/ask-hengo/memories",
  label: "Memory",
  icon: BrainCircuit,
  description: "Facts Hengo remembers from your notes, goals, habits, and journal",
  keywords: ["memory", "memories", "second brain", "notes", "recall", "context"],
  showInSidebar: false,
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export const navSections: NavSection[] = [
  {
    id: "today",
    label: "Today",
    icon: Home,
    href: todayItem.href,
    items: [todayItem],
  },
  {
    id: "learn",
    label: "Learn",
    icon: Sparkles,
    href: "/learn",
    // Every child below is a real, reachable, searchable route — just hidden
    // from the sidebar/rail/bottom-nav (`showInSidebar: false`) in favor of a
    // single "Learn" entry that lands on `/learn`, the Learning Hub. Keeping
    // them here (rather than deleting them) is what keeps route matching,
    // page titles, breadcrumbs, and the Quick Switcher all working unchanged.
    items: [
      {
        id: "learn-practice",
        href: "/practice",
        label: "Practice",
        icon: Sparkles,
        description: "Today's Korean practice session",
        keywords: ["learn", "korean", "daily", "drill", "speaking"],
        showInSidebar: false,
      },
      {
        id: "learn-korean-coach",
        href: "/korean-coach",
        label: "Korean Coach",
        shortLabel: "Coach",
        icon: Mic,
        description: "Listening and speaking practice with AI feedback",
        keywords: ["voice", "speaking", "listening", "workplace", "korean", "coach"],
        showInSidebar: false,
      },
      {
        id: "learn-vocab",
        href: "/vocab",
        label: "Vocabulary",
        icon: BookOpen,
        keywords: ["words", "srs", "review", "flashcards", "korean"],
        showInSidebar: false,
      },
      {
        id: "learn-phrasebook",
        href: "/phrasebook",
        label: "Phrasebook",
        icon: MessagesSquare,
        description: "Workplace and daily-life Q&A practice",
        keywords: ["phrasebook", "questions", "answers", "workplace", "qa", "speaking", "listening", "korean"],
        showInSidebar: false,
      },
      {
        id: "learn-foundations",
        href: "/learn/foundations",
        label: "Foundations",
        icon: Languages,
        keywords: ["grammar", "hangul", "basics", "korean"],
        showInSidebar: false,
      },
      {
        id: "learn-reading",
        href: "/reading",
        label: "Reading",
        icon: BookOpenText,
        keywords: ["articles", "comprehension", "korean"],
        showInSidebar: false,
      },
      {
        id: "learn-listening",
        href: "/listening",
        label: "Listening",
        icon: Headphones,
        keywords: ["audio", "dictation", "korean"],
        showInSidebar: false,
      },
      {
        id: "learn-scenarios",
        href: "/scenarios",
        label: "Scenarios",
        icon: Drama,
        keywords: ["roleplay", "workplace", "situations", "korean"],
        showInSidebar: false,
      },
      {
        id: "learn-interview",
        href: "/interview",
        label: "Exam Prep",
        icon: GraduationCap,
        keywords: ["topik", "interview", "test", "exam"],
        showInSidebar: false,
      },
      {
        id: "learn-hub",
        href: "/learn",
        label: "Learn",
        icon: Sparkles,
        description: "Practice, study, and exam prep — all Korean learning in one hub",
        keywords: ["learn", "hub", "korean", "overview", "foundations", "practice"],
        showInSidebar: false,
      },
    ],
  },
  {
    id: "goals",
    label: "Goals",
    icon: Target,
    href: "/goals",
    // Goals answers "what do I want to achieve, and what tasks will get me
    // there?" — Overview/Tasks are real routes (hidden from the sidebar/rail
    // like Learn's children above) reached via the Goals hub's own local tab
    // nav (see components/goals/hub/GoalsHubNav) rather than separate nav
    // rows. Overview and Tasks are listed before Goals so getActiveNavItem
    // (first match wins) resolves their more specific title instead of the
    // parent's — see the navPathnames note below for why they can share the
    // /goals prefix with the parent without losing bottom-tab/sidebar
    // highlighting. The old standalone Dashboard route is gone entirely
    // (folded into Overview) — see app/(main)/dashboard/page.tsx, now a
    // redirect stub with no nav presence, same pattern as /mistakes etc.
    items: [
      {
        id: "goals-overview",
        href: "/goals/overview",
        label: "Overview",
        icon: Gauge,
        description: "Snapshot of your active goals, deadlines, and progress",
        keywords: ["overview", "summary", "snapshot", "dashboard", "progress"],
        showInSidebar: false,
      },
      {
        id: "goals-tasks",
        href: "/goals/tasks",
        label: "Tasks",
        icon: ClipboardList,
        description: "Today's tasks across every goal",
        keywords: ["tasks", "today", "todo", "checklist"],
        showInSidebar: false,
      },
      {
        id: "goals-goals",
        href: "/goals",
        label: "Goals",
        icon: Target,
        keywords: ["goal", "objective", "outcome", "plan"],
        // /goals/calendar is its own visible item; keep it from also lighting
        // up Goals. Overview/Tasks are hidden items, so they no longer shadow
        // this prefix match — see the navPathnames fix below.
        match: { pathname: "/goals", includeChildren: true },
      },
      {
        id: "goals-calendar",
        href: "/goals/calendar",
        label: "Calendar",
        icon: CalendarDays,
        keywords: ["schedule", "week", "month", "task", "deadline"],
      },
      {
        id: "goals-roadmap",
        href: "/roadmap",
        label: "Roadmap",
        icon: Map,
        description: "Your long-term, phase-by-phase learning/career plan",
        keywords: ["milestones", "phases", "timeline", "long-term", "planning"],
        // No longer a primary nav destination — it's a long-term planning
        // tool reachable from the Goals Overview tab (RoadmapTeaser) and
        // search/More sheet. Route and localStorage data are untouched.
        showInSidebar: false,
      },
      {
        id: "goals-notes",
        href: "/notes",
        label: "Notes",
        icon: NotebookPen,
        keywords: ["note", "scratchpad", "ideas"],
      },
      {
        id: "goals-inbox",
        href: "/inbox",
        label: "Inbox",
        icon: Inbox,
        description: "Quick capture for ideas, tasks, and phrases",
        keywords: ["capture", "quick capture", "idea", "second brain", "triage"],
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    icon: TreeDeciduous,
    href: "/growth/habits",
    items: [
      {
        id: "growth-habits",
        href: "/growth/habits",
        label: "Habits",
        icon: ListChecks,
        keywords: ["habit", "streak", "routine", "check-in"],
      },
      {
        id: "growth-recovery",
        href: "/growth/recovery",
        label: "Recovery",
        icon: Compass,
        keywords: ["recovery", "urge", "trigger", "pause", "plan"],
      },
      {
        id: "growth-journal",
        href: "/growth/journal",
        label: "Journal",
        icon: NotebookPen,
        description: "Daily reflection — mood, wins, lessons",
        keywords: ["journal", "reflection", "mood", "energy", "gratitude", "diary"],
      },
      { id: "growth-deep-work", href: "/growth/focus", label: "Deep Work", icon: Zap, soon: true },
      { id: "growth-mood", href: "/growth/mood", label: "Mood", icon: Smile, soon: true },
      { id: "growth-rewards", href: "/growth/rewards", label: "Rewards", icon: Trophy, soon: true },
    ],
  },
  {
    // Absorbs the old "Progress" workspace — Achievements/Statistics/
    // History/Timeline are real, visible flyout children here (same pattern
    // as Goals/Growth) alongside the review-hub itself, which keeps the
    // section's own href as one of its children (mirrors "goals-goals").
    id: "review",
    label: "Review",
    icon: Sunrise,
    href: "/review/morning",
    items: [
      {
        id: "review-hub",
        href: "/review/morning",
        label: "Review",
        icon: Sunrise,
        description: "Morning brief, evening review, weekly review",
        keywords: ["review", "morning", "evening", "weekly", "brief", "reflection", "summary"],
        // Any of the three review pages should light this item up, not just
        // the default one it links to.
        match: { pathname: "/review" },
      },
      {
        id: "review-achievements",
        href: "/achievements",
        label: "Achievements",
        icon: Trophy,
        keywords: ["badges", "xp", "level", "progress"],
      },
      {
        id: "review-statistics",
        href: "/statistics",
        label: "Statistics",
        icon: BarChart3,
        keywords: ["stats", "charts", "analytics", "progress"],
      },
      {
        id: "review-history",
        href: "/history",
        label: "History",
        icon: History,
        keywords: ["activity", "log", "past", "sessions"],
      },
      {
        id: "review-timeline",
        href: "/timeline",
        label: "Timeline",
        icon: CalendarClock,
        description: "Everything you did, day by day",
        keywords: ["timeline", "activity", "journal", "habits", "tasks", "day", "week", "month"],
      },
    ],
  },
  {
    // "Memory" (browsing what Hengo remembers) is the primary workspace;
    // "Ask Hengo" (the action of asking it something) is a hidden child here
    // — it gets its global entry points elsewhere (header, More sheet,
    // Quick Switcher) rather than a second visible row in this group.
    id: "memory",
    label: "Memory",
    icon: BrainCircuit,
    href: memoryHubItem.href,
    items: [memoryHubItem, askHengoItem],
  },
  {
    // Preserved routes, no primary sidebar/rail presence — see the
    // `showInSidebar: false` note on `aiCoachItem` above.
    id: "ai",
    label: "AI Coach",
    icon: MessageCircle,
    href: aiCoachItem.href,
    items: [
      aiCoachItem,
      {
        id: "ai-analyze",
        href: "/chat?mode=analyze",
        label: "Analyze",
        icon: ScanText,
        keywords: ["ai", "analyze", "breakdown", "explain"],
        match: { pathname: "/chat", query: { mode: "analyze" } },
        showInSidebar: false,
      },
      {
        id: "ai-generate",
        href: "/chat?mode=generate",
        label: "Generate",
        icon: Wand2,
        keywords: ["ai", "generate", "create", "draft"],
        match: { pathname: "/chat", query: { mode: "generate" } },
        showInSidebar: false,
      },
      {
        id: "ai-corrections",
        href: "/chat?mode=corrections",
        label: "Corrections",
        icon: RotateCcw,
        keywords: ["ai", "mistakes", "corrections", "fix", "grammar"],
        match: { pathname: "/chat", query: { mode: "corrections" } },
        showInSidebar: false,
      },
      // Not listed here again — `askHengoItem` above (a child of the "memory"
      // section) already registers `/chat?mode=memory` as a route. Duplicating
      // it here would register the same id twice.
    ],
  },
]

/** Sections that get their own rail/sidebar entry (Today is rendered on its own). */
export const primarySections: NavSection[] = navSections.filter((s) => s.id !== "today")

/** Every navigable item in the app, including Settings/Account. */
export const allNavItems: NavItem[] = [
  ...navSections.flatMap((s) => s.items),
  accountItem,
  settingsItem,
]

// Only items that actually get their own sidebar/rail/bottom-nav row can
// "shadow" a parent's prefix match (see the sibling-wins comment below).
// Hidden hub children (showInSidebar: false — Learn's practice/vocab/etc.,
// Goals' overview/tasks/roadmap) have no separate row to hand the highlight
// to, so excluding them here lets the parent (e.g. the Goals bottom tab)
// stay lit while browsing them instead of going dark.
const navPathnames = new Set(
  allNavItems.filter((item) => item.showInSidebar !== false).map((item) => linkPath(item.href))
)

/** Look an item up by its stable id. Throws on typos at module-load time. */
export function navItem(id: string): NavItem {
  const found = allNavItems.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown nav item id: ${id}`)
  return found
}

function section(id: NavSectionId): NavSection {
  return navSections.find((s) => s.id === id)!
}

// ─── Visible navigation (separate from the route registry above) ─────────────
//
// Everything above this line is the full route registry: every real
// destination, used for active-matching, breadcrumbs, titles, and search.
// Only the two lists below decide what actually gets a row in the sidebar /
// tablet rail's primary and secondary areas — Today is rendered on its own by
// the shell, and Goals/Growth already render their own visible children via
// `visibleSidebarItems`.

/**
 * The only sections that get a real primary group in the desktop sidebar and
 * tablet rail: Today, Goals, Growth, Memory, Review. Order here is display
 * order. Learn and AI are deliberately excluded — Learn is a secondary
 * destination (see `secondaryNavItems`) and AI has no chrome presence at all
 * now that "Ask Hengo" is the single global AI entry point.
 */
export const workspaceNavSections: NavSection[] = ["goals", "growth", "memory", "review"].map((id) =>
  section(id as NavSectionId)
)

/**
 * Secondary desktop/tablet destinations, rendered below the primary groups:
 * Learn's card hub and Settings. "Account" is deliberately not listed here —
 * the existing `ProfileMenu` component already serves as the sidebar's
 * Account entry point (avatar + email, labelled "Account"), so adding a
 * second plain Account row would duplicate it.
 */
export const secondaryNavItems: NavItem[] = [navItem("learn-hub"), settingsItem]

// ─── Matching ─────────────────────────────────────────────────────────────────

/** Base href without its query string. */
export function linkPath(href: string): string {
  return href.split("?")[0]
}

/** Read-only view of the current query — accepts `URLSearchParams` or a plain object. */
export type NavSearchParams =
  | URLSearchParams
  | Record<string, string | undefined>
  | string
  | null
  | undefined

function readParam(search: NavSearchParams, key: string): string | null {
  if (search == null) return null
  if (typeof search === "string") return new URLSearchParams(search).get(key)
  if (search instanceof URLSearchParams) return search.get(key)
  return search[key] ?? null
}

function resolveMatch(item: NavItem): NavMatch {
  if (item.match) return item.match
  const [pathname, query] = item.href.split("?")
  if (!query) return { pathname }
  const parsed: Record<string, string> = {}
  new URLSearchParams(query).forEach((value, key) => {
    parsed[key] = value
  })
  return { pathname, query: parsed }
}

/**
 * Query-aware active matching. Pure — no hooks — so the shell can pass in
 * `usePathname()` / `useSearchParams()` and tests can pass plain strings.
 */
export function isNavigationItemActive({
  pathname,
  searchParams,
  item,
}: {
  pathname: string
  searchParams?: NavSearchParams
  item: NavItem
}): boolean {
  if (item.soon) return false

  const match = resolveMatch(item)

  // Section-wide match — used by hub items whose child routes don't share a
  // URL prefix with the hub (e.g. mobile's Learn tab: `/korean-coach` and
  // `/reading` aren't under `/learn`, but should still light it up).
  if (match.sectionId) {
    return getSectionForPath(pathname, searchParams)?.id === match.sectionId
  }

  const includeChildren = match.includeChildren ?? true

  if (match.query) {
    for (const [key, value] of Object.entries(match.query)) {
      if (readParam(searchParams, key) !== value) return false
    }
  }
  if (match.absentQuery) {
    for (const key of match.absentQuery) {
      if (readParam(searchParams, key) != null) return false
    }
  }

  if (pathname === match.pathname) return true
  if (!includeChildren) return false
  if (!pathname.startsWith(`${match.pathname}/`)) return false

  // Prefix match — but if the current pathname is itself ANOTHER nav item's
  // exact path (e.g. "/goals/calendar" under "/goals", or
  // "/growth/recovery/log" under "/growth/recovery"), that more specific
  // sibling wins instead of both showing active. Sub-routes that aren't
  // themselves nav items (e.g. "/goals/create", "/goals/[id]") still match.
  // Excludes the item's own href so a deliberately loose match (e.g.
  // review-hub: href "/review/morning", match.pathname "/review", to also
  // catch /review/evening and /review/weekly) doesn't shadow itself.
  return !(navPathnames.has(pathname) && linkPath(item.href) !== pathname)
}

/** Convenience wrapper used by non-query surfaces (Growth tabs, etc.). */
export function isLinkActive(pathname: string, href: string): boolean {
  const item = allNavItems.find((i) => i.href === href)
  if (item) return isNavigationItemActive({ pathname, item })
  return isNavigationItemActive({
    pathname,
    item: { id: href, href, label: href, icon: Home },
  })
}

/** Which section the current route belongs to, or undefined for /settings etc. */
export function getSectionForPath(pathname: string, searchParams?: NavSearchParams): NavSection | undefined {
  return navSections.find((section) =>
    section.items.some((item) => isNavigationItemActive({ pathname, searchParams, item }))
  )
}

/** The single nav item matching the current route — drives header titles. */
export function getActiveNavItem(pathname: string, searchParams?: NavSearchParams): NavItem | undefined {
  return allNavItems.find((item) => isNavigationItemActive({ pathname, searchParams, item }))
}

// ─── Mobile bottom bar ────────────────────────────────────────────────────────

/**
 * Exactly five mobile destinations. The fifth ("More") is a sheet trigger, not
 * a route, so it is not in this list — see `MobileBottomNav`. Learn moved to
 * the More sheet as a secondary destination; Memory takes its bottom-tab slot.
 */
export const bottomTabs: NavItem[] = [
  todayItem,
  { ...navItem("goals-goals"), id: "tab-goals", label: "Goals" },
  { ...navItem("growth-habits"), id: "tab-growth", label: "Growth" },
  // Lands on the Memory hub, and stays lit for /ask-hengo (Ask Hengo chat)
  // too via the section-wide match — a hidden child still activates its
  // parent workspace's tab.
  {
    ...navItem("memory-hub"),
    id: "tab-memory",
    label: "Memory",
    match: { pathname: "/ask-hengo/memories", sectionId: "memory" },
  },
]

/**
 * Whether the current route lives behind the "More" sheet rather than one of
 * the four direct tabs. Anything no tab owns counts — so /vocab, /statistics,
 * /chat and /settings all light up "More".
 */
export function isMoreRoute(pathname: string, searchParams?: NavSearchParams): boolean {
  return !bottomTabs.some((item) => isNavigationItemActive({ pathname, searchParams, item }))
}

/** Index of the active bottom tab, or `bottomTabs.length` for More, or -1. */
export function getActiveBottomTabIndex(pathname: string, searchParams?: NavSearchParams): number {
  const index = bottomTabs.findIndex((item) => isNavigationItemActive({ pathname, searchParams, item }))
  if (index !== -1) return index
  return isMoreRoute(pathname, searchParams) ? bottomTabs.length : -1
}

// ─── "More" sheet grouping ────────────────────────────────────────────────────

export type MoreGroup = {
  id: string
  label: string
  items: NavItem[]
}

/** Only shipped items — `soon` placeholders are surfaced separately. */
export function shippedItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.soon)
}

export function comingSoonItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => item.soon)
}

/**
 * Shipped items that also get their own sidebar/rail/flyout row. A section
 * where every item opts out (like Learn — see `showInSidebar` on `NavItem`)
 * renders as a single flat link to `section.href` instead of an expandable
 * group; see `DesktopSidebar` / `TabletNavigationRail`.
 */
export function visibleSidebarItems(section: NavSection): NavItem[] {
  return shippedItems(section.items).filter((item) => item.showInSidebar !== false)
}

/**
 * The More sheet's single flat menu: Review, Learn, Settings, Account.
 * "Ask Hengo" is rendered separately as a pinned card at the top of the sheet
 * (the mobile home for the global AI action), so it's excluded here to avoid
 * listing it twice. Memory, Goals, and Growth aren't repeated here either —
 * they're already bottom tabs. Goals' and Growth's own sub-pages (Calendar,
 * Notes, Inbox, Recovery, Journal, …) and Review's Achievements/Statistics/
 * History/Timeline are real, searchable, breadcrumb-able routes — reachable
 * via the Quick Switcher and each workspace's own flyout on desktop/tablet —
 * just not duplicated into this simplified sheet.
 */
export const moreGroups: MoreGroup[] = [
  {
    id: "menu",
    label: "",
    items: [navItem("review-hub"), navItem("learn-hub"), settingsItem, accountItem],
  },
]

/** `soon` placeholders, kept out of the main groups so they don't dominate. */
export const moreComingSoon: NavItem[] = navSections.flatMap((s) => comingSoonItems(s.items))

// ─── Last-visited tracking ────────────────────────────────────────────────────

/** Plain route prefixes per section id, for `lib/last-visited.ts`. */
export const sectionRoutePrefixes: Record<string, string[]> = Object.fromEntries(
  primarySections.map((s) => [s.id, s.items.map((i) => linkPath(i.href))])
)
