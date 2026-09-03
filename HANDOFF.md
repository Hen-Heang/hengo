# HANDOFF

Read this file first in any new session, before exploring the repo. It is a
live snapshot, not a log — overwrite it as state changes. Older context lives
in `HANDOFF_HISTORY.md`; only open that file if you need history older than
what's summarized below.

## Snapshot

- **Updated:** 2026-09-03
- **Branch:** `main` (aligned with `origin/main`)
- **Last commit:** 2d4106d — add new ci

## Current focus

**Supabase performance audit and RLS cleanup.** The live `hengo` project
(`dnzqgnejwyucenghugrb`, ap-northeast-2) was audited with the Supabase MCP
advisors. Performance lints went from **91 to 65**: `auth_rls_initplan` (10) and
`multiple_permissive_policies` (16) are now both at zero.

One migration was applied and mirrored into the repo as
`apps/web/supabase/migrations/20260903013902_perf_rls_policy_consolidation.sql`:

1. Dropped the legacy `<table>_owner` policies on `kori_focus_habits`,
   `kori_focus_triggers`, `kori_focus_events`, and `kori_focus_plans`. Each was
   a permissive `ALL` policy on role `public` layered *underneath* the
   per-action policies from `20260719045208_recovery_workspace`, so every
   statement evaluated the same ownership predicate twice. Access is unchanged:
   that migration had deliberately added a **restrictive** `<table>_owner_guard`
   over them, and a restrictive policy is ANDed, so the guard was already the
   binding constraint.
2. Rebuilt the remaining bare `auth.uid()` policies as `(select auth.uid())` on
   `kori_habits`, `kori_habit_checkins`, `kori_interview_attempts` (×3), and
   `kori_google_calendar_integrations`. Roles and predicates were preserved
   exactly; `kori_interview_attempts` stays append-only with no UPDATE policy.
3. Pinned `search_path` on `public.kori_next_reminder_run`.

Verified afterwards: no bare `auth.uid()` remains in those policies, each focus
table has exactly 5 policies (4 per-action + 1 restrictive guard), and
`lib/recovery-security.test.ts` passes 6/6.

## Working tree

- Untracked and uncommitted: the new migration file
  `apps/web/supabase/migrations/20260903013902_perf_rls_policy_consolidation.sql`.
  It is already applied to the live database; only the repo copy is unstaged.
- The previously staged 616-file formatting/tooling change set has landed as
  commit 2d4106d ("add new ci", 618 files).
- GitHub CLI authentication may still be invalid. Run
  `gh auth login -h github.com` before relying on `gh`; authenticated Git
  operations work regardless.

## Next steps

- Commit the new migration file.
- **Deliberately not done:** 46 unused-index and 19 unindexed-foreign-key lints
  remain, and were left alone on purpose. The largest table is 2,917 rows /
  976 kB and the whole database is a few MB, so "unused" means never-queried-yet
  rather than useless. Revisit once a table crosses roughly 100k rows.
- Open security advisories needing a human decision: `vector` and `pg_net` are
  installed in the `public` schema (risky to move), and leaked-password
  protection is off (a dashboard toggle).
- Still open from earlier sessions: decide whether `v0/hen-heang-12e5395f` is
  worth keeping; optionally rewrite the superseded
  `apps/web/docs/navigation-shell-audit.md`; and
  `lib/learning/corrections.test.ts` still fails on a hardcoded date that has
  aged past "today".

## Notes for future sessions

- Two independent apps: `apps/web` (Next.js/Supabase) and `apps/api` (Spring
  Boot/MyBatis, an imported backup — not the live backend).
- **V2 rule: hide, don't delete.** Every V1 route/component/table still exists
  and works by direct URL; only `primaryNavItems` in `lib/navigation.ts` decides
  what's visible. Don't read "not in the nav" as "safe to delete".
- **`apps/web/supabase/migrations/` is not the source of truth for the schema.**
  It only covers 2026-07-19 onward, its version timestamps differ from the live
  ledger for the same migrations (repo `20260719045208_recovery_workspace` vs
  live `20260719234220`), and three weather/interview content migrations
  (`20260812030000`, `20260813083000`, `20260814004500`) are absent from
  `supabase_migrations.schema_migrations` even though their effects are in the
  data — they were applied by direct SQL. The ledger was left unrepaired on
  purpose: re-running them is harmless (idempotent and ordered so the final
  wording wins), whereas recording them wrongly would make a real migration
  silently never run. Query the live database to learn actual schema state.
- A migration applied through Supabase MCP `apply_migration` gets a
  server-generated version; rename the repo file to match it afterward.
- Running jsdom test suites on Node 25 needs
  `NODE_OPTIONS=--no-experimental-webstorage`.
