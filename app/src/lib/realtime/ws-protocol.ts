import { z } from "zod";
import type { GameEvent, HomeStreamSnapshotPayload, StreamSnapshotPayload } from "@/lib/events";

export type ServerOutbound =
  | { op: "connected" }
  | { op: "update"; event: GameEvent }
  | { op: "snapshot" } & StreamSnapshotPayload
  | { op: "dashboard" } & HomeStreamSnapshotPayload
  | { op: "error"; code: string; message?: string };

const commandOp = z
  .object({
    op: z.literal("command"),
    clientActionId: z.string().min(1),
    expectedStateVersion: z.number().int().optional(),
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
  })
  .passthrough();

const hostOp = z
  .object({
    op: z.literal("host"),
    action: z.string(),
  })
  .passthrough();

export const clientInboundSchema = z.discriminatedUnion("op", [
  commandOp,
  hostOp,
  z.object({ op: z.literal("ready"), ready: z.boolean() }),
  z.object({ op: z.literal("phaseReady"), ready: z.boolean() }),
  z.object({ op: z.literal("heartbeat") }),
]);

export type ClientInbound = z.infer<typeof clientInboundSchema>;

export function parseClientInbound(raw: string): ClientInbound | null {
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = clientInboundSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function serverFrame(payload: ServerOutbound): string {
  return JSON.stringify(payload);
}
