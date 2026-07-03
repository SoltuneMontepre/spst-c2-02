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
  hostSetAutoAssignRoles,
  hostSetGuidanceEnabled,
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
    action: z.enum([
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
      case "start":
        await startSession(user.id, id, {
          roleAssignments: body.roleAssignments,
        });
        break;
      case "setAutoHost":
        await hostSetAutoHost(user.id, id, body.autoHost);
        break;
      case "setAutoAssignRoles":
        await hostSetAutoAssignRoles(user.id, id, body.autoAssignRoles);
        break;
      case "setGuidanceEnabled":
        await hostSetGuidanceEnabled(user.id, id, body.guidanceEnabled);
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
