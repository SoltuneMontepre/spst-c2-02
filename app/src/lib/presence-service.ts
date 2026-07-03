// Presence is heartbeat-only (lastSeenAt). SSE is for game events, not presence.
// Online/offline is derived on read; we only write OFFLINE when reconcile finds
// a stale heartbeat — no flaky connect/abort races.

import { db } from "./db";
import { publish } from "./events";
import { ApiError } from "./api";
import { ensureHostParticipant } from "./lobby-seat";
import {
  DISCONNECT_BOT_TAKEOVER_SEC,
  HOST_RECONNECT_WINDOW_SEC,
} from "./scenario";
import { hostPause, hostEnd } from "./game-service";
import { syncLobbySoloSince } from "./lobby-maintenance";
import {
  effectivePresence,
  isDueForBotTakeover,
  isEffectivelyOnline,
} from "./participant-presence";

const hostOfflineTimers = new Map<string, NodeJS.Timeout>();

/** Retry the initial bot-takeover nudge on SESSION_BUSY — a concurrent
 *  phase transition can legitimately hold the lock past the default wait,
 *  and without a retry the newly-taken-over seat gets zero actions for
 *  the rest of the current phase (the next phase's bot pass still covers
 *  it, but that can be a full phase late). */
async function runBotTakeoverWithRetry(sessionId: string): Promise<void> {
  const { runBotTakeover } = await import("./bots");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await runBotTakeover(sessionId);
      return;
    } catch (e) {
      const busy = e instanceof ApiError && e.code === "SESSION_BUSY";
      if (!busy || attempt === 2) {
        console.error("bot takeover:", e);
        return;
      }
      await new Promise((r) => setTimeout(r, 500 + attempt * 500));
    }
  }
}

async function bump(sessionId: string, type: string, data?: unknown): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await import("./session-service")
    .then((m) => m.refreshLiveRoom(sessionId))
    .catch((e) => console.error("live-room refresh:", e));
  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}

/** Player heartbeat — sole presence signal. Updates lastSeenAt every call. */
export async function heartbeat(
  userId: string,
  sessionId: string,
): Promise<{ controlMode: string; presence: "ONLINE" }> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: { hostUserId: true, status: true },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.hostUserId === userId && session.status === "LOBBY") {
    await ensureHostParticipant(sessionId, userId);
  }

  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
  });
  if (!participant) throw new ApiError("FORBIDDEN", 403);

  const wasOffline = !isEffectivelyOnline(participant.lastSeenAt);
  const controlMode =
    participant.controlMode === "BOT_TAKEOVER" ? "HUMAN" : participant.controlMode;
  const lastSeenAt = new Date();
  const presenceData = {
    presence: "ONLINE" as const,
    lastSeenAt,
    controlMode,
  };

  // Broadcast only on real transitions (offline → online, or reclaiming seat).
  // When bumping stateVersion, lock GameSession before the participant row.
  if (wasOffline || participant.controlMode !== controlMode) {
    const s = await db.$transaction(async (tx) => {
      const updated = await tx.gameSession.update({
        where: { id: sessionId },
        data: { stateVersion: { increment: 1 } },
        select: { stateVersion: true },
      });
      await tx.participant.update({
        where: { id: participant.id },
        data: presenceData,
      });
      return updated;
    });
    await import("./session-service")
      .then((m) => m.refreshLiveRoom(sessionId))
      .catch((e) => console.error("live-room refresh:", e));
    await publish({
      sessionId,
      type: "participant:presence",
      stateVersion: s.stateVersion,
      data: {
        participantId: participant.id,
        userId,
        presence: "ONLINE",
        controlMode,
        lastSeenAt: lastSeenAt.toISOString(),
      },
    });
  } else {
    await db.participant.update({
      where: { id: participant.id },
      data: presenceData,
    });
  }

  if (session.status === "LOBBY") {
    await syncLobbySoloSince(sessionId);
  }

  return { controlMode, presence: "ONLINE" };
}

/**
 * Reconcile stored presence flags from lastSeenAt.
 * Call on snapshot reads so every client sees consistent online/offline
 * without depending on in-process timers or SSE abort.
 */
