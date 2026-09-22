# Repository history: the imported Spring Boot API

## Current state

This repository contains one application, `apps/web`. There is no Spring Boot
backend in the working tree and no Java, Maven, or Docker Compose tooling at the
root.

## What happened

The `Hen-Heang/hengo-api` `main` branch was imported at `apps/api` with `git
subtree` (unsquashed, so its commits stayed reachable):

```bash
git subtree add \
  --prefix=apps/api \
  https://github.com/Hen-Heang/hengo-api.git \
  main
```

The frontend was never rewired to it — `apps/web` kept calling Supabase through
`apps/web/lib/api`, kept Supabase Auth, and kept its AI routes in
`apps/web/app/api/ai`. The import sat unchanged after `f51e4d5` (2026-08-03)
while the frontend moved on.

On 2026-09-22, with the project focused on the frontend alone, `apps/api` was
removed along with everything that existed only to serve it: the API CI
workflow, the Maven wrapper scripts, the combined dev runner, and the `infra`
Docker Compose stack (its PostgreSQL service existed only for the Spring app —
the web app uses Supabase).

## Recovering the backend

The code is not lost. Two independent copies remain:

- This repository's history — `git show f51e4d5:apps/api/pom.xml`, or
  `git log --all -- apps/api` to browse it.
- The backup repository it came from, `Hen-Heang/hengo-api`, which was never
  pushed to from here and is unchanged.

To bring it back, restore from history (`git checkout <commit> -- apps/api`) or
re-add the subtree with the command above.

## Deployment

- Vercel Root Directory: `apps/web`.
- The Railway service that ran `/apps/api` no longer has a source in this
  repository. Delete that service (or repoint it at `Hen-Heang/hengo-api`) so it
  does not keep deploying a stale image.
