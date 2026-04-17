#!/bin/sh
set -e

echo "==> Menjalankan migrasi database..."
pnpm --filter @workspace/db push --force || echo "[WARN] Migrasi gagal, lanjut start server..."

echo "==> Menjalankan server..."
exec node --enable-source-maps /app/server/dist/index.mjs
