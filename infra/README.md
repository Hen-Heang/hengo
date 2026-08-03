# Local infrastructure

Start only PostgreSQL when running both applications from the repository root:

```bash
docker compose -f infra/compose.yaml up -d postgres
pnpm dev
```

Build and run the imported API in Docker with PostgreSQL:

```bash
docker compose -f infra/compose.yaml up --build api
```

The API image uses `apps/api` as its Docker build context, matching the Railway
service root. Copy `infra/.env.example` to `infra/.env` if you want to override
the local defaults. Do not use the development credentials in a deployment.
