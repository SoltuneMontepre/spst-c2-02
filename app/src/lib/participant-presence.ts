// Presence is derived from lastSeenAt (heartbeat), not from flaky SSE
// connect/abort events. Same pattern as live gameplay: one source of truth,
// reconcile on read, broadcast only on real transitions.

import {
  DISCONNECT_BOT_TAKEOVER_SEC,
  DISCONNECT_READY_GRACE_SEC,
  HEARTBEAT_INTERVAL_SEC,
  PRESENCE_STALE_SEC,
} from "./scenario";

export { HEARTBEAT_INTERVAL_SEC, PRESENCE_STALE_SEC };

function seenMs(lastSeenAt: Date | string | null | undefined): number | null {
  if (!lastSeenAt) return null;
  const ms =
    typeof lastSeenAt === "string" ? Date.parse(lastSeenAt) : lastSeenAt.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Age of last heartbeat in ms, or Infinity if never seen. */
export function presenceAgeMs(
  lastSeenAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): number {
  const seen = seenMs(lastSeenAt);
  if (seen == null) return Number.POSITIVE_INFINITY;
  return Math.max(0, nowMs - seen);
}

/** True while heartbeats are fresh — player counts as online. */
export function isEffectivelyOnline(
  lastSeenAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  return presenceAgeMs(lastSeenAt, nowMs) <= PRESENCE_STALE_SEC * 1000;
}

/** Effective presence for UI / ready gates (bots always online). */
export function effectivePresence(
  isBot: boolean,
  _storedPresence: string,
  lastSeenAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): "ONLINE" | "OFFLINE" {
  if (isBot) return "ONLINE";
  return isEffectivelyOnline(lastSeenAt, nowMs) ? "ONLINE" : "OFFLINE";
}

/** True once a player has been silent long enough that we stop waiting on
 *  them for "everyone ready". */
export function isDisconnectedForReady(
  _presence: string,
  lastSeenAt: Date | string | null,
  nowMs: number = Date.now(),
): boolean {
  const age = presenceAgeMs(lastSeenAt, nowMs);
  return age >= (PRESENCE_STALE_SEC + DISCONNECT_READY_GRACE_SEC) * 1000;
}

/** True once a player has been silent long enough for bot takeover. */
export function isDueForBotTakeover(
  lastSeenAt: Date | string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  return presenceAgeMs(lastSeenAt, nowMs) >= DISCONNECT_BOT_TAKEOVER_SEC * 1000;
}
