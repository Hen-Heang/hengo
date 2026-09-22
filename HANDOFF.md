# HANDOFF

Read this file first in any new session, before exploring the repo. It is a
live snapshot, not a log — overwrite it as state changes. Older context lives
in `HANDOFF_HISTORY.md`; only open that file if you need history older than
what's summarized below.

## Snapshot

- **Updated:** 2026-09-22
- **Branch:** `chore/remove-spring-api` (branched from `fix/local-test-env`)
- **Last commit:** 1641976 — fix(web): stop Node 24+ Web Storage from breaking the jsdom tests
- **Working tree:** the backend removal below is staged/unstaged, **not committed**

## Current focus

**The Spring Boot backend was removed so the repository is frontend-only.**
The project's focus is `apps/web`; `apps/api` had been an unused subtree import
(untouched since `f51e4d5`, 2026-08-03) that still slowed down every root
workflow.

Removed:

- `apps/api/` — 348 tracked files, including 11 committed junk files
  (`boot-8080*.log` ×6, `run.log`, `boot-test-err.log`, `java-run.args`,
  `java-test.args`, `sql-practice/practice.sql`). Only local dev values were in
  those logs, no production secrets.
- `.github/workflows/api.yml` — Maven tests + Docker image build.
- `scripts/maven.mjs` and `scripts/dev.mjs` (the `scripts/` directory is gone).
- `infra/` — its Compose stack only existed to serve the Spring app; the web app
  uses hosted Supabase.
- `.claude/agents/dev-backend.md`.

Rewired: root `package.json` (`dev`/`test`/`build` are now frontend-only, and
`dev:api`/`test:api`/`package:api` are gone), `README.md`, `AGENTS.md`,
`docs/DEVELOPMENT.md`, `docs/MONOREPO_MIGRATION.md` (now a history +
recovery note), `docs/NOTION_MCP.md`, `apps/web/docs/chatgpt-mcp-integration.md`,
and the three remaining subagent definitions.

The backend is recoverable from this repo's git history
(`git show f51e4d5:apps/api/...`) and from the untouched `Hen-Heang/hengo-api`
backup repository.

## Verification

- `pnpm test` (now frontend-only) — 1129 passed, 1 failed: a 5s timeout in
  `components/layout/navigation-shell.test.tsx` "offers only Ask AI by default".
  Re-running that file alone passes 56/56, so it is a load-related flake under
  the full suite, not a consequence of this change.
- `pnpm lint` — 0 errors, 5 pre-existing `no-unused-vars` / react-hooks
  warnings.
- Repo-wide grep shows no remaining `apps/api`, `mvnw`, or `localhost:8080`
  references outside `docs/MONOREPO_MIGRATION.md` (intentional) and
  `apps/web/dev-learning-notes` (unrelated embedded project).

## Next steps

- Commit the removal and open a PR (nothing is committed yet).
- **Railway:** the service whose Root Directory was `/apps/api` no longer has a
  source here. Delete it or repoint it at `Hen-Heang/hengo-api` so it stops
  deploying a stale image.
- Optional: `.mcp.json` and `.codex/config.toml` still declare the IntelliJ IDEA
  MCP bridge (`127.0.0.1:64342`), which was mainly for Java work.
- Optional: root `supabase/seed/` duplicates the `apps/web/supabase/` layout —
  worth folding in or deleting on a future pass.

## Notes for future sessions

- One app remains: `apps/web`, Next.js/Supabase + `app/api/ai/*` routes.
- V2 features hidden from navigation are not safe to delete.
- Query live Supabase before schema claims; the repository migration folder is
  not a complete live-schema ledger.
- Running jsdom suites on Node 25 requires
  `NODE_OPTIONS=--no-experimental-webstorage`.
