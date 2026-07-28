import {
  BarChart3,
  BookOpen,
  BookOpenText,
  CalendarDays,
  Compass,
  Drama,
  Gauge,
  GraduationCap,
  Headphones,
  History,
  Home,
  Languages,
  ListChecks,
  Map,
  MessageCircle,
  MessagesSquare,
  NotebookPen,
  RotateCcw,
  ScanText,
  Settings,
  Smile,
  Sparkles,
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
}

export type NavSectionId = "today" | "learn" | "goals" | "growth" | "progress" | "ai"

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
    href: "/practice",
    items: [
      {
        id: "learn-practice",
        href: "/practice",
        label: "Practice",
        icon: Sparkles,
        description: "Today's Korean practice session",
        keywords: ["learn", "korean", "daily", "drill", "speaking"],
      },
      {
        id: "learn-vocab",
        href: "/vocab",
        label: "Vocabulary",
        icon: BookOpen,
        keywords: ["words", "srs", "review", "flashcards", "korean"],
      },
      {
        id: "learn-phrasebook",
        href: "/phrasebook",
        label: "Phrasebook",
        icon: MessagesSquare,
        description: "Workplace and daily-life Q&A practice",
        keywords: ["phrasebook", "questions", "answers", "workplace", "qa", "speaking", "listening", "korean"],
      },
      {
        id: "learn-foundations",
        href: "/learn",
        label: "Foundations",
        icon: Languages,
        keywords: ["grammar", "hangul", "basics", "korean"],
      },
      {
        id: "learn-reading",
        href: "/reading",
        label: "Reading",
        icon: BookOpenText,
        keywords: ["articles", "comprehension", "korean"],
      },
      {
        id: "learn-listening",
        href: "/listening",
        label: "Listening",
        icon: Headphones,
        keywords: ["audio", "dictation", "korean"],
      },
      {
        id: "learn-scenarios",
        href: "/scenarios",
        label: "Scenarios",
        icon: Drama,
        keywords: ["roleplay", "workplace", "situations", "korean"],
      },
      {
        id: "learn-interview",
        href: "/interview",
        label: "Exam Prep",
        icon: GraduationCap,
        keywords: ["topik", "interview", "test", "exam"],
      },
    ],
  },
  {
    id: "goals",
    label: "Goals",
    icon: Target,
    href: "/goals",
    items: [
      {
        id: "goals-dashboard",
        href: "/dashboard",
        label: "Dashboard",
        icon: Gauge,
        keywords: ["overview", "tasks", "today", "plan"],
      },
      {
        id: "goals-goals",
        href: "/goals",
        label: "Goals",
        icon: Target,
        keywords: ["goal", "objective", "outcome", "plan"],
        // /goals/calendar is its own item; keep it from also lighting up Goals.
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
        keywords: ["milestones", "phases", "timeline"],
      },
      {
        id: "goals-notes",
        href: "/notes",
        label: "Notes",
        icon: NotebookPen,
        keywords: ["note", "scratchpad", "ideas"],
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
      { id: "growth-deep-work", href: "/growth/focus", label: "Deep Work", icon: Zap, soon: true },
      { id: "growth-mood", href: "/growth/mood", label: "Mood", icon: Smile, soon: true },
      { id: "growth-journal", href: "/growth/journal", label: "Journal", icon: NotebookPen, soon: true },
      { id: "growth-rewards", href: "/growth/rewards", label: "Rewards", icon: Trophy, soon: true },
    ],
  },
  {
    id: "progress",
    label: "Progress",
    icon: Trophy,
    href: "/achievements",
    items: [
      {
        id: "progress-achievements",
        href: "/achievements",
        label: "Achievements",
        icon: Trophy,
        keywords: ["badges", "xp", "level", "progress"],
      },
      {
        id: "progress-statistics",
        href: "/statistics",
        label: "Statistics",
        icon: BarChart3,
        keywords: ["stats", "charts", "analytics", "progress"],
      },
      {
        id: "progress-history",
        href: "/history",
        label: "History",
        icon: History,
        keywords: ["activity", "log", "past", "sessions"],
      },
    ],
  },
  {
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
      },
      {
        id: "ai-generate",
        href: "/chat?mode=generate",
        label: "Generate",
        icon: Wand2,
        keywords: ["ai", "generate", "create", "draft"],
        match: { pathname: "/chat", query: { mode: "generate" } },
      },
      {
        id: "ai-corrections",
        href: "/chat?mode=corrections",
        label: "Corrections",
        icon: RotateCcw,
        keywords: ["ai", "mistakes", "corrections", "fix", "grammar"],
        match: { pathname: "/chat", query: { mode: "corrections" } },
      },
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

const navPathnames = new Set(allNavItems.map((item) => linkPath(item.href)))

/** Look an item up by its stable id. Throws on typos at module-load time. */
export function navItem(id: string): NavItem {
  const found = allNavItems.find((item) => item.id === id)
  if (!found) throw new Error(`Unknown nav item id: ${id}`)
  return found
}

function section(id: NavSectionId): NavSection {
  return navSections.find((s) => s.id === id)!
}

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

  // Prefix match — but if the current pathname is itself another nav item's
  // exact path (e.g. "/goals/calendar" under "/goals", or
  // "/growth/recovery/log" under "/growth/recovery"), that more specific
  // sibling wins instead of both showing active. Sub-routes that aren't
  // themselves nav items (e.g. "/goals/create", "/goals/[id]") still match.
  return !navPathnames.has(pathname)
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
 * a route, so it is not in this list — see `MobileBottomNav`.
 */
export const bottomTabs: NavItem[] = [
  todayItem,
  { ...navItem("learn-practice"), id: "tab-learn", label: "Learn" },
  { ...navItem("goals-goals"), id: "tab-goals", label: "Goals" },
  { ...navItem("growth-habits"), id: "tab-growth", label: "Growth" },
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

const HIDDEN_FROM_MORE = new Set([
  "today",
  "learn-practice",
  "goals-goals",
  "growth-habits",
  "ai-chat",
])

/** Only shipped items — `soon` placeholders are surfaced separately. */
export function shippedItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => !item.soon)
}

export function comingSoonItems(items: NavItem[]): NavItem[] {
  return items.filter((item) => item.soon)
}

/**
 * The More sheet's groups, in display order. The AI Coach card is rendered
 * separately at the top of the sheet, so it is excluded here.
 */
export const moreGroups: MoreGroup[] = [
  { id: "progress", label: "Progress", items: shippedItems(section("progress").items) },
  {
    id: "tools",
    label: "Tools",
    items: shippedItems(section("goals").items).filter((i) => !HIDDEN_FROM_MORE.has(i.id)),
  },
  {
    id: "learn-more",
    label: "Learn more",
    items: shippedItems(section("learn").items).filter((i) => !HIDDEN_FROM_MORE.has(i.id)),
  },
  {
    id: "growth-more",
    label: "Growth",
    items: shippedItems(section("growth").items).filter((i) => !HIDDEN_FROM_MORE.has(i.id)),
  },
  { id: "account", label: "Account", items: [accountItem, settingsItem] },
]

/** `soon` placeholders, kept out of the main groups so they don't dominate. */
export const moreComingSoon: NavItem[] = navSections.flatMap((s) => comingSoonItems(s.items))

// ─── Last-visited tracking ────────────────────────────────────────────────────

/** Plain route prefixes per section id, for `lib/last-visited.ts`. */
export const sectionRoutePrefixes: Record<string, string[]> = Object.fromEntries(
  primarySections.map((s) => [s.id, s.items.map((i) => linkPath(i.href))])
)
