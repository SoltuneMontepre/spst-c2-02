// REST routes ported from app/src/app/api/sessions/**. Each handler calls the
// same domain function; the global error handler maps thrown errors to JSON.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireUser } from "../handle";
import { ApiError } from "@/lib/api";
import { createSessionSchema } from "@/lib/create-session-schema";
import {
  createSession,
  joinSession,
  getActiveHostedSession,
  getActiveJoinedSession,
  getSnapshot,
  setReady,
  leaveSession,
  getSessionResult,
} from "@/lib/session-service";
import { joinSessionSchema } from "@/lib/validation";
import { setPhaseReady } from "@/lib/ai-host";
import {
  setOwnLobbyRole,
  startSession,
  hostNext,
  hostPause,
  hostResume,
  hostExtend,
  hostEnd,
  hostCancel,
  hostExtendSoloLobby,
  hostSetAutoHost,
  hostSetAutoAssignRoles,
  hostSetGuidanceEnabled,
  hostSetParticipantRole,
  hostAddBot,
  hostAutoFillBots,
  hostRemoveBot,
  hostSwapRoles,
} from "@/lib/game-service";
import { runCommand } from "@/lib/commands";
import { scheduleBotConsumerReaction } from "@/lib/bots";
import {
  produce,
  listForSale,
  buyNow,
  makeOffer,
  respondOffer,
  cancelProduction,
  investUpgrade,
  closeListing,
} from "@/lib/market-service";
import { createWholesaleOffer, respondWholesale } from "@/lib/wholesale-service";
import { applyPolicy } from "@/lib/policy-service";
import {
  produceSchema,
  cancelProductionSchema,
  investSchema,
  closeListingSchema,
  listSchema,
  buySchema,
  offerSchema,
  respondOfferSchema,
  wholesaleCreateSchema,
  respondWholesaleSchema,
  applyPolicySchema,
} from "@/lib/validation";

function id(req: FastifyRequest): string {
  return (req.params as { id: string }).id;
}

const readySchema = z.object({ ready: z.boolean() });

const lobbyRoleSchema = z.object({
  role: z.enum(["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"]).nullable(),
  productivityProfile: z
    .enum(["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"])
    .nullable()
    .optional(),
});

const roleSchema = z.enum(["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"]);
const profileSchema = z.enum(["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"]);

const hostSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    roleAssignments: z
      .array(
        z.object({
          participantId: z.string().uuid(),
          role: roleSchema,
          productivityProfile: profileSchema.nullable().optional(),
        }),
      )
      .optional(),
  }),
  z.object({
    action: z.enum(["next", "pause", "resume", "extend", "end", "cancel", "extendSoloLobby"]),
  }),
  z.object({ action: z.literal("setAutoHost"), autoHost: z.boolean() }),
  z.object({ action: z.literal("setAutoAssignRoles"), autoAssignRoles: z.boolean() }),
  z.object({ action: z.literal("setGuidanceEnabled"), guidanceEnabled: z.boolean() }),
  z.object({
    action: z.literal("setRole"),
    participantId: z.string().uuid(),
    role: roleSchema.nullable(),
    productivityProfile: profileSchema.nullable().optional(),
  }),
  z.object({
    action: z.literal("addBot"),
    role: roleSchema,
    productivityProfile: profileSchema.nullable().optional(),
  }),
  z.object({ action: z.literal("autoFillBots") }),
  z.object({ action: z.literal("removeBot"), participantId: z.string().uuid() }),
  z.object({
    action: z.literal("swapRoles"),
    participantAId: z.string().uuid(),
    participantBId: z.string().uuid(),
  }),
]);

const commandActionSchema = z.object({
  action: z.enum([
    "produce",
    "cancelProduction",
    "invest",
    "list",
    "closeListing",
    "buy",
    "offer",
    "respondOffer",
    "wholesale",
    "respondWholesale",
    "applyPolicy",
  ]),
});

function cmd<T extends { clientActionId: string; expectedStateVersion?: number }>(
  userId: string,
  sessionId: string,
  p: T,
  eventType: string,
  handler: Parameters<typeof runCommand>[0]["handler"],
) {
  return runCommand({
    userId,
    sessionId,
    clientActionId: p.clientActionId,
    expectedStateVersion: p.expectedStateVersion,
    payload: p,
    eventType,
    handler,
  });
}

