# AGENTS.md

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
