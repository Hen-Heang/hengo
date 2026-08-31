# HANDOFF

Read this file first in any new session, before exploring the repo. It is a
live snapshot, not a log — overwrite it as state changes. Older context lives
in `HANDOFF_HISTORY.md`; only open that file if you need history older than
what's summarized below.

## Snapshot

- **Updated:** 2026-08-31
- **Branch:** `main` (aligned with `origin/main`)
- **Last commit:** 48ef886 — update new logo

## Current focus

**Repository and branch cleanup is complete.** PRs #1 through #14 are all
merged, including Hengo V2 in PR #13 and the workflow tooling in PR #14. There
are no open or draft PRs.

The remote branch list was reduced from 19 branches to these three intentional
branches:

- `main` — default branch
- `archive/hengo-v1-2026-08-31` — intentional V1 snapshot
- `v0/hen-heang-12e5395f` — old branch with one unique, unmerged commit touching
  three root-level chat components

Sixteen merged, superseded, or duplicate remote branches were deleted. A stale
local tracking ref for the already-deleted PR #1 branch was also pruned.

## Working tree

- A pre-existing staged formatting/tooling change set contains 616 files
  (21,253 insertions and 9,661 deletions). It includes Prettier configuration,
  a composite GitHub Action, workflow edits, package changes, and broad
  formatting. Preserve it; the branch cleanup did not modify it.
- The handoff updates from this session are intentionally unstaged on top of
  that staged change set.
- GitHub CLI authentication is still invalid, although authenticated Git
  operations work. Run `gh auth login -h github.com` before relying on `gh`.

## Next steps

- Review and test the staged 616-file formatting/tooling change set before
  committing it.
- Decide whether the old `v0/hen-heang-12e5395f` branch is still valuable. It
  is 215 commits behind `main`, but its single commit was not merged.
- Optional follow-up: `apps/web/docs/navigation-shell-audit.md` is marked
  superseded but not rewritten.
- Pre-existing, unrelated to V2: `lib/learning/corrections.test.ts` fails on a
  hardcoded date that has aged past "today" (verified untouched by this
  branch).

## Notes for future sessions

- Two independent apps: `apps/web` (Next.js/Supabase) and `apps/api` (Spring
  Boot/MyBatis, an imported backup — not the live backend).
- **V2 rule: hide, don't delete.** Every V1 route/component/table still
  exists and works by direct URL; only `primaryNavItems` in
  `lib/navigation.ts` decides what's visible. Don't read "not in the nav" as
  "safe to delete".
- Running jsdom test suites on Node 25 needs
  `NODE_OPTIONS=--no-experimental-webstorage`.
