import { db } from "./db";
import { publish } from "./events";
import { SOLO_LOBBY_CANCEL_MS } from "./scenario";
import { isEffectivelyOnline } from "./participant-presence";

async function cancelLobby(sessionId: string, reason: string): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: {
      status: "CANCELLED",
      endedAt: new Date(),
      lobbySoloSince: null,
      lobbySoloExtendUsed: false,
      stateVersion: { increment: 1 },
    },
    select: { stateVersion: true },
  });
  await import("./session-service")
    .then((m) => m.refreshLiveRoom(sessionId))
    .catch(() => {});
  await publish({
    sessionId,
    type: "session:ended",
    stateVersion: s.stateVersion,
    data: { status: "CANCELLED", reason },
  });
}

async function publishLobbySoloChange(
  sessionId: string,
  lobbySoloSince: Date | null,
  lobbySoloExtendUsed: boolean,
): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await import("./session-service")
    .then((m) => m.refreshLiveRoom(sessionId))
    .catch(() => {});
  await publish({
    sessionId,
    type: "session:lobby_solo",
    stateVersion: s.stateVersion,
    data: {
      lobbySoloSince: lobbySoloSince?.toISOString() ?? null,
      lobbySoloExtendUsed,
    },
  });
}

/** Count humans who are effectively online (fresh heartbeat / lastSeenAt). */
async function countOnlineHumans(sessionId: string): Promise<number> {
  const humans = await db.participant.findMany({
    where: { sessionId, isBot: false },
    select: { lastSeenAt: true },
  });
  const now = Date.now();
  return humans.filter((p) => isEffectivelyOnline(p.lastSeenAt, now)).length;
}

/** Start or clear the abandoned-lobby countdown from lastSeenAt, not the
 *  flaky presence column. Only fires when zero humans have a fresh heartbeat. */
export async function syncLobbySoloSince(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: { status: true, lobbySoloSince: true, lobbySoloExtendUsed: true },
  });
  if (!session || session.status !== "LOBBY") return;

  const onlineHumanCount = await countOnlineHumans(sessionId);

  if (onlineHumanCount === 0) {
    if (!session.lobbySoloSince) {
      const lobbySoloSince = new Date();
      await db.gameSession.update({
        where: { id: sessionId },
        data: { lobbySoloSince, lobbySoloExtendUsed: false },
      });
      await publishLobbySoloChange(sessionId, lobbySoloSince, false);
    }
    return;
  }

  // At least one human is online — cancel any abandon timer.
  if (session.lobbySoloSince) {
    await db.gameSession.update({
      where: { id: sessionId },
      data: { lobbySoloSince: null, lobbySoloExtendUsed: false },
    });
    await publishLobbySoloChange(sessionId, null, false);
  }
}

/** Cancel LOBBY rooms where every human has been offline for SOLO_LOBBY_CANCEL_MS. */
const SWEEP_INTERVAL_MS = 30_000;
let lastSweepAt = 0;
let activeSweep: Promise<void> | null = null;

export async function sweepAbandonedSoloLobbies(): Promise<void> {
  const now = Date.now();
  if (activeSweep) return activeSweep;
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;

  activeSweep = sweepAbandonedSoloLobbiesNow();
  try {
    await activeSweep;
  } finally {
    activeSweep = null;
  }
}

async function sweepAbandonedSoloLobbiesNow(): Promise<void> {
  const cutoff = new Date(Date.now() - SOLO_LOBBY_CANCEL_MS);
  const candidates = await db.gameSession.findMany({
    where: {
      status: "LOBBY",
      lobbySoloSince: { not: null, lt: cutoff },
    },
    select: { id: true },
  });

  for (const { id } of candidates) {
    const onlineHumanCount = await countOnlineHumans(id);
    if (onlineHumanCount === 0) {
      await cancelLobby(id, "solo_timeout");
    } else {
      // Someone is back — clear the timer.
      await syncLobbySoloSince(id);
    }
  }
}
