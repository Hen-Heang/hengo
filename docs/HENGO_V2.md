# Hengo V2 — focused Korean learning

## Purpose

Hengo V1 grew into a platform that tried to be seven products at once: Korean
learning, goals, tasks, calendar, habits, growth, journal, notes, personal
memory, progress analytics, achievements, general AI chat, and exam prep. Each
piece worked, but the product no longer answered a simple question when you
opened it.

Hengo V2 is a **practical Korean-learning assistant for someone living and
working in Korea**, and nothing else. It answers one question immediately:

> What Korean should I practice today?

The primary use cases it serves:

1. Capture Korean words encountered at work or in daily life.
2. Remember vocabulary through spaced repetition.
3. Practice Korean every day in a short session.
4. Practice speaking and listening.
5. Learn useful workplace and daily-life Korean.
6. Get concise AI corrections.
7. See what to practice today.

Hengo deliberately does **not** try to replace Notion, Google Tasks, Google
Calendar, ChatGPT, or a general productivity system. Those responsibilities are
outside V2's scope.

## Core user journey

```
Capture → Review → Practice → Speak → Improve
```

Concretely: you hear 회의 at work, open Hengo, tap "+ Add word", type the
Korean and its meaning, hit Enter, and you're done in about ten seconds. It
comes back to you the next day in review, then shows up in a daily practice
session, and the words you keep getting wrong steer what the Coach has you
say out loud.

The target is an app that's easy enough to open every day for 5–15 minutes.

## Primary navigation

Five destinations, identical on desktop, tablet, and mobile:

| Label | Route | Purpose |
| --- | --- | --- |
| Today | `/home` | What to practice today |
| Vocabulary | `/vocab` | Capture and review words and phrases |
| Practice | `/practice` | A 5–10 minute daily session |
| Coach | `/korean-coach` | Speaking, listening, mistake review |
| Study | `/learn` | Phrases, foundations, reading, listening |

Notes on this shape:

- **Study's route stays `/learn`.** The visible label changed; the route did
  not, so existing links and bookmarks keep working.
- **Mobile uses five direct tabs**, not four-plus-More. The five destinations
  fill the bar exactly, so there is nothing left to hide behind an overflow
  sheet, and the "More" sheet is no longer mounted.
- **No expandable workspaces.** The V1 Plan / Grow / Memory / AI groups are
  gone from the sidebar in favor of five flat rows.
- Vocabulary, Practice, and Coach each own their nav slot, so the Study hub
  deliberately does not duplicate them as cards — one path per feature.

## Hidden V1 features

These are hidden from navigation, the home page, and unprompted discovery. They
are **not deleted**: their routes, components, and Supabase data are all intact
and every route still works when visited directly.

Goals · Tasks · Calendar · Inbox · Roadmap · Habits · Recovery · Journal ·
Progress hub · Achievements · Statistics · Morning/Evening/Weekly review ·
History · Timeline · Notes · Memories · Ask Hengo · general AI Chat · Analyze ·
Generate · Scenarios (as a top-level module) · K-Specialist interview prep

How backward compatibility is preserved:

- `lib/navigation.ts` keeps its **full route registry** (`navSections`,
  `allNavItems`, and the matching helpers). Only the new `primaryNavItems`
  export decides what gets a row in the shell. Route metadata still drives page
  titles, breadcrumbs, and active-state matching for every hidden route.
- The **Quick Switcher (⌘K) still searches everything.** Its empty-query
  default was trimmed to V2's five destinations so it stops dumping the whole
  V1 catalog unprompted, but typing anything reaches every route and action,
  including Quick Capture, Create goal, and Add task.
- The V1 grouping exports (`workspaceNavSections`, `bottomTabs`, `moreGroups`,
  …) and the `WorkspaceFlyout` / `MoreNavigationSheet` components are left in
  the codebase, unmounted and commented as superseded rather than deleted.

## Architecture decisions

**No database migration.** V2 is a product-surface simplification. No schema
changes, no renamed tables, no data deleted. The `kori_*` table prefix and the
`koriai-auth` storage key remain load-bearing legacy identifiers — user-facing
branding is Hengo, storage identifiers stay `kori_`/`koriai-`.

**Hide, don't delete.** Every phase removed promotion, never implementation.
This keeps the V1 surfaces recoverable and the live Supabase data (shared with
Orbit/DailyGoalMap) untouched.

**The SRS algorithm was not rewritten.** `lib/srs.ts` and the rating values
(`AGAIN`/`HARD`/`GOOD`/`EASY`) are unchanged. Vocabulary work was UX polish:
auto-focus and Enter-to-submit on capture, and a review button that jumps
straight into flashcards with the mode/category picker demoted to an opt-in
"Customize session" link.

**Exam prep is gated, not removed.** The K-Specialist exam date is a single
hardcoded constant in `lib/study-plan.ts`, not per-user data. A new
`isExamActive()` helper is now the one source of truth, shared by
`ExamCountdownBanner` and the daily mission generator. Two mission paths
(`buildWeaknessCandidate`, `buildVarietyCandidate`) previously offered
`interview` missions with no exam check at all — they are now gated, and fall
back to scenario/vocab/listening/correction practice. If the constants are ever
updated for a future exam cycle, both the banner and interview missions
reactivate automatically with no code changes.

**Coach owns the AI identity.** `/korean-coach` leads with one CTA ("Start
speaking") and three secondary modes (Speaking, Listening, Review mistakes).
Listening deep-links to the real `/listening` experience instead of Coach's own
duplicate transcript UI. Coach's scenario picker already lived in its own route
tree and never competed with the separate top-level `/scenarios` module.

**Performance.** `/home` reads from existing cached hooks (`useVocab`,
`useStreak`) plus one lightweight daily-phrase query. The primary vocabulary
card and the stats line share a single TanStack Query instance, and no hidden
V1 productivity data is fetched to populate features that are no longer shown.

## Branches

- **V1 archive:** `archive/hengo-v1-2026-08-31` — preserves the full V1
  product surface, including its original navigation and exam-prep
  presentation. Never modify this branch.
- **V2 development:** `feat/hengo-v2-korean-focus` — all V2 work, merged to
  `main` via pull request.

## Future ideas

Recorded, deliberately **not** implemented in this phase:

- **Khmer translation field** for vocabulary. The current `VocabItem` model has
  `term`, `meaning`, `pronunciation`, `example`, `exampleTranslation`,
  `difficultyLevel`, `category`, and `tags` — there is no notes field and no
  separate translation field. Adding either requires a real migration decision
  against a Supabase database shared with another live product.
- Browser extension for capturing words from any page.
- Mobile native app.
- OCR vocabulary capture (photograph a sign or document).
- Anki synchronization.
- Deeper Telegram integration.
- A larger gamification system.
- Public/social features, a teacher dashboard, or a full TOPIK curriculum.

## Known follow-ups

- `apps/web/docs/navigation-shell-audit.md` documents the V1 grouped-sidebar
  rationale and is now stale.
- `lib/learning/corrections.test.ts` has a pre-existing date-drift failure (a
  hardcoded date that has aged past "today"), unrelated to V2.
- Running the jsdom test suites on Node 25 needs
  `NODE_OPTIONS=--no-experimental-webstorage`; Node's experimental
  `localStorage` global otherwise shadows jsdom's and breaks
  `localStorage.clear`.
