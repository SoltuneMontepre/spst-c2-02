import { z } from "zod";
import {
  startSession,
  hostNext,
  hostPause,
  hostResume,
  hostExtend,
  hostEnd,
  hostCancel,
  hostExtendSoloLobby,
  hostSetAutoHost,
  hostSetParticipantRole,
  hostAddBot,
  hostRemoveBot,
  hostSwapRoles,
} from "@/lib/game-service";

const roleSchema = z.enum(["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"]);
const profileSchema = z.enum(["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"]);

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum([
      "start",
      "next",
      "pause",
      "resume",
      "extend",
      "end",
      "cancel",
      "extendSoloLobby",
    ]),
  }),
  z.object({ action: z.literal("setAutoHost"), autoHost: z.boolean() }),
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
  z.object({
    action: z.literal("removeBot"),
    participantId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("swapRoles"),
    participantAId: z.string().uuid(),
    participantBId: z.string().uuid(),
  }),
]);

export async function dispatchHostAction(
  userId: string,
  sessionId: string,
  body: unknown,
): Promise<{ ok: true }> {
  const parsed = schema.parse(body);
  switch (parsed.action) {
    case "setAutoHost":
      await hostSetAutoHost(userId, sessionId, parsed.autoHost);
      break;
    case "setRole":
      await hostSetParticipantRole(
        userId,
        sessionId,
        parsed.participantId,
        parsed.role,
        parsed.productivityProfile,
      );
      break;
    case "addBot":
      await hostAddBot(userId, sessionId, parsed.role, parsed.productivityProfile);
      break;
    case "removeBot":
      await hostRemoveBot(userId, sessionId, parsed.participantId);
      break;
    case "swapRoles":
      await hostSwapRoles(userId, sessionId, parsed.participantAId, parsed.participantBId);
      break;
    default: {
      const fns = {
        start: startSession,
        next: hostNext,
        pause: hostPause,
        resume: hostResume,
        extend: hostExtend,
        end: hostEnd,
        cancel: hostCancel,
        extendSoloLobby: hostExtendSoloLobby,
      };
      await fns[parsed.action](userId, sessionId);
    }
  }
  return { ok: true };
}
