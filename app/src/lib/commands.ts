// Idempotent, server-authoritative command pipeline (TECH-IDEMPOTENCY,
// TECH-INTEGRITY, TECH-VALIDATION). Every gameplay mutation flows through here.

import { createHash } from "node:crypto";
import type { Prisma, Participant, GameSession } from "@/generated/prisma/client";
import { db } from "./db";
import { ApiError } from "./api";
import { publish } from "./events";

export type Tx = Prisma.TransactionClient;

export interface CommandContext {
  participant: Participant;
  session: GameSession;
}

export interface RunCommandArgs<T> {
  userId: string;
  sessionId: string;
  clientActionId: string;
  expectedStateVersion?: number;
  payload: unknown;
  eventType: string;
  handler: (tx: Tx, ctx: CommandContext) => Promise<T>;
}

export function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
}

/** Resolve the human participant, run the handler atomically with idempotency,
 *  then bump stateVersion and broadcast. */
export async function runCommand<T>(args: RunCommandArgs<T>): Promise<T> {
  const participant = await db.participant.findFirst({
    where: { sessionId: args.sessionId, userId: args.userId, isBot: false },
  });
  if (!participant) throw new ApiError("FORBIDDEN", 403);

  const session = await db.gameSession.findUniqueOrThrow({
    where: { id: args.sessionId },
  });
  if (
    args.expectedStateVersion !== undefined &&
    args.expectedStateVersion !== session.stateVersion
  ) {
    throw new ApiError("STALE_STATE", 409);
  }
  if (participant.controlMode === "READ_ONLY_DUPLICATE_TAB") {
    throw new ApiError("READ_ONLY_TAB", 403);
  }
  const requestHash = hashPayload({ action: args.eventType, payload: args.payload });

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.idempotencyRecord.create({
        data: {
          participantId: participant.id,
          sessionId: args.sessionId,
          clientActionId: args.clientActionId,
          requestHash,
        },
      });
      const out = await args.handler(tx, { participant, session });
      await tx.idempotencyRecord.update({
        where: {
          participantId_clientActionId: {
            participantId: participant.id,
            clientActionId: args.clientActionId,
          },
        },
        data: { response: (out ?? {}) as Prisma.InputJsonValue },
      });
      return out;
    });

    await bumpAndPublish(args.sessionId, args.eventType, result);
    return result;
  } catch (err) {
    // Duplicate clientActionId → return the original response (TECH-IDEMPOTENCY).
    if ((err as { code?: string }).code === "P2002") {
      const prior = await db.idempotencyRecord.findUnique({
        where: {
          participantId_clientActionId: {
            participantId: participant.id,
            clientActionId: args.clientActionId,
          },
        },
      });
      if (prior && prior.requestHash !== requestHash) {
        throw new ApiError("IDEMPOTENCY_CONFLICT", 409);
      }
      return (prior?.response ?? {}) as T;
    }
    throw err;
  }
}

async function bumpAndPublish(
  sessionId: string,
  type: string,
  data?: unknown,
): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}
