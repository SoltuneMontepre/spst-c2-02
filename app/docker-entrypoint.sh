#!/bin/sh
set -e

echo "Applying database migrations…"
cd /opt/prisma-migrate
node ./node_modules/prisma/build/index.js migrate deploy

cd /app
exec node server.js
