import { db } from "./db";
import { publish } from "./events";
import { SOLO_LOBBY_CANCEL_MS } from "./scenario";

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
  await publish({
    sessionId,
    type: "session:ended",
    stateVersion: s.stateVersion,
    data: { status: "CANCELLED", reason },
  });
}

/** Start or clear the abandoned-lobby countdown based on human presence, not headcount. */
export async function syncLobbySoloSince(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: { status: true, lobbySoloSince: true },
  });
  if (!session || session.status !== "LOBBY") return;

  const onlineHumanCount = await db.participant.count({
    where: { sessionId, isBot: false, presence: "ONLINE" },
  });

  if (onlineHumanCount === 0) {
    if (!session.lobbySoloSince) {
      await db.gameSession.update({
        where: { id: sessionId },
        data: { lobbySoloSince: new Date(), lobbySoloExtendUsed: false },
      });
    }
    return;
  }

  if (session.lobbySoloSince) {
    await db.gameSession.update({
      where: { id: sessionId },
      data: { lobbySoloSince: null, lobbySoloExtendUsed: false },
    });
  }
}

/** Cancel LOBBY rooms where every player has been offline for SOLO_LOBBY_CANCEL_MS. */
export async function sweepAbandonedSoloLobbies(): Promise<void> {
  const cutoff = new Date(Date.now() - SOLO_LOBBY_CANCEL_MS);
  const candidates = await db.gameSession.findMany({
    where: {
      status: "LOBBY",
      lobbySoloSince: { not: null, lt: cutoff },
    },
    select: { id: true },
  });

  for (const { id } of candidates) {
    const onlineHumanCount = await db.participant.count({
      where: { sessionId: id, isBot: false, presence: "ONLINE" },
    });
    if (onlineHumanCount === 0) {
      await cancelLobby(id, "solo_timeout");
    }
  }
}
