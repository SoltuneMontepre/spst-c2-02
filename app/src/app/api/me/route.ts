import { db } from "@/lib/db";
import { handle, currentUser, unauthorized, ApiError } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validation";
import { ACTIVE_STATUSES } from "@/lib/session-service";

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
        school: true,
        gradeClass: true,
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
      select: { id: true, displayName: true, avatarUrl: true, school: true, gradeClass: true },
    });
  });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return handle(async () => {
    const activeHostCount = await db.gameSession.count({
      where: {
        hostUserId: user.id,
        status: { in: [...ACTIVE_STATUSES] },
      },
    });
    if (activeHostCount > 0) throw new ApiError("ACTIVE_HOST_SESSION", 409);

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
