# Thanh Long Market — Game Backend

Standalone real-time backend (Fastify + Socket.IO) split out of the Next.js app.
It owns the REST API, the WebSocket game streams, the bots/AI, and the phase
timers — it is the **single authoritative writer** for game state. The Next app
(`../app`) is now frontend + auth only.

## Architecture

- **Reuses the domain layer in place.** The server imports `../app/src/lib/**`
  and the generated Prisma client via the tsconfig path alias `@/* → ../app/src/*`.
  No domain code was duplicated or moved.
- **Auth:** verifies the Auth.js (NextAuth v5) session JWT with the shared
  `AUTH_SECRET` — from the cookie (same-origin / same-site) or an
  `Authorization: Bearer` / socket `auth.token`. Login itself still happens in the
  Next app (Phase 1).
- **Realtime:** Socket.IO replaces the old SSE routes. Per-socket subscriptions
  emit `update` (raw `GameEvent`) + a debounced, per-user projected `snapshot`,
  driven by the existing `events.ts` Redis bus (which also fans out across
  instances). Home dashboard rides `home:subscribe` → `home:snapshot`.
- **Presence:** `heartbeat()` on connect + a periodic client `heartbeat` event;
  the `lastSeenAt` staleness model (grace / bot-takeover) is unchanged.

## Endpoints

- `GET /api/health` — liveness/readiness.
- REST: `/api/sessions/**`, `/api/me/**` (ported from the Next API routes).
- Socket.IO at `/socket.io`. Client events: `session:subscribe` /
  `session:unsubscribe` / `home:subscribe` / `home:unsubscribe` / `heartbeat`.
  Server events: `snapshot`, `update`, `home:snapshot`, `session:error`.

## Run locally

```bash
# From repo root: start Postgres + Redis (optional — falls back to in-memory bus)
cd app && docker compose up -d db redis

# Backend (reads ../app/.env for AUTH_SECRET/DATABASE_URL/… + ./.env overrides)
cd ../server && bun install && bun run dev      # http://localhost:4000

# Frontend — set app/.env.local: NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
cd ../app && bun dev                            # http://localhost:3000
```

`localhost:3000 → localhost:4000` is **same-site**, so the Auth.js cookie flows
with `credentials: include`. In production the ingress serves the app and the
backend under one host (`/api`, `/socket.io` → backend), so it is same-origin.

## Env

See `.env.example`. Key vars: `AUTH_SECRET` (must match the Next app),
`DATABASE_URL`, `REDIS_URL` (optional single-replica), `CORS_ORIGINS`,
`SERVER_PORT`.

## Deploy

`server/Dockerfile` (build context = repo root) builds an image that contains
both `app/src` (domain lib + generated Prisma) and `server/src`. The k8s manifests
live in `medifab/src/infra/clusters/templates/thanh-long-backend` and deploy into
the existing `medifab-thanh-long` namespace, reusing the `thanh-long-env` secret.
Keep **one replica** until timers/bots are moved behind leader election.
