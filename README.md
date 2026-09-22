# Hengo

This repository holds the Hengo web application and its supporting
documentation, on the original `Hen-Heang/hengo` Git history.

## Projects

- `apps/web` — Next.js 16 frontend and its Supabase/AI route integration
- `docs` — development and workflow guidance

Hengo is a client-side SPA over Supabase plus a thin set of Next.js AI route
handlers. There is no separate backend service to run.

## Quick start

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the web app on port 3000. See
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for environment variables,
platform-specific commands, tests, and deployment settings.

## Root commands

```bash
pnpm dev             # Next.js dev server
pnpm dev:web         # same, explicit
pnpm lint            # frontend lint
pnpm test            # frontend tests
pnpm build           # frontend build
pnpm test:web
pnpm build:web
```

Further documentation:

- [Web README](apps/web/README.md)
- [Hengo V2 product direction](docs/HENGO_V2.md)
- [Repository history notes](docs/MONOREPO_MIGRATION.md)
- [Notion MCP workflow](docs/NOTION_MCP.md)
