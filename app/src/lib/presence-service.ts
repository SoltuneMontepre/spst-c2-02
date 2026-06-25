// Presence, disconnect handling, bot takeover (FR-GAME-03, FR-ROOM-03, FR-HOST-06).

import { db } from "./db";
import { publish } from "./events";
import { ApiError } from "./api";
import {
  DISCONNECT_BOT_TAKEOVER_SEC,
  HOST_RECONNECT_WINDOW_SEC,
} from "./scenario";
import { hostPause, hostEnd } from "./game-service";

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const hostOfflineTimers = new Map<string, NodeJS.Timeout>();

async function bump(sessionId: string, type: string, data?: unknown): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}

/** Player heartbeat — marks online and cancels pending bot takeover. */
export async function heartbeat(
  userId: string,
  sessionId: string,
  tabId?: string,
): Promise<{ controlMode: string }> {
  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
  });
  if (!participant) throw new ApiError("FORBIDDEN", 403);

  const key = `${sessionId}:${participant.id}`;
  const existing = disconnectTimers.get(key);
  if (existing) clearTimeout(existing);
  disconnectTimers.delete(key);

  // Reclaim from bot takeover at action boundary.
  const controlMode =
    participant.controlMode === "BOT_TAKEOVER" ? "HUMAN" : participant.controlMode;

  await db.participant.update({
    where: { id: participant.id },
    data: {
      presence: "ONLINE",
      lastSeenAt: new Date(),
      controlMode,
      ...(tabId ? {} : {}),
    },
  });

  await bump(sessionId, "participant:presence", {
    participantId: participant.id,
    userId,
    presence: "ONLINE",
  });
  return { controlMode };
}

/** Called when SSE disconnects or explicit offline. */
export async function markOffline(userId: string, sessionId: string): Promise<void> {
  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
  });
  if (!participant) return;

  await db.participant.update({
    where: { id: participant.id },
    data: { presence: "OFFLINE", lastSeenAt: new Date() },
  });

  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) return;

  // Lobby: not-ready after 15s (FR-ROOM-03).
  if (session.status === "LOBBY") {
    const key = `${sessionId}:${participant.id}`;
    disconnectTimers.set(
      key,
      setTimeout(async () => {
        disconnectTimers.delete(key);
        await db.participant.updateMany({
          where: { id: participant.id, presence: "OFFLINE" },
          data: { ready: false },
        });
        await bump(sessionId, "participant:ready", {
          participantId: participant.id,
          userId,
          ready: false,
        });
      }, DISCONNECT_BOT_TAKEOVER_SEC * 1000),
    );
  }

  // Active game: bot takeover after 15s (FR-GAME-03).
  if (
    !["LOBBY", "CREATED", "COMPLETED", "INCOMPLETE", "CANCELLED"].includes(session.status)
  ) {
    const key = `${sessionId}:${participant.id}`;
    disconnectTimers.set(
      key,
      setTimeout(async () => {
        disconnectTimers.delete(key);
        const fresh = await db.participant.findUnique({ where: { id: participant.id } });
        if (!fresh || fresh.presence !== "OFFLINE") return;
        await db.participant.update({
          where: { id: participant.id },
          data: { controlMode: "BOT_TAKEOVER" },
        });
        await bump(sessionId, "bot:control_changed", {
          participantId: participant.id,
          controlMode: "BOT_TAKEOVER",
        });
      }, DISCONNECT_BOT_TAKEOVER_SEC * 1000),
    );
  }

  await bump(sessionId, "participant:presence", {
    participantId: participant.id,
    userId,
    presence: "OFFLINE",
  });
}

/** Host presence tracking (FR-HOST-06). */
export async function hostHeartbeat(hostUserId: string, sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.hostUserId !== hostUserId) return;

  const t = hostOfflineTimers.get(sessionId);
  if (t) clearTimeout(t);
  hostOfflineTimers.delete(sessionId);

  if (session.paused && session.pausedRemainingMs !== null) {
    // Host returned — resume is manual or auto-resume could be added.
  }
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
