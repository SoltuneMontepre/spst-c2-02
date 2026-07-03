// Round settlement (SRS §5.6, §5.8). Computes the final market snapshot and
// resolves unsold inventory (spoilage / cold-storage carry-over).

import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import { computeMarketPrice, unitValueVnd } from "./economy";
import type { ConsumerRoundState, IntermediaryRoundState } from "./role-state";

const RETAIL_CHANNELS = ["RETAIL_DIRECT", "RETAIL_INTERMEDIARY", "SYSTEM_EXPORT"] as const;

export async function settleRound(sessionId: string, n: number): Promise<void> {
  const round = await db.round.findUnique({
    where: { sessionId_number: { sessionId, number: n } },
    include: {
      transactions: true,
      listings: true,
      roleStates: true,
      snapshots: { where: { isFinal: true }, take: 1 },
    },
  });
  if (!round) return;
  if (round.settledAt) return;
  if (round.snapshots.length > 0) {
    await db.round.update({
      where: { id: round.id },
      data: { settledAt: new Date(), phase: "SETTLEMENT" },
    });
    return;
  }

  const retail = round.transactions.filter(
    (t) => t.status === "COMPLETED" && RETAIL_CHANNELS.includes(t.channel as never),
  );
  const price = computeMarketPrice(
    retail.map((t) => ({ unitPriceVnd: t.unitPriceVnd, quantity: t.quantity })),
  );

  const wholesaleQuantity = round.transactions
    .filter((t) => t.status === "COMPLETED" && t.channel === "WHOLESALE")
    .reduce((sum, t) => sum + t.quantity, 0);
  const retailSoldQuantity = retail.reduce((sum, t) => sum + t.quantity, 0);
  const supplyQuantity = round.listings.reduce((sum, l) => sum + l.quantity, 0);
  const demandQuantity = round.roleStates
    .filter((r) => r.role === "CONSUMER")
    .reduce((sum, r) => sum + (r.state as unknown as ConsumerRoundState).needTarget, 0);

  // Unsold inventory still tied up in listings, wholesale reservations, or
  // never listed at all — fetched once and reasoned about entirely in memory
  // before any writes go out (§5.8).
  const unsold = await db.inventoryLot.findMany({
    where: {
      sessionId,
      availableQuantity: { gt: 0 },
      status: { in: ["AVAILABLE", "RESERVED_LISTING", "RESERVED_WHOLESALE"] },
    },
  });

  const ownerIds = [...new Set(unsold.map((lot) => lot.ownerParticipantId))];
  const owners = ownerIds.length
    ? await db.participant.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, role: true },
      })
    : [];
  const ownerRoleById = new Map(owners.map((o) => [o.id, o.role]));

  const carriedLotIds: string[] = [];
  const spoiledLotIds: string[] = [];
  const spoiledByOwner = new Map<string, number>();
  let spoiledQuantity = 0;

  for (const lot of unsold) {
    if (lot.protectionState === "PROTECTED") {
      carriedLotIds.push(lot.id);
      continue;
    }
    spoiledLotIds.push(lot.id);
    spoiledQuantity += lot.availableQuantity;
    if (ownerRoleById.get(lot.ownerParticipantId) === "INTERMEDIARY") {
      spoiledByOwner.set(
        lot.ownerParticipantId,
        (spoiledByOwner.get(lot.ownerParticipantId) ?? 0) + lot.availableQuantity,
      );
    }
  }

  const intermediaryRoleStates = spoiledByOwner.size
    ? await db.roleState.findMany({
        where: { participantId: { in: [...spoiledByOwner.keys()] }, roundId: round.id },
      })
    : [];

  // Return unsold listed units to their lots (per-lot increments differ, so
  // each stays a separate update — but all are queued, not awaited, until
  // the closing transaction below).
  const returningListings = round.listings.filter(
    (l) => (l.status === "OPEN" || l.status === "PARTIALLY_FILLED") && l.availableQuantity > 0,
  );

  const writes: Prisma.PrismaPromise<unknown>[] = [
    db.offer.updateMany({
      where: { listing: { roundId: round.id }, status: { in: ["OPEN", "COUNTERED"] } },
      data: { status: "EXPIRED" },
    }),
    db.wholesaleOffer.updateMany({
      where: { roundId: round.id, status: { in: ["OPEN", "COUNTERED"] } },
      data: { status: "EXPIRED" },
    }),
    ...returningListings.map((listing) =>
      db.inventoryLot.update({
        where: { id: listing.inventoryLotId },
        data: { availableQuantity: { increment: listing.availableQuantity }, status: "AVAILABLE" },
      }),
    ),
  ];

  if (round.listings.length > 0) {
    writes.push(
      db.listing.updateMany({
        where: { id: { in: round.listings.map((l) => l.id) } },
        data: { status: "EXPIRED", availableQuantity: 0 },
      }),
    );
  }
  if (carriedLotIds.length > 0) {
    writes.push(
      db.inventoryLot.updateMany({
        where: { id: { in: carriedLotIds } },
        data: { status: "CARRIED", protectionState: "NONE" },
      }),
    );
  }
  if (spoiledLotIds.length > 0) {
    writes.push(
      db.inventoryLot.updateMany({
        where: { id: { in: spoiledLotIds } },
        data: { status: "SPOILED" },
      }),
    );
  }
  for (const irs of intermediaryRoleStates) {
    const istate = irs.state as unknown as IntermediaryRoundState;
    const delta = spoiledByOwner.get(irs.participantId) ?? 0;
    writes.push(
      db.roleState.update({
        where: { id: irs.id },
        data: {
          state: { ...istate, spoiledQuantity: (istate.spoiledQuantity ?? 0) + delta } as never,
        },
      }),
    );
  }

  writes.push(
    db.marketSnapshot.create({
      data: {
        roundId: round.id,
        stateVersion: 0,
        supplyQuantity,
        demandQuantity,
        retailSoldQuantity,
        wholesaleQuantity,
        spoiledQuantity,
        unitValueVnd: round.unitValueVnd ?? unitValueVnd(n),
        marketPriceNumeratorVndUnits: price.numeratorVndUnits,
        marketPriceDenominatorUnits: price.denominatorUnits,
        marketPriceVnd: price.marketPriceVnd,
        isFinal: true,
      },
    }),
    db.round.update({
      where: { id: round.id },
      data: { settledAt: new Date(), phase: "SETTLEMENT" },
    }),
  );

  await db.$transaction(writes);
}
