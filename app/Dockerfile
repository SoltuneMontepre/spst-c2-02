# syntax=docker/dockerfile:1
# Phiên chợ giá trị — production image

# ── Install dependencies with Bun (fast resolver) ──
FROM oven/bun:1.2 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile

# ── Generate Prisma client with Bun ──
FROM oven/bun:1.2 AS prisma-gen
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN bunx prisma generate

# ── Build with Node.js (full worker_threads support) ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma-gen /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-gen /app/src/generated ./src/generated
COPY package.json bun.lock* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"

COPY . .
RUN --mount=type=cache,target=/app/.next/cache,sharing=locked \
    node ./node_modules/.bin/next build

# ── Production runner ──
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh && chown nextjs:nodejs docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
