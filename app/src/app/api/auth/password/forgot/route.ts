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
      include: { authIdentities: true },
    });

    if (user && !user.deletedAt) {
      const hasEmail = user.authIdentities.some((i) => i.provider === "EMAIL");
      const hasGoogle = user.authIdentities.some((i) => i.provider === "GOOGLE");

      if (hasGoogle && !hasEmail) {
        return { status: "GOOGLE_ACCOUNT" as const };
      }
    }

    let resetUrl: string | undefined;

    // Only act for email accounts; always return a neutral response (FR-AUTH-04).
    if (user && !user.deletedAt && user.authIdentities.some((i) => i.provider === "EMAIL")) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      await db.$transaction(async (tx) => {
        await tx.verificationToken.deleteMany({
          where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
        });
        await tx.verificationToken.create({
          data: {
            userId: user.id,
            type: "PASSWORD_RESET",
            tokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          },
        });
      });
      const base = process.env.AUTH_URL ?? "http://localhost:3000";
      resetUrl = `${base}/auth/reset?token=${rawToken}`;
      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch (err) {
        console.error("[mail] password reset send failed:", err);
      }
    }

    return {
      status: "ACCEPTED" as const,
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    };
  });
}
