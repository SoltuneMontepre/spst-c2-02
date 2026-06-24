// Round settlement (SRS §5.6, §5.8). Computes the final market snapshot and
// resolves unsold inventory (spoilage / cold-storage carry-over).

import { db } from "./db";
import { computeMarketPrice, unitValueVnd } from "./economy";
import type { ConsumerRoundState, IntermediaryRoundState } from "./role-state";

const RETAIL_CHANNELS = ["RETAIL_DIRECT", "RETAIL_INTERMEDIARY", "SYSTEM_EXPORT"] as const;

export async function settleRound(sessionId: string, n: number): Promise<void> {
  const round = await db.round.findUnique({
    where: { sessionId_number: { sessionId, number: n } },
    include: { transactions: true, listings: true, roleStates: true },
  });
  if (!round) return;

  // Expire open offers before settlement (§5.8, §6.4).
  await db.offer.updateMany({
    where: {
      listing: { roundId: round.id },
      status: { in: ["OPEN", "COUNTERED"] },
    },
    data: { status: "EXPIRED" },
  });
  await db.wholesaleOffer.updateMany({
    where: { roundId: round.id, status: { in: ["OPEN", "COUNTERED"] } },
    data: { status: "EXPIRED" },
  });

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

  // Return unsold listed units to their lots, then close listings (§5.8).
  for (const listing of round.listings) {
    if (
      (listing.status === "OPEN" || listing.status === "PARTIALLY_FILLED") &&
      listing.availableQuantity > 0
    ) {
      await db.inventoryLot.update({
        where: { id: listing.inventoryLotId },
        data: {
          availableQuantity: { increment: listing.availableQuantity },
          status: "AVAILABLE",
        },
      });
    }
    await db.listing.update({
      where: { id: listing.id },
      data: { status: "EXPIRED", availableQuantity: 0 },
    });
  }

  // Mark unsold inventory AT_RISK, then spoil or carry (§5.8).
  const unsold = await db.inventoryLot.findMany({
    where: {
      sessionId,
      availableQuantity: { gt: 0 },
      status: { in: ["AVAILABLE", "RESERVED_LISTING", "RESERVED_WHOLESALE"] },
    },
  });
  for (const lot of unsold) {
    await db.inventoryLot.update({
      where: { id: lot.id },
      data: { status: "AT_RISK" },
    });
  }

  const atRisk = await db.inventoryLot.findMany({
    where: {
      sessionId,
      availableQuantity: { gt: 0 },
      status: "AT_RISK",
    },
  });
  let spoiledQuantity = 0;
  for (const lot of atRisk) {
    if (lot.protectionState === "PROTECTED") {
      await db.inventoryLot.update({
        where: { id: lot.id },
        data: { status: "CARRIED", protectionState: "NONE" },
      });
    } else {
      spoiledQuantity += lot.availableQuantity;
      await db.inventoryLot.update({
        where: { id: lot.id },
        data: { status: "SPOILED" },
      });
      const owner = await db.participant.findUnique({
        where: { id: lot.ownerParticipantId },
      });
      if (owner?.role === "INTERMEDIARY") {
        const irs = await db.roleState.findFirst({
          where: { participantId: lot.ownerParticipantId, roundId: round.id },
        });
        if (irs) {
          const istate = irs.state as unknown as IntermediaryRoundState;
          await db.roleState.update({
            where: { id: irs.id },
            data: {
              state: {
                ...istate,
                spoiledQuantity: (istate.spoiledQuantity ?? 0) + lot.availableQuantity,
              } as never,
            },
          });
        }
      }
    }
  }

  await db.marketSnapshot.create({
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
  });

  await db.round.update({
    where: { id: round.id },
    data: { settledAt: new Date(), phase: "SETTLEMENT" },
  });
}
