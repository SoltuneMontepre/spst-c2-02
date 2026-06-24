import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { handle, ApiError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  return handle(async () => {
    const body = registerSchema.parse(await request.json());

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ApiError("EMAIL_IN_USE", 409);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: body.email, displayName: body.displayName },
      });
      await tx.authIdentity.create({
        data: {
          userId: user.id,
          provider: "EMAIL",
          providerSubject: body.email,
          passwordHash,
        },
      });
      await tx.verificationToken.create({
        data: {
          userId: user.id,
          type: "EMAIL_VERIFY",
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
    });

    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const verifyUrl = `${base}/api/auth/verify-email?token=${rawToken}`;
    await sendVerificationEmail(body.email, verifyUrl);
    return {
      status: "PENDING_VERIFICATION",
      // Dev convenience when SMTP is unavailable.
      verifyUrl: process.env.NODE_ENV === "production" ? undefined : verifyUrl,
    };
  });
}
