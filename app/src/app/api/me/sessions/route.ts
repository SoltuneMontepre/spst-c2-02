import { db } from "@/lib/db";
import { handle, currentUser, unauthorized } from "@/lib/api";

/** Session history for profile (FR-PROFILE-02). */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const participants = await db.participant.findMany({
      where: { userId: user.id, isBot: false },
      include: {
        session: {
          select: {
            id: true,
            code: true,
            status: true,
            scenarioVersion: true,
            startedAt: true,
            endedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return participants.map((p) => ({
      sessionId: p.session.id,
      code: p.session.code,
      status: p.session.status,
      role: p.role,
      startedAt: p.session.startedAt,
      endedAt: p.session.endedAt,
      joinedAt: p.createdAt,
    }));
  });
}
