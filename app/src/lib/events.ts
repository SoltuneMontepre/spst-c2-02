// Realtime event bus (TECH-REALTIME). Redis pub/sub fans out across instances
// when REDIS_URL is set; otherwise an in-memory emitter handles single-instance dev.

import { EventEmitter } from "node:events";
import Redis from "ioredis";
import type { HomeDashboard, SessionSnapshot } from "./session-service";

export interface GameEvent {
  sessionId: string;
  type: string;
  stateVersion: number;
  data?: unknown;
}

export interface StreamSnapshotPayload {
  stateVersion: number;
  snapshot: SessionSnapshot;
}

export interface HomeStreamSnapshotPayload {
  dashboard: HomeDashboard;
}

type Listener = (event: GameEvent) => void;
type HomeListener = () => void;

const CHANNEL_PREFIX = "mln:session:";
const REDIS_HOME_PUBLIC = "mln:home:public";
const REDIS_HOME_USER_PREFIX = "mln:home:user:";
const HOME_PUBLIC = "home:public";

const HOME_PUBLIC_TYPES = new Set([
  "participant:joined",
  "participant:left",
  "participant:bot_added",
  "participant:bot_removed",
  "session:started",
  "session:ended",
]);

const SESSION_HOME_USER_TYPES = new Set(["session:started", "session:ended"]);

function homeUserChannel(userId: string): string {
  return `home:user:${userId}`;
}

interface RedisBus {
  pub: Redis;
  sub: Redis;
}

const globalForBus = globalThis as unknown as {
  __mlnBus?: RedisBus | null;
  __mlnLocalBus?: EventEmitter;
};

// Pinned to globalThis so a Next.js dev-mode hot reload (which re-evaluates
// this module) doesn't spawn a fresh emitter that open SSE connections can't
// see — otherwise publish() and subscribe() end up on different instances
// and live updates silently stop until the client does a hard refetch.
const local = globalForBus.__mlnLocalBus ?? new EventEmitter();
local.setMaxListeners(0);
globalForBus.__mlnLocalBus = local;

function emitLocal(event: GameEvent): void {
  local.emit(event.sessionId, event);
}

function emitHomePublic(): void {
  local.emit(HOME_PUBLIC);
}

function emitHomeUser(userId: string): void {
  local.emit(homeUserChannel(userId));
}

function getRedisBus(): RedisBus | null {
  if (globalForBus.__mlnBus !== undefined) return globalForBus.__mlnBus;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    globalForBus.__mlnBus = null;
    return null;
  }
  try {
    const opts = { maxRetriesPerRequest: null, lazyConnect: true } as const;
    const pub = new Redis(url, opts);
    const sub = new Redis(url, opts);
    sub.on("message", (channel) => {
      if (channel === REDIS_HOME_PUBLIC) emitHomePublic();
    });
    sub.on("pmessage", (_pattern, channel, message) => {
      if (channel.startsWith(CHANNEL_PREFIX)) {
        const sessionId = channel.slice(CHANNEL_PREFIX.length);
        try {
          emitLocal({ ...(JSON.parse(message) as GameEvent), sessionId });
        } catch {
          /* ignore malformed payloads */
        }
        return;
      }
      if (channel.startsWith(REDIS_HOME_USER_PREFIX)) {
        emitHomeUser(channel.slice(REDIS_HOME_USER_PREFIX.length));
      }
    });
    void sub.psubscribe(`${CHANNEL_PREFIX}*`, `${REDIS_HOME_USER_PREFIX}*`).catch((e) => {
      console.error("Redis subscribe failed:", (e as Error).message);
    });
    void sub.subscribe(REDIS_HOME_PUBLIC).catch((e) => {
      console.error("Redis home subscribe failed:", (e as Error).message);
    });
    pub.on("error", (e) => console.error("Redis pub error:", e.message));
    sub.on("error", (e) => console.error("Redis sub error:", e.message));
    globalForBus.__mlnBus = { pub, sub };
    return globalForBus.__mlnBus;
  } catch (e) {
    console.error("Redis init failed, using in-memory bus:", (e as Error).message);
    globalForBus.__mlnBus = null;
    return null;
  }
}

async function maybeNotifyHome(event: GameEvent): Promise<void> {
  if (HOME_PUBLIC_TYPES.has(event.type)) {
    notifyHomePublic();
  }

  const data = event.data as { userId?: string } | undefined;
  if (data?.userId) {
    notifyHomeUser(data.userId);
  }

  if (!SESSION_HOME_USER_TYPES.has(event.type)) return;

  const { db } = await import("./db");
  const session = await db.gameSession.findUnique({
    where: { id: event.sessionId },
    select: {
      hostUserId: true,
      participants: { where: { isBot: false }, select: { userId: true } },
    },
  });
  if (!session) return;

  const userIds = new Set<string>([session.hostUserId]);
  for (const p of session.participants) {
    if (p.userId) userIds.add(p.userId);
  }
  for (const uid of userIds) {
    notifyHomeUser(uid);
  }
}

/** Broadcast an event to every subscriber of a session. Never throws — Redis failures fall back to local emit. */
export async function publish(event: GameEvent): Promise<void> {
  const bus = getRedisBus();
  if (!bus) {
    emitLocal(event);
  } else {
    try {
      await bus.pub.publish(
        `${CHANNEL_PREFIX}${event.sessionId}`,
        JSON.stringify(event),
      );
    } catch (e) {
      console.error("Redis publish failed, falling back to local:", (e as Error).message);
      emitLocal(event);
    }
  }
  void maybeNotifyHome(event).catch(() => {});
}

export function subscribe(sessionId: string, listener: Listener): () => void {
  local.on(sessionId, listener);
  return () => local.off(sessionId, listener);
}

/** Notify all home dashboards that the public lobby list may have changed. */
export function notifyHomePublic(): void {
  emitHomePublic();
  const bus = getRedisBus();
  if (!bus) return;
  void bus.pub.publish(REDIS_HOME_PUBLIC, "1").catch((e) => {
    console.error("Redis home public publish failed:", (e as Error).message);
  });
}

/** Notify a single user's home dashboard to refresh. */
export function notifyHomeUser(userId: string): void {
  emitHomeUser(userId);
  const bus = getRedisBus();
  if (!bus) return;
  void bus.pub.publish(`${REDIS_HOME_USER_PREFIX}${userId}`, "1").catch((e) => {
    console.error("Redis home user publish failed:", (e as Error).message);
  });
}

/** Listen for home invalidation signals (public lobby list + user-specific). */
export function subscribeHome(userId: string, listener: HomeListener): () => void {
  const onPublic = () => listener();
  const onUser = () => listener();
  local.on(HOME_PUBLIC, onPublic);
  local.on(homeUserChannel(userId), onUser);
  return () => {
    local.off(HOME_PUBLIC, onPublic);
    local.off(homeUserChannel(userId), onUser);
  };
}
