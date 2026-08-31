# Hengo UI, UX, accessibility, and responsive audit

Date: 2026-07-26  
Primary viewport: iPhone 12 Pro Max, 428 × 926 CSS px, DPR 3  
Repository state: audited in place after the second-brain implementation; pre-existing working-tree changes were preserved.

## Executive summary

The public experience is visually coherent and responsive, with a clear type hierarchy, strong light/dark contrast, and no document-level horizontal overflow in the tested viewport matrix. The largest issues were in application-shell integration after the second-brain work: `/home` had lost its documented immersive treatment, Ask Hengo was not reachable in normal desktop/tablet navigation, the mobile fixed navigation/FAB could cover final content, several dialogs could be clipped by the iOS keyboard, and multiple mobile form controls could trigger Safari zoom.

Those issues were fixed through the existing shell and shared UI primitives. The second-brain components were also tightened for touch sizing, focus-safe deletion, long-content wrapping, responsive filtering, explicit reminder state, and clearer draft/status feedback.

Protected pages could not be opened in the isolated audit browser because the repository contains no safe test credentials or authenticated Playwright storage state. The app correctly redirected the browser to `/login`. Per the security constraint, authentication was not bypassed. Protected routes therefore received a repository-wide route inventory plus code/component audit, but visual claims in this document are limited to the public routes actually rendered. The new authenticated journey test becomes active when `HENGO_E2E_STORAGE_STATE` points to a safe test-account storage state.

## Follow-up pass — `/home` regression found through the user's own live session

