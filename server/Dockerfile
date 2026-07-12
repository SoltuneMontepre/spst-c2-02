# syntax=docker/dockerfile:1
# Thanh Long Market — standalone game backend (Fastify + Socket.IO).
# Build context = repo root (spst-c2-02): the backend reuses app/src/lib and the
# generated Prisma client in place, so both app/ and server/ must be present.
#
#   docker build -f server/Dockerfile -t soltunemontepre/thanh-long-backend .

FROM oven/bun:1.2 AS base
WORKDIR /repo

# ── App dependencies (needed for the domain lib + Prisma generate) ──
COPY app/package.json app/bun.lock* app/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    cd app && bun install --frozen-lockfile

# ── Generate the Prisma client into app/src/generated/prisma ──
COPY app/prisma app/prisma
COPY app/prisma.config.ts app/tsconfig.json app/
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN cd app && bunx prisma generate

# ── Server dependencies ──
COPY server/package.json server/bun.lock* server/
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked \
    cd server && bun install --frozen-lockfile

# ── Source ──
COPY app/src app/src
COPY server/src server/src
COPY server/tsconfig.json server/

WORKDIR /repo/server
ENV NODE_ENV=production
ENV SERVER_PORT=4000
ENV SERVER_HOST=0.0.0.0
EXPOSE 4000

# Run TypeScript directly with Bun (no separate build step).
CMD ["bun", "src/index.ts"]
