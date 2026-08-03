# Hengo monorepo

This repository contains both Hengo applications while preserving the original
`Hen-Heang/hengo` Git history.

## Projects

- `apps/web` — Next.js 16 frontend and its Supabase/AI route integration
- `apps/api` — Spring Boot backup API imported from `Hen-Heang/hengo-api` with
  `git subtree`
- `infra` — local PostgreSQL and API Docker Compose configuration
- `docs` — monorepo migration and development guidance

The applications remain independent. The frontend continues to use Supabase and
its Next.js AI route handlers; it is not rewired to the Spring Boot API.

## Quick start

```bash
pnpm install
docker compose -f infra/compose.yaml up -d postgres
pnpm dev
```

`pnpm dev` starts the web app on port 3000 and the Spring Boot API on port 8080.
See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for environment variables,
platform-specific commands, tests, and deployment settings.

## Root commands

```bash
pnpm dev             # web and API together
pnpm dev:web         # Next.js only
pnpm dev:api         # Spring Boot only
pnpm lint            # frontend lint
pnpm test            # frontend and backend tests
pnpm build           # frontend build and backend package
pnpm test:web
pnpm test:api
pnpm build:web
pnpm package:api
```

Project-specific documentation remains with each application:

- [Web README](apps/web/README.md)
- [API README](apps/api/README.md)
- [Migration notes](docs/MONOREPO_MIGRATION.md)
