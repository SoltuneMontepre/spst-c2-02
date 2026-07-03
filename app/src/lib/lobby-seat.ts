import { db } from "./db";
import { publish } from "./events";

async function bump(sessionId: string, type: string, data?: unknown): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}

/** Host lobby seat — host cannot use join-by-code but needs a seat to ready/play. */
export async function ensureHostParticipant(
  sessionId: string,
  hostUserId: string,
): Promise<boolean> {
  const existing = await db.participant.findFirst({
    where: { sessionId, userId: hostUserId, isBot: false },
  });
  if (existing) return false;

  const user = await db.user.findUniqueOrThrow({ where: { id: hostUserId } });
  await db.participant.create({
    data: {
      sessionId,
      userId: hostUserId,
      displayNameSnapshot: user.displayName,
      avatarSnapshot: user.avatarUrl,
      presence: "ONLINE",
      lastSeenAt: new Date(),
      ready: false,
    },
  });
  await bump(sessionId, "participant:joined", { userId: hostUserId });
  return true;
}
