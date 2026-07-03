// Per-session serialization (TECH-INTEGRITY). Every gameplay mutation for a
// session — human commands, bot batches, and phase transitions — runs under one
// lock so they can never interleave and race on wallets/inventory/state.
//
// Two layers:
//   1. An in-process promise-chain mutex serializes callers in the same Node
//      process without polling.
//   2. A Redis `SET NX PX` lock serializes across instances (Docker scale-out).
//      When REDIS_URL is unset, layer 1 alone is authoritative (single process).
//
// The lock is re-entrant per session via AsyncLocalStorage: a transition that
// already holds the lock can call runBotDecisions()/settleRound() without
// deadlocking — the nested acquisition just runs inline.

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { ApiError } from "./api";

const LOCK_PREFIX = "mln:lock:session:";
const DEFAULT_TTL_MS = 30_000;
const DEFAULT_WAIT_MS = 20_000;

// Compare-and-delete so we only release a lock we still own (TTL may have expired).
const RELEASE_SCRIPT =
  'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';

export interface SessionLockOptions {
  /** Lock lifetime before Redis auto-expires it. Must exceed the slowest guarded transaction. */
  ttlMs?: number;
  /** How long to wait for a cross-instance holder before giving up. */
  waitMs?: number;
}

const heldSessions = new AsyncLocalStorage<Set<string>>();
const localChains = new Map<string, Promise<unknown>>();

const globalForLock = globalThis as unknown as { __mlnLockRedis?: Redis | null };

function getLockRedis(): Redis | null {
  if (globalForLock.__mlnLockRedis !== undefined) return globalForLock.__mlnLockRedis;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    globalForLock.__mlnLockRedis = null;
    return null;
  }
  try {
    const client = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });
    client.on("error", (e) => console.error("Redis lock error:", e.message));
    globalForLock.__mlnLockRedis = client;
    return client;
  } catch (e) {
    console.error("Redis lock init failed, using in-process lock only:", (e as Error).message);
    globalForLock.__mlnLockRedis = null;
    return null;
  }
}

/** Serialize callers for one session within this process (no polling). */
function withLocalLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = (localChains.get(key) ?? Promise.resolve()).catch(() => {});
  const result = prev.then(fn);
  const tail = result.catch(() => {});
  localChains.set(key, tail);
  void tail.then(() => {
    if (localChains.get(key) === tail) localChains.delete(key);
  });
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function acquireRedis(
  client: Redis,
  key: string,
  token: string,
  ttlMs: number,
  waitMs: number,
): Promise<boolean> {
  const deadline = Date.now() + waitMs;
  for (;;) {
    try {
      const ok = await client.set(key, token, "PX", ttlMs, "NX");
      if (ok === "OK") return true;
    } catch (e) {
      // Redis unavailable mid-flight — fall back to in-process serialization.
      console.error("Redis lock acquire failed, proceeding local-only:", (e as Error).message);
      return true;
    }
    if (Date.now() >= deadline) return false;
    await sleep(40 + Math.floor(Math.random() * 40));
  }
}

/**
 * Run `fn` while holding the session's lock. Re-entrant: if the current async
 * context already holds this session's lock, `fn` runs inline without
 * re-acquiring. Throws if a cross-instance holder can't be waited out.
 */
export async function withSessionLock<T>(
  sessionId: string,
  fn: () => Promise<T>,
  options?: SessionLockOptions,
): Promise<T> {
  const current = heldSessions.getStore();
  if (current?.has(sessionId)) return fn();

  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const waitMs = options?.waitMs ?? DEFAULT_WAIT_MS;

  return withLocalLock(sessionId, async () => {
    const client = getLockRedis();
    const nextHeld = new Set(current);
    nextHeld.add(sessionId);

    if (!client) {
      return heldSessions.run(nextHeld, fn);
    }

    const key = `${LOCK_PREFIX}${sessionId}`;
    const token = randomUUID();
    const acquired = await acquireRedis(client, key, token, ttlMs, waitMs);
    if (!acquired) throw new ApiError("SESSION_BUSY", 409);
    try {
      return await heldSessions.run(nextHeld, fn);
    } finally {
      await client.eval(RELEASE_SCRIPT, 1, key, token).catch(() => {});
    }
  });
}