export async function registerSessionRoutes(app: FastifyInstance): Promise<void> {
  // ── Create / join / active ──
  app.post("/api/sessions", async (req) => {
    const user = await requireUser(req);
    const config = createSessionSchema.parse(req.body ?? {});
    return createSession(user.id, config);
  });

  app.post("/api/sessions/join", async (req) => {
    const user = await requireUser(req);
    const { code } = joinSessionSchema.parse(req.body);
    return joinSession(user.id, code);
  });

  app.get("/api/sessions/active", async (req) => {
    const user = await requireUser(req);
    const [hosted, joined] = await Promise.all([
      getActiveHostedSession(user.id),
      getActiveJoinedSession(user.id),
    ]);
    return { session: hosted, joined };
  });

  // ── Single session ──
  app.get("/api/sessions/:id", async (req, reply: FastifyReply) => {
    const user = await requireUser(req);
    reply.header("cache-control", "no-store");
    return getSnapshot(user.id, id(req));
  });

  app.get("/api/sessions/:id/result", async (req) => {
    const user = await requireUser(req);
    return getSessionResult(user.id, id(req));
  });

  app.post("/api/sessions/:id/ready", async (req) => {
    const user = await requireUser(req);
    const { ready } = readySchema.parse(req.body);
    await setReady(user.id, id(req), ready);
    return { ok: true };
  });

  app.post("/api/sessions/:id/phase-ready", async (req) => {
    const user = await requireUser(req);
    const { ready } = readySchema.parse(req.body);
    await setPhaseReady(user.id, id(req), ready);
    return { ok: true };
  });

  app.post("/api/sessions/:id/lobby-role", async (req) => {
    const user = await requireUser(req);
    const body = lobbyRoleSchema.parse(req.body);
    await setOwnLobbyRole(user.id, id(req), body.role, body.productivityProfile);
    return { ok: true };
  });

  app.post("/api/sessions/:id/leave", async (req) => {
    const user = await requireUser(req);
    await leaveSession(user.id, id(req));
    return { ok: true };
  });

  // ── Host controls ──
  app.post("/api/sessions/:id/host", async (req) => {
    const user = await requireUser(req);
    const sessionId = id(req);
    const body = hostSchema.parse(req.body);
    switch (body.action) {
      case "start":
        await startSession(user.id, sessionId, { roleAssignments: body.roleAssignments });
        break;
      case "setAutoHost":
        await hostSetAutoHost(user.id, sessionId, body.autoHost);
        break;
      case "setAutoAssignRoles":
        await hostSetAutoAssignRoles(user.id, sessionId, body.autoAssignRoles);
        break;
      case "setGuidanceEnabled":
        await hostSetGuidanceEnabled(user.id, sessionId, body.guidanceEnabled);
        break;
      case "setRole":
        await hostSetParticipantRole(
          user.id,
          sessionId,
          body.participantId,
          body.role,
          body.productivityProfile,
        );
        break;
      case "addBot":
        await hostAddBot(user.id, sessionId, body.role, body.productivityProfile);
        break;
      case "autoFillBots":
        await hostAutoFillBots(user.id, sessionId);
        break;
      case "removeBot":
        await hostRemoveBot(user.id, sessionId, body.participantId);
        break;
      case "swapRoles":
        await hostSwapRoles(user.id, sessionId, body.participantAId, body.participantBId);
        break;
      default: {
        const fns = {
          next: hostNext,
          pause: hostPause,
          resume: hostResume,
          extend: hostExtend,
          end: hostEnd,
          cancel: hostCancel,
          extendSoloLobby: hostExtendSoloLobby,
        };
        await fns[body.action](user.id, sessionId);
      }
    }
    return { ok: true };
  });

  // ── Gameplay commands ──
  app.post("/api/sessions/:id/commands", async (req) => {
    const user = await requireUser(req);
    const sessionId = id(req);
    const body = req.body as Record<string, unknown>;
    const { action } = commandActionSchema.parse(body);

    if (action === "produce") {
      const p = produceSchema.parse(body);
      return cmd(user.id, sessionId, p, "producer:produced", (tx, ctx) => produce(tx, ctx, p.quantity));
    }
    if (action === "cancelProduction") {
      const p = cancelProductionSchema.parse(body);
      return cmd(user.id, sessionId, p, "producer:cancelled", (tx, ctx) => cancelProduction(tx, ctx));
    }
    if (action === "invest") {
      const p = investSchema.parse(body);
      return cmd(user.id, sessionId, p, "producer:invested", (tx, ctx) => investUpgrade(tx, ctx));
    }
    if (action === "list") {
      const p = listSchema.parse(body);
      const result = await cmd(user.id, sessionId, p, "market:listed", (tx, ctx) =>
        listForSale(tx, ctx, {
          inventoryLotId: p.inventoryLotId,
          quantity: p.quantity,
          askPriceVnd: p.askPriceVnd,
        }),
      );
      // Bot customers re-evaluate once goods actually hit the shelf.
      scheduleBotConsumerReaction(sessionId);
      return result;
    }
    if (action === "closeListing") {
      const p = closeListingSchema.parse(body);
      return cmd(user.id, sessionId, p, "market:listing_closed", (tx, ctx) =>
        closeListing(tx, ctx, p.listingId),
      );
    }
    if (action === "buy") {
      const p = buySchema.parse(body);
      return cmd(user.id, sessionId, p, "market:trade_completed", (tx, ctx) =>
        buyNow(tx, ctx, { listingId: p.listingId, quantity: p.quantity }),
      );
    }
    if (action === "offer") {
      const p = offerSchema.parse(body);
      return cmd(user.id, sessionId, p, "market:offer_made", (tx, ctx) => makeOffer(tx, ctx, p));
    }
    if (action === "respondOffer") {
      const p = respondOfferSchema.parse(body);
      return cmd(user.id, sessionId, p, "market:offer_responded", (tx, ctx) =>
        respondOffer(tx, ctx, {
          offerId: p.offerId,
          decision: p.decision,
          counterPriceVnd: p.counterPriceVnd,
        }),
      );
    }
    if (action === "wholesale") {
      const p = wholesaleCreateSchema.parse(body);
      return cmd(user.id, sessionId, p, "wholesale:offered", (tx, ctx) => createWholesaleOffer(tx, ctx, p));
    }
    if (action === "respondWholesale") {
      const p = respondWholesaleSchema.parse(body);
      return cmd(user.id, sessionId, p, "wholesale:responded", (tx, ctx) =>
        respondWholesale(tx, ctx, {
          offerId: p.offerId,
          decision: p.decision,
          counterPriceVnd: p.counterPriceVnd,
          quantity: p.quantity,
        }),
      );
    }
    if (action === "applyPolicy") {
      const p = applyPolicySchema.parse(body);
      return cmd(user.id, sessionId, p, "policy:applied", (tx, ctx) => applyPolicy(tx, ctx, p));
    }
    throw new ApiError("UNKNOWN_ACTION", 400);
  });
}
