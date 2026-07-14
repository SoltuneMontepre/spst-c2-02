#!/bin/sh
set -e

echo "Applying database migrations…"
cd /repo/app
bunx prisma migrate deploy

cd /repo/server
exec bun src/index.ts
