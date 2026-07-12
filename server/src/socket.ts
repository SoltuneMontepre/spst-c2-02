// Socket.IO layer — replaces the SSE routes (/api/sessions/[id]/stream and
// /api/me/home-stream). Per-socket subscriptions mirror the old per-connection
// SSE handlers: emit `update` (raw GameEvent) immediately, then a debounced,
// per-user projected `snapshot`. Cross-instance fan-out already happens through
// the events.ts Redis bus, so each instance only serves its own sockets.

import type { FastifyInstance } from "fastify";
import { Server, type Socket } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./env";
import { userFromToken, tokenFromCookies, parseCookieHeader, type AuthedUser } from "./auth";
import { db } from "@/lib/db";
import { subscribe, subscribeHome, type GameEvent } from "@/lib/events";
import { getSnapshot, getHomeDashboard } from "@/lib/session-service";
import { heartbeat } from "@/lib/presence-service";

const SNAPSHOT_DEBOUNCE_MS = 50;
const DASHBOARD_DEBOUNCE_MS = 100;

interface SocketData {
  user: AuthedUser;
  cleanups: Map<string, () => void>; // key -> teardown (session:<id>, "home")
}

/** Replicates the /stream SSE handler for one socket + session. Returns teardown. */
async function attachSessionStream(
  socket: Socket,
  userId: string,
  sessionId: string,
): Promise<() => void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: { hostUserId: true, participants: { select: { userId: true } } },
  });
  if (!session) {
    socket.emit("session:error", { sessionId, error: "NOT_FOUND" });
    return () => {};
  }
  const isMember =
    session.hostUserId === userId ||
    session.participants.some((p) => p.userId === userId);
  if (!isMember) {
    socket.emit("session:error", { sessionId, error: "FORBIDDEN" });
    return () => {};
  }

  socket.join(`session:${sessionId}`);

  let lastDeliveredVersion = 0;
  let pendingVersion = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const pushSnapshot = async () => {
    if (closed) return;
    const minVersion = pendingVersion;
    pendingVersion = 0;
    try {
      const snapshot = await getSnapshot(userId, sessionId);
      if (closed) return;
      if (snapshot.stateVersion < minVersion && minVersion > lastDeliveredVersion) {
        pendingVersion = Math.max(pendingVersion, minVersion);
        scheduleSnapshot();
        return;
      }
      if (snapshot.stateVersion <= lastDeliveredVersion) return;
      lastDeliveredVersion = snapshot.stateVersion;
      socket.emit("snapshot", { sessionId, stateVersion: snapshot.stateVersion, snapshot });
    } catch (e) {
      socket.data.log?.error?.(`socket snapshot push failed: ${(e as Error).message}`);
    }
  };

  const scheduleSnapshot = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void pushSnapshot();
    }, SNAPSHOT_DEBOUNCE_MS);
  };

  const onEvent = (event: GameEvent) => {
    socket.emit("update", event);
    if (event.stateVersion <= lastDeliveredVersion) return;
    pendingVersion = Math.max(pendingVersion, event.stateVersion);
    scheduleSnapshot();
  };

  const unsubscribe = subscribe(sessionId, onEvent);

  // Initial snapshot (fire and forget, like the SSE handler).
  void getSnapshot(userId, sessionId)
    .then((snapshot) => {
      if (closed) return;
      lastDeliveredVersion = snapshot.stateVersion;
      socket.emit("snapshot", { sessionId, stateVersion: snapshot.stateVersion, snapshot });
    })
    .catch(() => {});

  return () => {
    closed = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubscribe();
    socket.leave(`session:${sessionId}`);
  };
}

/** Replicates the /home-stream SSE handler for one socket. Returns teardown. */
function attachHomeStream(socket: Socket, userId: string): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const push = async () => {
    if (closed) return;
    try {
      const dashboard = await getHomeDashboard(userId);
      if (closed) return;
      socket.emit("home:snapshot", { dashboard });
    } catch {
      /* transient */
    }
  };

  const schedule = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void push();
    }, DASHBOARD_DEBOUNCE_MS);
  };

  const unsubscribe = subscribeHome(userId, schedule);
  void push();

  return () => {
    closed = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubscribe();
  };
}

/** Attach a Socket.IO server to the Fastify HTTP server. */
export function buildSocket(app: FastifyInstance): Server {
  const io = new Server(app.server, {
    path: "/socket.io",
    cors: { origin: env.corsOrigins, credentials: true },
    // Long-polling → WS upgrade with fallback (default transports).
  });

  // Cross-instance broadcast adapter (only needed once we run >1 replica; the
  // events.ts bus already fans game events out, so this is future-proofing).
  if (env.redisUrl) {
    try {
      const pub = new Redis(env.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
      const sub = pub.duplicate();
      pub.on("error", (e) => app.log.error(`socket redis pub: ${e.message}`));
      sub.on("error", (e) => app.log.error(`socket redis sub: ${e.message}`));
      io.adapter(createAdapter(pub, sub));
    } catch (e) {
      app.log.error(`socket redis adapter init failed: ${(e as Error).message}`);
    }
  }

  // Handshake auth: verify the Auth.js JWT from cookie or auth.token.
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const handshakeToken =
        (socket.handshake.auth as { token?: string } | undefined)?.token ?? null;
      const token = tokenFromCookies(cookies) ?? handshakeToken;
      const user = await userFromToken(token);
      if (!user) return next(new Error("UNAUTHORIZED"));
      (socket.data as SocketData).user = user;
      (socket.data as SocketData).cleanups = new Map();
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const data = socket.data as SocketData;
    const userId = data.user.id;

    socket.on("session:subscribe", async (payload: { sessionId?: string }) => {
      const sessionId = payload?.sessionId;
      if (!sessionId) return;
      const key = `session:${sessionId}`;
      if (data.cleanups.has(key)) return; // already subscribed
      // Presence: connecting to a session counts as a heartbeat.
      void heartbeat(userId, sessionId).catch(() => {});
      const teardown = await attachSessionStream(socket, userId, sessionId);
      data.cleanups.set(key, teardown);
    });

    socket.on("session:unsubscribe", (payload: { sessionId?: string }) => {
      const key = `session:${payload?.sessionId}`;
      const teardown = data.cleanups.get(key);
      if (teardown) {
        teardown();
        data.cleanups.delete(key);
      }
    });

    socket.on("home:subscribe", () => {
      if (data.cleanups.has("home")) return;
      data.cleanups.set("home", attachHomeStream(socket, userId));
    });

    socket.on("home:unsubscribe", () => {
      data.cleanups.get("home")?.();
      data.cleanups.delete("home");
    });

    // Presence heartbeat (replaces the POST /heartbeat loop).
    socket.on("heartbeat", (payload: { sessionId?: string }) => {
      if (payload?.sessionId) void heartbeat(userId, payload.sessionId).catch(() => {});
    });

    socket.on("disconnect", () => {
      for (const teardown of data.cleanups.values()) teardown();
      data.cleanups.clear();
    });
  });

  return io;
}
