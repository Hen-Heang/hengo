# Development

## Prerequisites

- Node.js 22
- pnpm 10

## Install

From the repository root:

```bash
pnpm install
```

The root lockfile manages the `apps/web` workspace.

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the web app's
Supabase, OpenAI, Google, and push values. Data and auth live in the hosted
Supabase project, so no local database is required.

On networks with corporate TLS inspection, keep using `NODE_EXTRA_CA_CERTS` when
starting the web app so server-side Supabase and OpenAI requests trust the local
inspection CA.

## Run the app

```bash
pnpm dev
```

- Web: http://localhost:3000

## Verification

```bash
pnpm lint:web
pnpm format:web:check
pnpm test:web
pnpm build:web
```

## CI

- `.github/workflows/web.yml` runs frontend install, lint, format check, tests,
  and build when web/workspace files change.

## Deployment checklist

### Vercel

1. Keep the Git repository set to `Hen-Heang/hengo`.
2. Set Root Directory to `apps/web`.
3. Keep the Next.js framework preset and default `.next` output.
4. Verify all existing environment variables remain configured for Production,
   Preview, and Development as appropriate.

Vercel is the only deployment target. The Railway service that built the former
`apps/api` no longer has a source in this repository — see
[MONOREPO_MIGRATION.md](MONOREPO_MIGRATION.md).
