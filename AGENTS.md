# AGENTS.md

## Session continuity

Read `HANDOFF.md` first, before exploring the repo — it's a live snapshot of
current focus, recent changes, and open items. Only read `HANDOFF_HISTORY.md`
if older context is actually needed (its latest five entries are usually
enough).

Before ending a session that changed meaningful state, move `HANDOFF.md`'s
current content into a new dated entry at the top of `HANDOFF_HISTORY.md`,
then overwrite `HANDOFF.md` with the new snapshot.

## Repository

Hengo is a monorepo containing two independent applications:

- `apps/web`: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- `apps/api`: Spring Boot 4, Java 17, Maven, MyBatis, PostgreSQL

Read the instructions nearest to the files being changed. The frontend has
additional instructions in `apps/web/AGENTS.md`. The imported API currently has
no nested `AGENTS.md`.

## Commands

Use pnpm for repository and frontend commands.

```bash
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm lint
pnpm test
pnpm build
pnpm test:web
pnpm test:api
pnpm build:web
pnpm package:api
```

Run Maven directly from `apps/api` when needed:

```bash
./mvnw test
./mvnw package
```

On Windows PowerShell, use `./mvnw.cmd` instead.

## Which agent to delegate to

Four scoped subagents live in `.claude/agents/`, so a task doesn't have to
load both stacks' context into one conversation:

| Task touches | Agent | Notes |
| --- | --- | --- |
| `apps/web` only | `dev-frontend` | Next.js/TS/Supabase/AI routes |
| `apps/api` only | `dev-backend` | Spring Boot/MyBatis — imported backup, not the live backend |
| Supabase schema/RLS/migrations | `db-meta-manager` | Live, Orbit-shared database — confirm before applying |
| Reviewing a diff/PR before merge | `mr-reviewer` | Hengo-specific boundary checks, read-only |

For anything crossing both apps, or general repo work, stay in the main
session rather than forcing it into one scoped agent.

## Boundaries

- Do not connect `apps/web` to `apps/api` unless explicitly requested. The web
  app continues to use Supabase and Next.js AI routes.
- Keep frontend domain calls in `apps/web/lib/api`.
- Keep reusable frontend primitives generic in `apps/web/components/ui`.
- Recovery features must remain domain-neutral; never name a specific
  compulsive behavior in code, copy, tests, seed data, comments, or commits.
- `apps/web/dev-learning-notes` is an unrelated embedded project; do not wire it
  into Hengo.
- The upstream `Hen-Heang/hengo-api` repository is a backup. Do not push
  monorepo changes to it.

## Deployment layout

- Vercel project Root Directory: `apps/web`
- Railway service Root Directory: `/apps/api`
- Railway Config File path: `/apps/api/railway.toml`
- Docker build context: `apps/api`
