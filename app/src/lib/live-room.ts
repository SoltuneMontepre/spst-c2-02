// TFT-style live room cache: one in-memory (+ Redis) frame per session so bots
// and humans share the same calculated state. Clients read the frame via SSE
// instead of each rebuilding from Postgres on every event.

import Redis from "ioredis";
import type { SessionSnapshot } from "./session-service";

const KEY_PREFIX = "mln:live:room:";
const TTL_SEC = 60 * 60; // 1h — sessions are shorter; refresh keeps it alive

export interface LiveRoomFrame {
  stateVersion: number;
  /** Fully projected snapshots keyed by userId (humans + host). */
  byUserId: Record<string, SessionSnapshot>;
}

const memory = new Map<string, LiveRoomFrame>();
const globalForLive = globalThis as unknown as { __mlnLiveRedis?: Redis | null };

function getRedis(): Redis | null {
  if (globalForLive.__mlnLiveRedis !== undefined) return globalForLive.__mlnLiveRedis;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    globalForLive.__mlnLiveRedis = null;
    return null;
  }
  try {
    const client = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });
    client.on("error", (e) => console.error("Redis live-room error:", e.message));
    globalForLive.__mlnLiveRedis = client;
    return client;
  } catch (e) {
    console.error("Redis live-room init failed:", (e as Error).message);
    globalForLive.__mlnLiveRedis = null;
    return null;
  }
}

function key(sessionId: string): string {
  return `${KEY_PREFIX}${sessionId}`;
}

/** Read the live frame (memory first, then Redis). */
export async function readLiveRoom(sessionId: string): Promise<LiveRoomFrame | null> {
  const local = memory.get(sessionId);
  if (local) return local;

  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key(sessionId));
    if (!raw) return null;
    const frame = JSON.parse(raw) as LiveRoomFrame;
    memory.set(sessionId, frame);
    return frame;
  } catch (e) {
    console.error("Redis live-room read failed:", (e as Error).message);
    return null;
  }
}

/** Write the live frame to memory + Redis. */
export async function writeLiveRoom(
  sessionId: string,
  frame: LiveRoomFrame,
): Promise<void> {
  memory.set(sessionId, frame);
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key(sessionId), JSON.stringify(frame), "EX", TTL_SEC);
  } catch (e) {
    console.error("Redis live-room write failed:", (e as Error).message);
  }
}

export async function invalidateLiveRoom(sessionId: string): Promise<void> {
  memory.delete(sessionId);
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key(sessionId));
  } catch {
    /* ignore */
  }
}

/** Project a cached frame for one viewer. */
export function snapshotFromLiveRoom(
  frame: LiveRoomFrame,
  userId: string,
): SessionSnapshot | null {
  return frame.byUserId[userId] ?? null;
}

/** Overlay known-good wallet balances onto every viewer projection.
 *  Used right after a trade so Neon/pool read lag cannot leave sellers at the
 *  pre-sale balance in Redis while the DB already has the credit. */
export async function patchLiveRoomBalances(
  sessionId: string,
  balancesByParticipantId: Record<string, number>,
): Promise<void> {
  const entries = Object.entries(balancesByParticipantId);
  if (entries.length === 0) return;

  const frame = await readLiveRoom(sessionId);
  if (!frame) return;

  let changed = false;
  for (const snapshot of Object.values(frame.byUserId)) {
    const selfId = snapshot.self?.participantId;
    if (!selfId) continue;
    const next = balancesByParticipantId[selfId];
    if (next == null || snapshot.self == null) continue;
    if (snapshot.self.balanceVnd === next) continue;
    snapshot.self = { ...snapshot.self, balanceVnd: next };
    changed = true;
  }
  if (changed) await writeLiveRoom(sessionId, frame);
}
