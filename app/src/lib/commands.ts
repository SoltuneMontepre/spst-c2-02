// Idempotent, server-authoritative command pipeline (TECH-IDEMPOTENCY,
// TECH-INTEGRITY, TECH-VALIDATION). Every gameplay mutation flows through here.

import { createHash } from "node:crypto";
import type { Prisma, Participant, GameSession } from "@/generated/prisma/client";
import { db } from "./db";
import { ApiError } from "./api";
import { publish } from "./events";
import { withSessionLock } from "./session-lock";

export type Tx = Prisma.TransactionClient;

export interface CommandContext {
  participant: Participant;
  session: GameSession;
}

export interface RunCommandArgs<T> {
  userId: string;
  sessionId: string;
  clientActionId: string;
  /** @deprecated Ignored — bot traffic constantly bumps stateVersion. */
  expectedStateVersion?: number;
  payload: unknown;
  eventType: string;
  handler: (tx: Tx, ctx: CommandContext) => Promise<T>;
}

export function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
}

/** Resolve the human participant, run the handler atomically with idempotency,
 *  then bump stateVersion and broadcast.
 *
 *  Commands always read the latest session/wallet/role state inside the
 *  transaction. We intentionally do NOT reject on a stale client stateVersion —
 *  bots and other players bump it constantly, which is unrelated to whether
 *  *this* player's produce/buy/list is still valid.
 */
export async function runCommand<T>(args: RunCommandArgs<T>): Promise<T> {
  const participant = await db.participant.findFirst({
    where: { sessionId: args.sessionId, userId: args.userId, isBot: false },
  });
  if (!participant) throw new ApiError("FORBIDDEN", 403);

  if (participant.controlMode === "READ_ONLY_DUPLICATE_TAB") {
    throw new ApiError("READ_ONLY_TAB", 403);
  }
  const requestHash = hashPayload({ action: args.eventType, payload: args.payload });

  // Serialize every mutation for this session so concurrent human commands and
  // bot batches can never interleave and race on wallet/inventory/state.
  return withSessionLock(args.sessionId, async () => {
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

        // Fresh session row — phase/round/pause as of commit time.
        const session = await tx.gameSession.findUniqueOrThrow({
          where: { id: args.sessionId },
        });
        const liveParticipant = await tx.participant.findUniqueOrThrow({
          where: { id: participant.id },
        });

        const out = await args.handler(tx, {
          participant: liveParticipant,
          session,
        });
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
  });
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
  await import("./session-service")
    .then((m) => m.refreshLiveRoom(sessionId))
    .catch((e) => console.error("live-room refresh:", e));

  // Trade handlers return post-commit balances from the same transaction —
  // stamp them onto the live frame so sellers never keep a stale ví.
  const trade = data as
    | {
        sellerParticipantId?: string;
        buyerId?: string;
        sellerBalanceVnd?: number;
        buyerBalanceVnd?: number;
      }
    | null
    | undefined;
  if (
    trade &&
    typeof trade.sellerParticipantId === "string" &&
    typeof trade.sellerBalanceVnd === "number"
  ) {
    const balances: Record<string, number> = {
      [trade.sellerParticipantId]: trade.sellerBalanceVnd,
    };
    if (typeof trade.buyerId === "string" && typeof trade.buyerBalanceVnd === "number") {
      balances[trade.buyerId] = trade.buyerBalanceVnd;
    }
    await import("./live-room")
      .then((m) => m.patchLiveRoomBalances(sessionId, balances))
      .catch((e) => console.error("live-room wallet patch:", e));
  }

  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}
