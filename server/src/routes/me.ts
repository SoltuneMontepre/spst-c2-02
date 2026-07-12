// REST routes ported from app/src/app/api/me/**.

import type { FastifyInstance, FastifyReply } from "fastify";
import { requireUser } from "../handle";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validation";
import { ACTIVE_STATUSES, getHomeDashboard } from "@/lib/session-service";
import { getProfileDashboard } from "@/lib/profile-service";

export async function registerMeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/me", async (req) => {
    const user = await requireUser(req);
    return db.user.findUniqueOrThrow({
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
  });

  app.patch("/api/me", async (req) => {
    const user = await requireUser(req);
    const data = updateProfileSchema.parse(req.body);
    return db.user.update({
      where: { id: user.id },
      data,
      select: { id: true, displayName: true, avatarUrl: true, school: true, gradeClass: true },
    });
  });

  app.delete("/api/me", async (req) => {
    const user = await requireUser(req);
    const activeHostCount = await db.gameSession.count({
      where: { hostUserId: user.id, status: { in: [...ACTIVE_STATUSES] } },
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

  app.get("/api/me/sessions", async (req) => {
    const user = await requireUser(req);
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

  app.get("/api/me/home-dashboard", async (req, reply: FastifyReply) => {
    const user = await requireUser(req);
    reply.header("cache-control", "no-store");
    return getHomeDashboard(user.id);
  });

  app.get("/api/me/profile-dashboard", async (req, reply: FastifyReply) => {
    const user = await requireUser(req);
    reply.header("cache-control", "no-store");
    return getProfileDashboard(user.id);
  });
}
