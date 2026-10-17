#!/bin/sh
set -e
cd /pb
# Superuser idempotente desde variables de entorno (Coolify → envs).
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASS" ]; then
  ./pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASS" >/dev/null 2>&1 || true
fi
exec ./pocketbase serve --http 0.0.0.0:8090
