# SupplyMind API — NestJS + Prisma, built from the pnpm monorepo.
# Single stage keeps the generated Prisma client + engine and workspace deps in
# place (reliable with pnpm's linked node_modules). Debian bookworm = openssl 3.0,
# matching the Prisma binaryTarget "debian-openssl-3.0.x".
FROM node:20-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /repo

# Copy manifests first for better layer caching.
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN pnpm install --no-frozen-lockfile

# Copy sources and build shared, web (SPA, same-origin /api), and api.
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web

RUN pnpm --filter @supplymind/shared build \
  && pnpm --filter @supplymind/web build \
  && pnpm --filter @supplymind/api exec prisma generate \
  && pnpm --filter @supplymind/api exec nest build

WORKDIR /repo/apps/api
RUN chmod +x /repo/apps/api/start.sh

ENV NODE_ENV=production
ENV PORT=8080
# Serve the built SPA from the API (single origin).
ENV WEB_DIST_DIR=/repo/apps/web/dist
EXPOSE 8080

# start.sh applies migrations, optionally seeds (RUN_SEED=true), then starts.
# Single-token path survives the node image's exec-form entrypoint.
CMD ["/repo/apps/api/start.sh"]
