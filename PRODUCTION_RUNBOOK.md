# Nizam-ERP — Production Deployment Runbook

This document describes a recommended, reproducible process to build, migrate, and deploy the `nizam-erp` application to production. It covers both a CI-driven approach (preferred) and a Docker Compose based approach (convenient for testing or simple deployments).

Keep secrets (DB credentials, JWT secret) out of the repository. Use your cloud provider's secret manager, environment variables, or Docker secrets.

---

## Key files referenced

- `apps/nizam-erp/src/main-data-source.ts` — TypeORM DataSource for main DB (supports TS and compiled JS migration globs).
- `apps/nizam-erp/src/tenant-data-source.ts` — TypeORM DataSource for tenant DBs (supports TS and compiled JS migration globs).
- `apps/nizam-erp/src/scripts/migrate-runner.ts` — Programmatic migration runner that applies main migrations and then per-tenant migrations.
- `Dockerfile` — Multi-stage Dockerfile that builds, runs migrations, and starts the app.
- `docker-compose.prod.yml` — Production compose file that starts Postgres and the app container.
- `apps/nizam-erp/src/migrations/` — Generated migration files (main and tenant folders).

---

## Prerequisites

- Node.js 18+ (for local/CI build)
- npm (for dependency install and scripts)
- Docker & docker-compose (for containerized deployments)
- Access to production Postgres instance (or a host capable of running Postgres container)
- Secrets management: ensure the following environment variables are available to the deployment environment:
  - DB_HOST
  - DB_PORT
  - DB_USER
  - DB_PASSWORD
  - DB_NAME
  - JWT_SECRET
  - NODE_ENV=production

---

## Recommended high-level flow (preferred)

1. Build artifact in CI.
2. Run main DB migrations (CI job with production DB credentials).
3. Run tenant migrations (CI job or migration-runner against production DB). This is required for existing tenants.
4. Deploy image / run container(s).
5. Run smoke tests.

This flow avoids unexpected schema changes during runtime and gives you control over migration application.

---

## Detailed steps

### 1 — Prepare secrets and environment

Create a `.env.production` locally for testing (do NOT commit). In production, inject secrets via your orchestrator.

Example `.env.production` (DO NOT COMMIT):

```powershell
DB_HOST=postgres.example.internal
DB_PORT=5432
DB_USER=nizam
DB_PASSWORD=very_secure_password
DB_NAME=nizam_main
JWT_SECRET=REPLACE_WITH_SECURE_RANDOM
NODE_ENV=production
```

---

### 2 — Build (CI or local build server)

Run these steps in CI or on a build host. This builds the compiled `dist/` output used in production images.

```powershell
npm ci
npm run build:nizam-erp
```

Outputs: `dist/apps/nizam-erp/*` (compiled server) and compiled migration JS files under `dist/.../migrations`.

---

### 3 — Run main migrations (CI job — recommended)

Option A — Run migrations using ts-node (CI runner with node + ts-node):

```powershell
# Ensure DB_ envs are available in CI job
npm run migrate:run:main
```

Option B — Run compiled migration-runner (if you prefer compiled JS):

```powershell
# After `npm run build:nizam-erp` in CI
node dist/apps/nizam-erp/src/scripts/migrate-runner.js
```

What this does:
- Applies main DB migrations (files in `dist/.../migrations/main` when compiled).
- The `migrate-runner` then enumerates tenant rows and applies tenant migrations per tenant DB. If you want to only run main migrations in CI, call the TypeORM CLI directly against `main-data-source.ts`.

---

### 4 — Run tenant migrations (if separate from main job)

If you prefer to run tenant migrations in a separate job (e.g., to control rollout per-tenant), you can call the migration-runner with a tenant filter (see follow-ups) or rely on the programmatic runner to iterate tenants.

Basic command (runner will iterate all tenants listed in the `tenant` table):

```powershell
node dist/apps/nizam-erp/src/scripts/migrate-runner.js
```

Notes:
- The runner queries `SELECT db_name FROM tenant` — if your tenant table differs, update the runner accordingly.
- For a single-tenant migration, modify the runner or run an ad-hoc TypeORM `migration:run` against the specific tenant DB by setting the `database` property in a transient DataSource.

---

### 5 — Build and publish Docker image (CI)

Recommended: build a Docker image in CI after successful migrations, push to registry, then deploy.

Example (CI job):

```powershell
# Build image
docker build -t ghcr.io/<org>/nizam-erp:${{ github.sha }} .
# Push
docker push ghcr.io/<org>/nizam-erp:${{ github.sha }}
```

CI should NOT run the runtime migrations as part of container start; instead run the migration-runner in a controlled job before or as a dedicated migration step.

---

### 6 — Deploy using docker-compose (simple) or orchestrator

