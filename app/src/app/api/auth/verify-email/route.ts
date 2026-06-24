import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return redirect("missing");

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== "EMAIL_VERIFY") return redirect("invalid");
  if (record.usedAt) return redirect("used");
  if (record.expiresAt < new Date()) return redirect("expired");

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    db.authIdentity.updateMany({
      where: { userId: record.userId, provider: "EMAIL" },
      data: { verifiedAt: new Date() },
    }),
    db.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return redirect("ok");
}

function redirect(status: string) {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${base}/auth?verified=${status}`);
}
