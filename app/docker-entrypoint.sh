#!/bin/sh
set -e

if [ "${SKIP_MIGRATIONS:-}" != "1" ]; then
  if [ -n "${DIRECT_URL:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
    echo "Running prisma migrate deploy..."
    prisma migrate deploy
    echo "Migrations up to date."
  else
    echo "SKIP: no DIRECT_URL/DATABASE_URL — migrations not run."
  fi
fi

exec node server.js
