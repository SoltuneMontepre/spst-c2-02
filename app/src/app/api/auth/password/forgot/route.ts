import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { handle } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: Request) {
  return handle(async () => {
    const { email } = forgotPasswordSchema.parse(await request.json());
    const user = await db.user.findUnique({
      where: { email },
      include: { authIdentities: { where: { provider: "EMAIL" } } },
    });

    // Only act for email accounts; always return a neutral response (FR-AUTH-04).
    if (user && !user.deletedAt && user.authIdentities[0]) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      await db.verificationToken.create({
        data: {
          userId: user.id,
          type: "PASSWORD_RESET",
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      const base = process.env.AUTH_URL ?? "http://localhost:3000";
      await sendPasswordResetEmail(email, `${base}/auth/reset?token=${rawToken}`);
    }

    return { status: "ACCEPTED" };
  });
}
