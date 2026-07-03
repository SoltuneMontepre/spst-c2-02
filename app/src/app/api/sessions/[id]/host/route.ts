import { z } from "zod";
import { handle, currentUser, unauthorized } from "@/lib/api";
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
  hostAutoFillBots,
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
  z.object({ action: z.literal("autoFillBots") }),
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  return handle(async () => {
    const body = schema.parse(await request.json());
    switch (body.action) {
      case "setAutoHost":
        await hostSetAutoHost(user.id, id, body.autoHost);
        break;
      case "setRole":
        await hostSetParticipantRole(
          user.id,
          id,
          body.participantId,
          body.role,
          body.productivityProfile,
        );
        break;
      case "addBot":
        await hostAddBot(user.id, id, body.role, body.productivityProfile);
        break;
      case "autoFillBots":
        await hostAutoFillBots(user.id, id);
        break;
      case "removeBot":
        await hostRemoveBot(user.id, id, body.participantId);
        break;
      case "swapRoles":
        await hostSwapRoles(user.id, id, body.participantAId, body.participantBId);
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
        await fns[body.action](user.id, id);
      }
    }
    return { ok: true };
  });
}
