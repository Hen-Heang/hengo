# HANDOFF

Read this file first in any new session, before exploring the repo. It is a
live snapshot, not a log — overwrite it as state changes. Older context lives
in `HANDOFF_HISTORY.md`; only open that file if you need history older than
what's summarized below.

## Snapshot

- **Updated:** 2026-09-22
- **Branch:** `main` (synced with `origin/main`)
- **Last commit:** f629870 — Merge pull request #25 from Hen-Heang/docs/handoff-post-api-removal
- **Working tree:** clean apart from untracked `.ax/` and `.claude/*` (AX
  harness install, not part of this work)

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

PR #24 was merged into `main` on 2026-09-22 with all checks green (Lint &
Format, Test, Build Verification, Vercel deploy), followed by PR #25 (handoff).
All 11 leftover branches were then deleted — nine merged, plus
`feat/social-awareness-study-pack` and `chore/fix-social-awareness-format`, whose
commits were unmerged but whose content was already on `main` via `9a89437` (the
only difference was a stale Prettier wrapping that would have failed
`format:web:check`). `main` is now the only branch, local and remote.

## Vercel follow-up (2026-09-22, no repository change)

The cleanup continued outside the repo, in the `hen-heangs-projects/koriai-frontend`
Vercel project:

- `apps/web` is now linked to that project (`apps/web/.vercel/`, gitignored), and
  `apps/web/.env.local` holds a Production pull. Without it the app failed at boot
  with "Supabase is not configured" — the Supabase variables are **Production-scoped
  only**, so Development had nothing to give.
- **25 dead variables deleted** from Production and Preview (49 entries total),
  all Railway/Spring-era with zero references in `apps/web`:
  `SPRING_DATASOURCE_{URL,USERNAME,PASSWORD}`,
  `LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_BOOT_AUTOCONFIGURE`, `JAVA_TOOL_OPTIONS`,
  `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, `DB_{URL,USERNAME,PASSWORD}`,
  `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`, `POSTGRES_{DB,USER,PASSWORD}`,
  `PG{HOST,PORT,USER,PASSWORD,DATABASE,DATA}`, `DATABASE_PUBLIC_URL`,
  `SSL_CERT_DAYS`, `GOOGLE_CLIENT_IDS`, `APP_FRONTEND_BASE_URL`,
  `NEXT_PUBLIC_API_BASE_URL`. Verified absent afterwards; 43 rows remain.
- `vercel env rm <NAME> --yes` fails with `multiple_envs` when a name exists in
  more than one environment — pass the target explicitly
  (`vercel env rm <NAME> production --yes`).

## Next steps

- **Railway:** the service whose Root Directory was `/apps/api` no longer has a
  source here. Delete it or repoint it at `Hen-Heang/hengo-api` so it stops
  deploying a stale image.
- **Preview deploys are still broken:** `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist only in Production, so every PR
  preview hits the same "Supabase is not configured" error. Copy both to Preview.
- Undecided, left in place deliberately: `VAPID_{PRIVATE_KEY,PUBLIC_KEY,SUBJECT}`
  and `TELEGRAM_WEBHOOK_SECRET` have no `apps/web` references but delivery runs in
  Supabase Edge Functions, so they may be Spring-era leftovers or may not.
  `DATABASE_URL` / `DATABASE_URL_UNPOOLED` have per-git-branch Preview copies and
  look integration-managed — disconnect the integration rather than deleting rows.
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