export async function reconcileSessionPresence(sessionId: string): Promise<boolean> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (!session) return false;

  const humans = await db.participant.findMany({
    where: { sessionId, isBot: false },
    select: {
      id: true,
      userId: true,
      presence: true,
      lastSeenAt: true,
      controlMode: true,
      ready: true,
    },
  });

  const now = Date.now();
  const inGame = !["LOBBY", "CREATED", "COMPLETED", "INCOMPLETE", "CANCELLED"].includes(
    session.status,
  );
  let changed = false;

  for (const p of humans) {
    const online = isEffectivelyOnline(p.lastSeenAt, now);
    const storedOnline = p.presence === "ONLINE";

    if (online && !storedOnline) {
      await db.participant.update({
        where: { id: p.id },
        data: { presence: "ONLINE" },
      });
      changed = true;
      continue;
    }

    if (!online && storedOnline) {
      changed = true;
      const clearReady = session.status === "LOBBY" && p.ready;
      const s = await db.$transaction(async (tx) => {
        const updated = await tx.gameSession.update({
          where: { id: sessionId },
          data: { stateVersion: { increment: 1 } },
          select: { stateVersion: true },
        });
        await tx.participant.update({
          where: { id: p.id },
          data: {
            presence: "OFFLINE",
            ...(clearReady ? { ready: false } : {}),
          },
        });
        return updated;
      });
      await import("./session-service")
        .then((m) => m.refreshLiveRoom(sessionId))
        .catch((e) => console.error("live-room refresh:", e));
      if (clearReady) {
        await publish({
          sessionId,
          type: "participant:ready",
          stateVersion: s.stateVersion,
          data: { participantId: p.id, userId: p.userId, ready: false },
        });
      }
      await publish({
        sessionId,
        type: "participant:presence",
        stateVersion: s.stateVersion,
        data: {
          participantId: p.id,
          userId: p.userId,
          presence: "OFFLINE",
          lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
          controlMode: p.controlMode,
        },
      });

      void import("./ai-host")
        .then((m) => m.maybeFastForwardPhase(sessionId))
        .catch((e) => console.error("ready-grace fast-forward:", e));
    }

    if (
      inGame &&
      !online &&
      p.controlMode === "HUMAN" &&
      isDueForBotTakeover(p.lastSeenAt, now)
    ) {
      changed = true;
      const s = await db.$transaction(async (tx) => {
        const updated = await tx.gameSession.update({
          where: { id: sessionId },
          data: { stateVersion: { increment: 1 } },
          select: { stateVersion: true },
        });
        await tx.participant.update({
          where: { id: p.id },
          data: { controlMode: "BOT_TAKEOVER", presence: "OFFLINE" },
        });
        return updated;
      });
      await import("./session-service")
        .then((m) => m.refreshLiveRoom(sessionId))
        .catch((e) => console.error("live-room refresh:", e));
      await publish({
        sessionId,
        type: "bot:control_changed",
        stateVersion: s.stateVersion,
        data: { participantId: p.id, controlMode: "BOT_TAKEOVER" },
      });
      void runBotTakeoverWithRetry(sessionId);
    }
  }

  return changed;
}

/** @deprecated Prefer heartbeat — kept for any legacy callers. */
export async function markOffline(userId: string, sessionId: string): Promise<void> {
  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
  });
  if (!participant) return;

  // Only mark offline if heartbeat is already stale (ignore flaky callers).
  if (isEffectivelyOnline(participant.lastSeenAt)) return;

  await db.participant.update({
    where: { id: participant.id },
    data: { presence: "OFFLINE" },
  });
  await bump(sessionId, "participant:presence", {
    participantId: participant.id,
    userId,
    presence: "OFFLINE",
    lastSeenAt: participant.lastSeenAt?.toISOString() ?? null,
  });
}

/** Host presence tracking (FR-HOST-06). */
export async function hostHeartbeat(hostUserId: string, sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.hostUserId !== hostUserId) return;

  const t = hostOfflineTimers.get(sessionId);
  if (t) clearTimeout(t);
  hostOfflineTimers.delete(sessionId);
  hostOfflineTimers.delete(`${sessionId}:end`);
}

export async function hostOffline(hostUserId: string, sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.hostUserId !== hostUserId) return;
  if (["LOBBY", "COMPLETED", "INCOMPLETE", "CANCELLED"].includes(session.status)) return;

  hostOfflineTimers.set(
    sessionId,
    setTimeout(async () => {
      hostOfflineTimers.delete(sessionId);
      const fresh = await db.gameSession.findUnique({ where: { id: sessionId } });
      if (!fresh || fresh.paused) return;
      await hostPause(hostUserId, sessionId);
    }, DISCONNECT_BOT_TAKEOVER_SEC * 1000),
  );

  hostOfflineTimers.set(
    `${sessionId}:end`,
    setTimeout(async () => {
      hostOfflineTimers.delete(`${sessionId}:end`);
      await hostEnd(hostUserId, sessionId);
    }, HOST_RECONNECT_WINDOW_SEC * 1000),
  );
}

export { effectivePresence, isEffectivelyOnline, isDisconnectedForReady } from "./participant-presence";
