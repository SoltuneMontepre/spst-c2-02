// Realtime event bus (TECH-REALTIME). Redis pub/sub fans out across instances
// when REDIS_URL is set; otherwise an in-memory emitter handles single-instance dev.

import { EventEmitter } from "node:events";
import Redis from "ioredis";

export interface GameEvent {
  sessionId: string;
  type: string;
  stateVersion: number;
  data?: unknown;
}

type Listener = (event: GameEvent) => void;

const CHANNEL_PREFIX = "mln:session:";

const local = new EventEmitter();
local.setMaxListeners(0);

interface RedisBus {
  pub: Redis;
  sub: Redis;
}

const globalForBus = globalThis as unknown as { __mlnBus?: RedisBus | null };

function emitLocal(event: GameEvent): void {
  local.emit(event.sessionId, event);
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
    sub.on("pmessage", (_pattern, channel, message) => {
      const sessionId = channel.slice(CHANNEL_PREFIX.length);
      try {
        emitLocal({ ...(JSON.parse(message) as GameEvent), sessionId });
      } catch {
        /* ignore malformed payloads */
      }
    });
    void sub.psubscribe(`${CHANNEL_PREFIX}*`).catch((e) => {
      console.error("Redis subscribe failed:", (e as Error).message);
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

/** Broadcast an event to every subscriber of a session. Never throws — Redis failures fall back to local emit. */
export async function publish(event: GameEvent): Promise<void> {
  const bus = getRedisBus();
  if (!bus) {
    emitLocal(event);
    return;
  }
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

export function subscribe(sessionId: string, listener: Listener): () => void {
  local.on(sessionId, listener);
  return () => local.off(sessionId, listener);
}