Using provided `docker-compose.prod.yml` (for small deployments / testing):

```powershell
# Use .env.production at repo root or set env_file path in compose
docker compose -f docker-compose.prod.yml up --build -d
```

What the compose file does:
- Starts a Postgres container (service `db`).
- Builds and starts the `app` container using the `Dockerfile`.
- The `Dockerfile` runner stage runs the compiled `migrate-runner` and then starts the compiled app.

Notes for orchestrator (Kubernetes, ECS, etc.):
- Use the CI-built image and deploy it to task/pod that has access to production DB and secrets.
- Run `node dist/apps/nizam-erp/src/scripts/migrate-runner.js` as a pre-deploy or one-off job to apply migrations.

---

### 7 — Verify and smoke tests

After the app starts, run a quick smoke test using the Postman collection in `assets/postman/nizam-erp.collection.json` or minimal curl checks below.

Example smoke checks (PowerShell):

```powershell
# Replace <HOST> if not localhost
$base = 'http://localhost:3000/api'
# Health (root API or a simple endpoint)
Invoke-WebRequest -Uri "$base" -UseBasicParsing
# Register -> Login -> Profile flows using the Postman collection are recommended.
```

Check logs for migration output and server readiness:

```powershell
docker compose -f docker-compose.prod.yml logs -f app
```

---

## Rollback plan

1. If migration introduced breaking changes, restore DB from backup/snapshot taken before migrations.
2. Redeploy previous application image that matches the schema at rollback point.
3. Re-run migrations or corrective scripts as needed.

Always take DB backups before running production migrations.

---

## Troubleshooting

- ECONNREFUSED connecting to Postgres:
  - Confirm `DB_HOST` and `DB_PORT` are correct and DB accepts connections from the host.
  - If using Docker locally, confirm port mapping and that Postgres container is healthy.

- Password authentication failed:
  - Use the same user and password that the DB was initialized with. If you used `POSTGRES_USER` in the container, that is the initial superuser for the DB.

- Migrations not found at runtime:
  - Confirm compiled migration JS files exist under `dist/.../migrations`. Adjust `main-data-source.ts` / `tenant-data-source.ts` globs if your build layout differs.

---

## Security checklist

- Do not commit `.env.production`.
- Use secret storage for DB credentials and JWT secret.
- Restrict DB network access to only allowed hosts (app instances, CI runner IPs if needed).
- Run migrations in a controlled, auditable CI job.

---

## Helpful commands (PowerShell)

Build and run locally (dev):

```powershell
npm ci
npm run build:nizam-erp
node dist/apps/nizam-erp/main.js
```

Run migrations (compiled runner):

```powershell
node dist/apps/nizam-erp/src/scripts/migrate-runner.js
```

Docker compose (prod):

```powershell
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml logs -f app
```

Revert (stop compose):

```powershell
docker compose -f docker-compose.prod.yml down
```

---

## Follow-ups you can ask me to implement

- Add a GitHub Actions workflow that builds the image, runs migrations (against a staging DB) and pushes the image (template with required secrets).
- Modify the `migrate-runner` to accept a single-tenant filter and add an npm script to run migrations for a specified tenant.
- Create a small smoke-test script that uses the Postman collection to validate a deployed instance.

Tell me which follow-up you want and I'll implement it next.

---

## Recent progress (2025-11-01)

- Migration work: replaced `synchronize: true` usage with a migration-first approach. Generated and wired TypeORM migrations for both the main DB and tenant DBs.
- Data sources: added and configured `apps/nizam-erp/src/main-data-source.ts` and `apps/nizam-erp/src/tenant-data-source.ts` to point at compiled JS and TS migration globs.
- Runner: enhanced `apps/nizam-erp/src/scripts/migrate-runner.ts` with CLI options (--tenant, --tenant-id, --main-only, --skip-main, --dry-run) so migrations can be run for all tenants, a single tenant, or only main DB; dry-run uses TypeORM's `showMigrations` semantics.
- Build & validation: ran TypeScript checks and an `nx build` — the project builds successfully and compiled migrations are available under `dist/.../migrations`.
- Deployment artifacts: added a multi-stage `Dockerfile`, `docker-compose.prod.yml`, and a CI workflow template to build the image and run migrations in CI (needs secrets configured).

Notes & next steps:

- Review the generated migration files (main and tenant) before applying to production; verify DDL and indexes.
- Configure CI secrets (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET) and decide whether to run tenant migrations in the same CI job as main migrations or in a separate, controlled job.
- Recommended safety: add a pre-migration DB backup/snapshot step in CI or extend the runner with an optional `--backup` flag (can be implemented on request).

This section was appended automatically on 2025-11-01 to track the recent migration and production-readiness work.
