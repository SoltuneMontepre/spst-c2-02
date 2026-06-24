import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handle, ApiError } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handle(async () => {
    const { token, password } = resetPasswordSchema.parse(await request.json());
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await db.verificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.type !== "PASSWORD_RESET" || record.usedAt) {
      throw new ApiError("TOKEN_INVALID", 400);
    }
    if (record.expiresAt < new Date()) throw new ApiError("TOKEN_EXPIRED", 400);

    const passwordHash = await bcrypt.hash(password, 12);
    await db.$transaction([
      db.authIdentity.updateMany({
        where: { userId: record.userId, provider: "EMAIL" },
        data: { passwordHash },
      }),
      // A successful reset also confirms the email is reachable.
      db.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      db.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { status: "RESET" };
  });
}
