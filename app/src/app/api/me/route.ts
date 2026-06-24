import { db } from "@/lib/db";
import { handle, currentUser, unauthorized } from "@/lib/api";
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
