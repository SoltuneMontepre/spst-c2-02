import { db } from "@/lib/db";
import { handle, currentUser, unauthorized, ApiError } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validation";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const profile = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        emailVerified: true,
      },
    });
    return profile;
  });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const data = updateProfileSchema.parse(await request.json());
    return db.user.update({
      where: { id: user.id },
      data,
      select: { id: true, displayName: true, avatarUrl: true },
    });
  });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const activeHost = await db.gameSession.findFirst({
      where: {
        hostUserId: user.id,
        status: { in: ["LOBBY", "INTRO", "ROUND_1", "ROUND_2", "ROUND_3", "ROUND_4", "DEBRIEF"] },
      },
    });
    if (activeHost) throw new ApiError("ACTIVE_HOST_SESSION", 409);

    await db.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date(), displayName: "Đã xóa", avatarUrl: null },
    });
    await db.participant.updateMany({
      where: { userId: user.id },
      data: { displayNameSnapshot: "Đã xóa", avatarSnapshot: null },
    });
    return { ok: true };
  });
}
