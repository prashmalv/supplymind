#!/bin/sh
# Container startup: apply migrations, optionally seed, then run the API.
# A script (single-token path) avoids the shell-quoting issues of passing a
# multi-word command through the node image's exec-form entrypoint.
cd /repo/apps/api

echo "[start] running prisma migrate deploy..."
pnpm exec prisma migrate deploy || echo "[start] WARNING: migrate deploy failed"

if [ "$RUN_SEED" = "true" ]; then
  echo "[start] seeding..."
  pnpm exec ts-node prisma/seed.ts || echo "[start] WARNING: seed failed"
fi

echo "[start] starting API..."
exec node dist/main.js
