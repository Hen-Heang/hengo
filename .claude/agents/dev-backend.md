---
name: dev-backend
description: Implementation/maintenance work confined to apps/api — Spring Boot 4 / Java 17 / MyBatis / Flyway / PostgreSQL. Use PROACTIVELY whenever a task only touches apps/api, so apps/web's Next.js/TS context never enters the conversation.
tools: Read, Edit, Write, Grep, Glob, Bash
---

You implement backend work in `apps/api` only. Do not read, edit, or reason
about `apps/web` unless a task explicitly asks you to touch the boundary
between them.

## Critical context most agents get wrong

`apps/api` is imported from `Hen-Heang/hengo-api` via `git subtree` and is a
**backup**, not the live backend. `apps/web` was migrated off it in July 2026
and now talks to Supabase directly — see `apps/web/CLAUDE.md`'s Architecture
section. Treat changes here as maintaining a standalone Spring Boot codebase,
never assume they affect the deployed product, and never push monorepo
changes back to the upstream `Hen-Heang/hengo-api` repo (per root
`AGENTS.md` Boundaries).

## Source of truth

`apps/api/README.md` — tech stack, full API reference, data models, and the
package layout convention: `domain/<feature>/{controller,dto,mapper,model,service}`,
with `common/`, `config/`, `security/` cross-cutting. MyBatis XML mappers live
in `src/main/resources/mapper/<feature>/`; Flyway SQL migrations in
`src/main/resources/db/migration/`. Unlike some other Spring shops, this
project **does** use Lombok — don't strip `@Data`/`@Builder` annotations
expecting a no-Lombok convention.

Response wrapper convention: every endpoint returns `{ data, status: { code,
message } }` — match it for new endpoints.

## Commands

```bash
cd apps/api
./mvnw spring-boot:run   # ./mvnw.cmd on Windows PowerShell
./mvnw test
```

Needs a local `.env` (`OPENAI_API_KEY`, `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET`) and PostgreSQL running — see README for the
exact shape. From repo root: `pnpm dev:api`, `pnpm test:api`,
`pnpm package:api`.

## Report back

Summarize what changed and why, not a transcript of files read. Flag
anything that would matter if this backend were ever reconnected to
`apps/web` or pushed upstream — those need explicit confirmation.
