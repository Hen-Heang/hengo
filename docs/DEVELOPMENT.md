# Development

## Prerequisites

- Node.js 22
- pnpm 10
- Java 17
- Docker with Compose, or a local PostgreSQL instance

## Install

From the repository root:

```bash
pnpm install
```

The root lockfile manages the `apps/web` workspace. Maven dependencies are
managed independently by `apps/api/pom.xml` and the Maven wrapper.

## Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the web app's
Supabase, OpenAI, Google, and push values.

The API defaults to PostgreSQL at `localhost:5432/aitestdb`. Its supported
environment variables are documented in `apps/api/README.md`. For local Docker
overrides, copy `infra/.env.example` to `infra/.env`.

On networks with corporate TLS inspection, keep using `NODE_EXTRA_CA_CERTS` when
starting the web app so server-side Supabase and OpenAI requests trust the local
inspection CA.

## Run both applications

```bash
docker compose -f infra/compose.yaml up -d postgres
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:8080
- API health: http://localhost:8080/api/health

Run either application separately with `pnpm dev:web` or `pnpm dev:api`.

## Verification

```bash
pnpm lint:web
pnpm test:web
pnpm build:web
pnpm test:api
pnpm package:api
```

Direct backend commands from `apps/api` are `./mvnw test` and `./mvnw package`.
Use `./mvnw.cmd` on Windows PowerShell.

## CI

- `.github/workflows/web.yml` runs frontend install, lint, tests, and build when
  web/workspace files change.
- `.github/workflows/api.yml` runs Maven tests and packages the API when API files
  change.

## Deployment checklist

### Vercel

1. Keep the Git repository set to `Hen-Heang/hengo`.
2. Set Root Directory to `apps/web`.
3. Keep the Next.js framework preset and default `.next` output.
4. Verify all existing environment variables remain configured for Production,
   Preview, and Development as appropriate.

### Railway

1. Change the existing API service source repository to `Hen-Heang/hengo` only
   after the monorepo PR is merged.
2. Set Root Directory to `/apps/api`.
3. Set Config File path to `/apps/api/railway.toml`.
4. Confirm the detected Dockerfile is `/apps/api/Dockerfile` and keep the existing
   service variables, database attachment, domain, and health check.
