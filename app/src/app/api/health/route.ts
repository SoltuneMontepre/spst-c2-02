import { db } from "@/lib/db";

/** Liveness/readiness probe for k8s (GET /api/health). */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
