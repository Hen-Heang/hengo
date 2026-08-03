# Monorepo migration

## Result

`Hen-Heang/hengo` remains the parent repository and retains its complete history.
The `Hen-Heang/hengo-api` `main` branch was imported at `apps/api` with `git
subtree` without squashing, so its original commits remain reachable in the
combined repository.

The source API repository remains active and unchanged as a backup. No repository
was archived or deleted, and this migration does not push to `hengo-api`.

## Import command

The initial import used:

```bash
git subtree add \
  --prefix=apps/api \
  https://github.com/Hen-Heang/hengo-api.git \
  main
```

If a future API backup update must be pulled into the monorepo, review the API
diff first and then use:

```bash
git subtree pull \
  --prefix=apps/api \
  https://github.com/Hen-Heang/hengo-api.git \
  main
```

Do not push monorepo-only paths or commits back to the backup repository.

## Behavior boundaries

- The Next.js app still calls Supabase directly through `apps/web/lib/api`.
- Authentication remains Supabase Auth in the web app.
- AI remains in `apps/web/app/api/ai`.
- The imported Spring Boot application keeps its JWT/PostgreSQL implementation.
- No frontend calls were redirected to the Spring Boot API.

## Deployment directory settings

Directory roots are provider project settings, not portable repository fields:

- Vercel Root Directory: `apps/web`
- Railway Root Directory: `/apps/api`
- Railway Config File path: `/apps/api/railway.toml`

With the Railway root set to `/apps/api`, its existing `Dockerfile` is discovered
at the service root and the Docker build context contains `.mvn`, `mvnw`,
`pom.xml`, and `src` exactly as before.
