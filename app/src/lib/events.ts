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

// Local listeners keyed by sessionId, shared across transports.
const local = new EventEmitter();
local.setMaxListeners(0);

interface RedisBus {
  pub: Redis;
  sub: Redis;
}

const globalForBus = globalThis as unknown as { __mlnBus?: RedisBus | null };

function getRedisBus(): RedisBus | null {
  if (globalForBus.__mlnBus !== undefined) return globalForBus.__mlnBus;
  const url = process.env.REDIS_URL;
  if (!url) {
    globalForBus.__mlnBus = null;
    return null;
  }
  const pub = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
  const sub = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
  sub.on("pmessage", (_pattern, channel, message) => {
    const sessionId = channel.slice(CHANNEL_PREFIX.length);
    try {
      local.emit(sessionId, JSON.parse(message) as GameEvent);
    } catch {
      /* ignore malformed payloads */
    }
  });
  void sub.psubscribe(`${CHANNEL_PREFIX}*`);
  pub.on("error", (e) => console.error("Redis pub error:", e.message));
  sub.on("error", (e) => console.error("Redis sub error:", e.message));
  globalForBus.__mlnBus = { pub, sub };
  return globalForBus.__mlnBus;
}

/** Broadcast an event to every subscriber of a session. */
export async function publish(event: GameEvent): Promise<void> {
  const bus = getRedisBus();
  if (bus) {
    // Delivered back to all instances (including this one) via psubscribe.
    await bus.pub.publish(`${CHANNEL_PREFIX}${event.sessionId}`, JSON.stringify(event));
  } else {
    local.emit(event.sessionId, event);
  }
}

/** Subscribe to a session's events. Returns an unsubscribe fn. */
export function subscribe(sessionId: string, listener: Listener): () => void {
  local.on(sessionId, listener);
  return () => local.off(sessionId, listener);
}
