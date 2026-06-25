import { db } from "./db";

export type SessionAccess = "host" | "member" | "denied" | "not_found";

/** Whether the user may open player session routes for this room. */
export async function resolveSessionAccess(
  userId: string,
  sessionId: string,
): Promise<SessionAccess> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: {
      hostUserId: true,
      participants: {
        where: { userId, isBot: false },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!session) return "not_found";
  if (session.hostUserId === userId) return "host";
  if (session.participants.length > 0) return "member";
  return "denied";
}
