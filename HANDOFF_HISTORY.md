# HANDOFF HISTORY

Append-only log, newest entry first. Read only the latest five entries
unless a task genuinely needs older context — this file exists so old
handoffs aren't lost, not so every session has to read all of them.

Each time `HANDOFF.md` is overwritten with new "Current focus" content, move
its old content here as a dated entry before overwriting.

---

## 2026-08-31 (d)

### Snapshot

- **Branch:** `main` (aligned with `origin/main`)
- **Last commit:** 48ef886 — update new logo

### Current focus

**Repository and branch cleanup was complete.** PRs #1 through #14 were all
merged, including Hengo V2 in PR #13 and the workflow tooling in PR #14. No open
or draft PRs remained.

The remote branch list had been reduced from 19 branches to three intentional
ones: `main`, `archive/hengo-v1-2026-08-31` (V1 snapshot), and
`v0/hen-heang-12e5395f` (one unique unmerged commit touching three root-level
chat components). Sixteen merged, superseded, or duplicate remote branches were
deleted, and a stale local tracking ref for the already-deleted PR #1 branch was
pruned.

### Working tree at the time

- A pre-existing staged formatting/tooling change set of 616 files (21,253
  insertions, 9,661 deletions) covering Prettier configuration, a composite
  GitHub Action, workflow edits, package changes, and broad formatting. It was
  to be preserved and reviewed before committing.
- GitHub CLI authentication was still invalid, though authenticated Git
  operations worked.

### Next steps at the time

- Review and test the staged 616-file formatting/tooling change set before
  committing it. *(Resolved 2026-09-03: landed as 2d4106d "add new ci",
  618 files, 21,327 insertions, 9,680 deletions.)*
- Decide whether `v0/hen-heang-12e5395f` was still valuable — 215 commits behind
  `main`, but its single commit was never merged. *(Still open.)*
- Optionally rewrite `apps/web/docs/navigation-shell-audit.md`, marked
  superseded but not rewritten. *(Still open.)*
- `lib/learning/corrections.test.ts` failed on a hardcoded date aged past
  "today", pre-existing and unrelated to V2. *(Still open.)*

## 2026-08-31 (c)

### Snapshot

- **Branch:** `feat/hengo-v2-korean-focus` (8 commits ahead of `main`, not
  pushed at the time)
- **Last commit:** 1f55db3 — docs: document hengo v2 product direction

### Current focus

**Hengo V2 — focused Korean learning.** All 8 implementation phases were
complete and committed locally. `docs/HENGO_V2.md` held the full product
direction, hidden-V1 list, and architecture decisions.

### Blocked at the time

Pushing the branch and opening the PR had failed because the stored GitHub CLI
token was invalid. The intended commands after re-authentication were:

```bash
git push -u origin feat/hengo-v2-korean-focus
gh pr create --base main --head feat/hengo-v2-korean-focus \
  --title "feat: Hengo V2 focused Korean learning experience"
```

The user had asked for the PR to be prepared only, not merged automatically.

### Next steps at the time

- Push and open the PR once authentication was restored.
- Optionally rewrite `apps/web/docs/navigation-shell-audit.md`, which was
  marked superseded.
- A pre-existing `lib/learning/corrections.test.ts` test failed because its
  hardcoded date had aged past "today"; the V2 branch had not touched it.

### Notes

- The apps remain independent: `apps/web` uses Next.js/Supabase, while
  `apps/api` is an imported Spring Boot/MyBatis backup and is not the live
  backend.
- **V2 rule: hide, don't delete.** V1 routes, components, and tables remained
  available by direct URL; `primaryNavItems` in `lib/navigation.ts` controlled
  visibility.
- jsdom suites on Node 25 required
  `NODE_OPTIONS=--no-experimental-webstorage`.
- Repo tooling files were deliberately kept outside the V2 PR at that point.

## 2026-08-31 (b)

- Repo was clean on `main`, no active task. Superseded by the Hengo V2 work
  below on the same day.

## 2026-08-31 (a)

- Set up the HANDOFF.md / HANDOFF_HISTORY.md session-continuity pattern for
  this repo, adapted from a Claude Code workflow reviewed in an external
  Notion guide. No code changes.
