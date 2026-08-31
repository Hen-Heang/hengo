# HANDOFF

Read this file first in any new session, before exploring the repo. It is a
live snapshot, not a log — overwrite it as state changes. Older context lives
in `HANDOFF_HISTORY.md`; only open that file if you need history older than
what's summarized below.

## Snapshot

- **Updated:** 2026-08-31
- **Branch:** `feat/hengo-v2-korean-focus` (8 commits ahead of `main`, not pushed)
- **Last commit:** 1f55db3 — docs: document hengo v2 product direction

## Current focus

**Hengo V2 — focused Korean learning.** All 8 implementation phases are
complete and committed locally. See `docs/HENGO_V2.md` for the full product
direction, hidden-V1 list, and architecture decisions.

## Blocked — needs the user

Pushing the branch and opening the PR failed: the stored GitHub token is
invalid (`gh auth status` → "The token in keyring is invalid"). The user
needs to run `gh auth login -h github.com` themselves, then:

```bash
git push -u origin feat/hengo-v2-korean-focus
gh pr create --base main --head feat/hengo-v2-korean-focus \
  --title "feat: Hengo V2 focused Korean learning experience"
```

Do not merge the PR automatically — the user asked for it to be prepared only.

## Next steps

- Push + open the PR once auth is restored.
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
- Uncommitted on this branch (deliberately, unrelated to V2): `HANDOFF.md`,
  `HANDOFF_HISTORY.md`, `.claude/agents/`, and an `AGENTS.md` edge — repo
  tooling from the same session, kept out of the V2 PR.
