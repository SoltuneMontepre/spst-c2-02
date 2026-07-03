import { PRESENCE_STALE_SEC } from "./scenario";

function lastSeenMs(lastSeenAt: Date | string | null): number | null {
  if (!lastSeenAt) return null;
  const ms =
    typeof lastSeenAt === "string" ? Date.parse(lastSeenAt) : lastSeenAt.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Age of last heartbeat in ms, or Infinity if never seen. */
export function presenceAgeMs(
  lastSeenAt: Date | string | null,
  nowMs: number = Date.now(),
): number {
  const seen = lastSeenMs(lastSeenAt);
  if (seen == null) return Number.POSITIVE_INFINITY;
  return Math.max(0, nowMs - seen);
}

/**
 * Effective online status from lastSeenAt (source of truth).
 * Bots are always online. Humans are online only while heartbeats are fresh.
 */
export function effectivePresence(
  isBot: boolean,
  _presence: string,
  lastSeenAt: Date | string | null,
  nowMs: number = Date.now(),
): "ONLINE" | "OFFLINE" {
  if (isBot) return "ONLINE";
  return presenceAgeMs(lastSeenAt, nowMs) <= PRESENCE_STALE_SEC * 1000
    ? "ONLINE"
    : "OFFLINE";
}

/** True when we should stop waiting on this player for "everyone ready". */
export function isDisconnectedForReady(
  presence: string,
  lastSeenAt: Date | string | null,
  nowMs: number = Date.now(),
): boolean {
  return effectivePresence(false, presence, lastSeenAt, nowMs) === "OFFLINE";
}
