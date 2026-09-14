# SupplyMind Platform

Multi-tenant AI supply-chain platform. Onboards organizations, connects their data
(SAP ECC extracts, SQL, Drive, S3/Blob), and delivers Procurement & Inventory MIS,
executive dashboards, conversational AI over their data, and exception alerts.

## Monorepo layout

```
apps/web            React 19 + Vite frontend (runs on :8444)
apps/api            NestJS backend (runs on :3001, prefix /api)
packages/shared     Shared TS types + DTOs (@supplymind/shared)
docker-compose.yml  Local Postgres (pgvector) + Redis
```

## Prerequisites

- Node 20+ and pnpm 9 (`npm i -g pnpm@9`)
- Docker Desktop (for local Postgres + Redis)

## First-time setup

```bash
pnpm install

# 1. Start the database (requires Docker Desktop running)
docker compose up -d

# 2. Configure the API
cp apps/api/.env.example apps/api/.env   # a JWT secret is pre-set for local dev

# 3. Create tables + seed the Demo Org and accounts
pnpm --filter @supplymind/api prisma:migrate   # first run: name it "init"
pnpm --filter @supplymind/api prisma:seed
```

Seeded logins (change in production):

| Account | Email | Password | Scope |
| --- | --- | --- | --- |
| Platform admin | `admin@supplymind.ai` | `ChangeMe123!` | all orgs |
| Demo org-admin | `demo@supplymind.ai` | `Demo1234!` | Demo Organization |

## Run (dev)

```bash
pnpm dev            # web (:8444) + api (:3001) together via turbo
# or individually:
pnpm dev:web        # http://localhost:8444
pnpm dev:api        # http://localhost:3001/api  (health: /api/health)
```

The web dev server proxies `/api/*` to the API.

## Deployment

Demo → Azure (Static Web App + App Service + Postgres Flexible Server + Blob +
Azure OpenAI + Key Vault). Production → client AWS (S3+CloudFront, ECS/RDS/S3,
Bedrock). The AI provider and cloud secrets/storage are pluggable via config
(`AI_PROVIDER`, `CLOUD_PROVIDER`) — no code change to switch clouds.