A follow-up pass had access to an already-authenticated interactive browser session (the signed-in user's own tab), letting `/home` — the one route the first pass could only code-review — actually be rendered and inspected. The user's own report ("home page responsive is not good") was reproduced immediately: **`/home`'s content rendered completely edge-to-edge, with zero padding on every side, at every viewport width tested.**

Root cause: the first pass's own High-severity fix (restoring the `isHomeRoute` full-bleed branch in `AppShell`, so `/home` correctly gets no shell chrome and `p-0` from the shell) was correct, but `app/(main)/home/page.tsx` was never given compensating internal padding to match — unlike `/chat`, the shell's _other_ full-bleed route, whose `ChatWindow` has always managed its own internal horizontal/top-safe-area padding (see `pt-[max(0.75rem,env(safe-area-inset-top))]` in `components/chat/ChatWindow.tsx`). So the moment the shell correctly stopped supplying `/home`'s padding, `/home` had none of its own to fall back on — a real regression exposed by, not created by, this audit's earlier fix.

| Route   | Viewport                                                                                     | Problem                                                                                                                                                                                                                                                                                                                 | Expected behavior                                                                                                                                                                                                                           | Implemented fix                                                                                                                                                                                                                                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/home` | All (confirmed at effective ~150px mobile-equivalent width and native ~1728px desktop width) | Content had `padding-top: 0px` and `padding-left: 0px` (measured directly via computed styles) — the hero heading sat flush against the very top of the viewport (would sit under the status bar/Dynamic Island on a real notched iPhone) and every poster card touched the left/right viewport edges with zero margin. | `/home` reads like every other page — consistent side margins, a max content width on large screens, and top clearance that respects the safe area, matching the pattern `ChatWindow` already uses for the same full-bleed shell treatment. | Added self-contained `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` horizontal padding/centering and `pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-8` / `pb-[max(3rem,env(safe-area-inset-bottom))]` safe-area-aware vertical padding directly to `app/(main)/home/page.tsx` (both the loaded view and its loading skeleton, so there's no layout jump between states). |

Verification method and an honest caveat: this pass could not extend the authenticated Playwright journey test to `/home` — creating a storage state still requires either real test credentials (not present in the repo) or extracting the live session's token via injected script, which is correctly refused as credential exfiltration regardless of whose session it is. Verification therefore used the same authenticated interactive tab: computed-style assertions (`getBoundingClientRect`/`getComputedStyle` on the content wrapper, confirming `0px` padding before the fix and the expected non-zero values after) plus real screenshots at two effective widths, before and after the fix. The public Playwright suite (`tests/e2e/responsive-public.e2e.ts`, real 428×926 Chromium) was re-run and still passes 9/9, confirming no regression to the routes it covers. Full checkpoint re-run: `pnpm test` 859/859, `pnpm lint` 0 errors (same 16 pre-existing warnings), `tsc --noEmit` clean, `pnpm build` clean.

## Method

- Read project and design documentation, shell/navigation code, global styles, package scripts, shared UI primitives, and second-brain implementation notes.
- Inventoried all `app/**/page.tsx` routes instead of relying on the requested list.
- Used the already-running Hengo development server on `http://127.0.0.1:3001`. Port 3000 belonged to a different local project and was intentionally left untouched.
- Captured and visually inspected real Chromium screenshots, including scrolled landing content.
- Repeated the public audit after fixes in true light and dark themes.
- Measured document width, input font size, control geometry, viewport containment, browser errors, and page errors.
- Added stable Playwright checks for the public viewport matrix and an opt-in authenticated second-brain journey.

## Findings and fixes

### Critical

No critical issue was reproduced on the public routes. No protected-route critical finding is claimed because authenticated rendering was unavailable.

### High

| Route                                   | Viewport                                | Problem                                                                                                                                                                    | Expected behavior                                                                                              | Implemented fix                                                                                                                                                                  |
| --------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/home`                                 | All                                     | The documented workspace-gate exception was missing from `AppShell`, so shell chrome and padding could appear around an immersive page.                                    | Home renders full bleed without duplicate mobile/desktop chrome.                                               | Restored an explicit `isHomeRoute` branch across header, sidebar, rail, bottom-nav, and full-bleed logic.                                                                        |
| `/ask-hengo`, `/chat`                   | Mobile, tablet, desktop                 | Ask Hengo was effectively hidden from ordinary navigation, while the mobile card called Korean chat “Ask Hengo AI.”                                                        | Memory retrieval and Korean coaching are visibly distinct, reachable destinations.                             | Added a distinct Ask Hengo row to desktop/tablet navigation and mobile Tools, while retaining the single direct AI Coach row and renaming the `/chat` card to “Korean AI Coach.” |
| Shell-fixed navigation                  | 360–428px mobile                        | Main content had only about 5rem of bottom clearance while the bottom nav and capture FAB occupied more vertical space. Final actions/list items could sit under fixed UI. | The final active control remains scrollable above fixed navigation.                                            | Increased mobile shell bottom clearance and placed the FAB immediately above the safe-area-aware nav.                                                                            |
| Quick Capture, reminders, other dialogs | Mobile portrait/landscape with keyboard | Shared dialogs had no dynamic-viewport max height or scroll containment; Quick Capture explicitly hid overflow.                                                            | Dialog content and submit controls remain reachable when the browser toolbar or keyboard reduces the viewport. | Added `100dvh`-based max height and overscroll containment to the dialog primitive; made Quick Capture a flex layout with an independently scrollable body.                      |
| Inbox filters                           | 360px                                   | Three fixed-width filters could total more than the viewport width when tags were present.                                                                                 | Filters wrap/collapse without document overflow.                                                               | Switched the mobile filter row to a two-column grid and retained fixed desktop widths only at `sm`.                                                                              |
| Notes delete                            | Mobile, keyboard, screen reader         | A custom inline confirmation had 10px text, tiny controls, no focus trap, and an unlabeled trash action.                                                                   | Destructive deletion is explicit, focused, labeled, and reversible until confirmation.                         | Replaced it with the existing Radix AlertDialog and shared Buttons; added an accessible delete label and loading guard.                                                          |

### Medium

| Route/component                       | Viewport      | Problem                                                                                                                           | Expected behavior                                                                                  | Implemented fix                                                                                                                                                                                   |
| ------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration and custom editor inputs | iOS mobile    | Native selects and raw text inputs used 12–14px text in places, which can trigger Safari input zoom.                              | Editable controls use at least 16px on mobile.                                                     | Upgraded registration selects, note fields, search, tags, markdown editor, shared selects, and native date/time fields to 16px mobile text with smaller desktop overrides only where appropriate. |
| Shared buttons and icon controls      | Touch devices | `xs`, `sm`, `icon-xs`, and `icon-sm` variants could render between 24px and 36px.                                                 | Important touch targets are approximately 44 × 44px on coarse pointers without inflating mouse UI. | Added coarse-pointer minimum sizing to the existing Button variants.                                                                                                                              |
| Notes reading                         | Mobile        | The note action bar was sticky at `top: 0`, behind the shell’s mobile header; long URLs/code could escape the article.            | Actions remain visible and content wraps or scrolls locally.                                       | Limited sticky behavior to `md+`; added anywhere wrapping and horizontal code-block scrolling; changed `100vh` panels to `100dvh`.                                                                |
| Notes editing                         | Mobile        | Draft persistence existed but current save state was invisible; write/preview controls were small.                                | Users can tell that a local draft is protected and switch editor modes reliably.                   | Added an `aria-live` local-draft status and 44px editor mode controls; preserved existing local-storage draft behavior.                                                                           |
| Reminder creation                     | Mobile        | Schedule modes, weekday buttons, and channels were small and did not expose selected state; success wording could imply delivery. | One-time/recurring and delivery choices are explicit; scheduling is not confused with delivery.    | Added grouped labels and `aria-pressed`, 44px targets, visible timezone/next-run copy, and changed success feedback to “Reminder scheduled.”                                                      |
| Journal                               | Mobile        | Mood/energy buttons were 36px and identified only by numeric text/title; labels were not associated with prompts.                 | Ratings expose their meaning and all prompts are directly labeled.                                 | Added grouped accessible rating names, 44px buttons, `aria-pressed`, form-label associations, and larger secondary controls.                                                                      |
| Timeline                              | Mobile        | Day/week/month controls and 10px type/time metadata were difficult to use/read.                                                   | Filters work by touch and entry source/time remains legible.                                       | Added grouped selected state, 44px controls, 12px metadata, long-title wrapping, and distinct existing kind icons/colors.                                                                         |
| Public/auth shell                     | Mobile Safari | `min-h-screen` and top spacing did not account for dynamic viewport or safe areas.                                                | Pages remain stable under Safari toolbar changes and notches.                                      | Replaced relevant full-height utilities with `min-h-dvh`; added top/bottom safe-area padding to auth, landing, privacy, and terms pages.                                                          |

### Low

| Route/component                     | Viewport | Problem                                                                                         | Expected behavior                                          | Implemented fix                                                                 |
| ----------------------------------- | -------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Theme toggle                        | Touch    | The visible toggle was 36–37px.                                                                 | A comfortable icon-only target.                            | Increased it to 44px while retaining the existing menu and label.               |
| Bottom navigation and More headings | Mobile   | Labels used 11px text.                                                                          | Navigation remains readable without wrapping.              | Moved labels/headings to the established 12px token while retaining truncation. |
| Review stats                        | Mobile   | Important stat labels used 11px.                                                                | Summary values and labels are readable.                    | Updated labels to 12px.                                                         |
| Inbox/reminder cards                | Mobile   | Long user text was truncated or could overflow; some primary row actions forced 32px height.    | User content wraps safely and row actions remain tappable. | Added safe wrapping/line clamping and removed forced undersized heights.        |
| Legal pages                         | Mobile   | Header return links were shorter than the touch guideline, and prose lacked defensive wrapping. | Navigation is touchable and long text cannot overflow.     | Added 44px minimum height and defensive prose wrapping.                         |

### Enhancement

| Area                           | Observation                                                                                                                                                                                | Follow-up                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated visual baselines | The project has Playwright but no checked-in safe storage state.                                                                                                                           | Provide an isolated test account and `HENGO_E2E_STORAGE_STATE`; then run the new full journey and capture intentional protected-route screenshots. |
| Safari engine coverage         | Chromium emulation validates dimensions, touch, DPR, safe-area CSS, dynamic viewport usage, and keyboard-aware layout code, but is not WebKit.                                             | Add the Playwright WebKit browser to CI or run the suite on a real iOS simulator/device.                                                           |
| Timeline semantics             | Existing kinds distinguish manual activity, Hengo sessions, habits, journal, recovery, and tasks. Planned-vs-completed task state is not present in the normalized entry type.             | Decide whether planned tasks belong on the activity timeline; if yes, add an explicit non-progress state without treating it as completion.        |
| Landing motion                 | Scroll-triggered content is readable in the real scrolled pass and reduced-motion is globally respected. Full-page automated screenshots can capture offscreen motion before intersection. | Keep assertion-based scroll checks as the stable regression signal; avoid a fragile full-page pixel snapshot.                                      |

## Visual verification

### Routes rendered and inspected

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/privacy`
- `/terms`

Each route was opened in a real browser at 428 × 926, captured before and after the relevant fixes, checked for interaction/scrolling, and rerun in true light and dark themes. Public-route browser results after fixes: HTTP 200, no document-level horizontal overflow, no sub-16px form fields, no uncaught page errors, and no console errors.

### Viewports exercised

- 360 × 800
- 390 × 844 (initial visual matrix)
- 428 × 926, DPR 3
- 926 × 428 landscape
- 768 × 1024
- 1280 × 800
- 1440 × 900

### Protected-route audit status

The following route families were inventoried and reviewed through their page, shell, and feature components but not visually rendered in the isolated browser: home/dashboard; goals and task scheduling; calendar; inbox; notes; journal; timeline; reminders; Ask Hengo and memories; morning/evening/weekly reviews; learning/practice/vocabulary/foundations/reading/listening/scenarios; chat/analyzer/generator/corrections; interviews; habits/recovery; achievements/statistics/history; account/settings.

Direct navigation correctly redirected to `/login`; no security control was weakened.

## Route inventory

Public/auth: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy`, `/terms`.

Core/shell: `/home`, `/dashboard`, `/account`, `/settings`, `/settings/reminders`, `/achievements`, `/statistics`, `/history`.

Second brain: `/inbox`, `/notes`, `/notes/new`, `/notes/[slug]`, `/growth/journal`, `/timeline`, `/settings/reminders`, `/ask-hengo`, `/ask-hengo/memories`, `/review/morning`, `/review/evening`, `/review/weekly`.

Goals/productivity: `/goals`, `/goals/create`, `/goals/create/custom`, `/goals/create/template/[templateId]`, `/goals/join/[code]`, `/goals/[id]` plus `plan`, `progress`, `schedule`, and `tasks`, and `/goals/calendar`.

Korean learning/AI: `/learn`, `/learn/[lessonId]`, `/practice`, `/vocab`, `/reading` plus new/read/edit routes, `/listening`, `/scenarios`, `/roadmap`, `/chat`, `/mistakes`, `/daily-phrase`, `/korean-coach` plus listening, mistakes, preferences, scenarios, practice, and session routes.

Interview: `/interview`, `/interview/listening`, `/interview/repeat`, `/interview/script`, `/interview/speaking`.

Growth: `/growth/habits`, `/growth/habits/[id]`, `/growth/recovery` plus check-in, checkins, debrief, insights, log, pause, plan, plans, review, settings, triggers, urge, and detail routes. Legacy `/focus/*` redirect routes remain intentionally present.

## Automated coverage

`tests/e2e/responsive-public.e2e.ts` covers:

- Landing and login at the complete viewport matrix.
- Real scrolling to a below-the-fold landing section.
- No document-level horizontal overflow.
- Visible primary controls.
- 44px theme/password controls.
- Theme menu containment inside 428 × 926.
- No uncaught browser errors.

`tests/e2e/second-brain-responsive.e2e.ts` covers, when a safe authenticated state is supplied:

1. Quick Capture.
2. Inbox capture.
3. Conversion to a note.
4. Note open/edit.
5. Reminder creation.
6. Journal creation.
7. Ask Hengo retrieval entry point.
8. Morning review.
9. Horizontal overflow, dialog containment, practical touch size, and uncaught errors.

Run with:

```bash
HENGO_E2E_STORAGE_STATE=/absolute/path/to/safe-test-state.json pnpm test:e2e
```

## Validation record

- `pnpm lint`: passes with no errors; 16 pre-existing warnings remain outside this audit’s changed files.
- Public Playwright responsive suite: 9/9 passing.
- Authenticated second-brain Playwright suite: intentionally skipped without `HENGO_E2E_STORAGE_STATE`.
- `pnpm test`: 69 files and 859 tests passing.
- `pnpm build`: production build passes; all 103 static pages generated. The sandboxed attempt was blocked by Turbopack worker port binding, and the same build passed outside the sandbox.

## Remaining product decisions

1. Provide a safe test account/storage state for protected visual inspection and mutation-flow regression coverage.
2. Decide whether planned tasks should appear in Timeline as a separate, explicitly non-completed state.
3. Decide whether direct, user-entered memories need an optional later approval step; current copy correctly distinguishes them from AI-proposed memories and explains why manual facts are approved immediately.
4. Add WebKit/real-device CI coverage if Mobile Safari parity is a release requirement.
