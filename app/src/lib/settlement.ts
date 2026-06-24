// Round settlement (SRS §5.6, §5.8). Computes the final market snapshot and
// resolves unsold inventory (spoilage / cold-storage carry-over).

import { db } from "./db";
import { computeMarketPrice, unitValueVnd } from "./economy";
import type { ConsumerRoundState } from "./role-state";

const RETAIL_CHANNELS = ["RETAIL_DIRECT", "RETAIL_INTERMEDIARY", "SYSTEM_EXPORT"] as const;

export async function settleRound(sessionId: string, n: number): Promise<void> {
  const round = await db.round.findUnique({
    where: { sessionId_number: { sessionId, number: n } },
    include: { transactions: true, listings: true, roleStates: true },
  });
  if (!round) return;

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

  // Resolve unsold inventory still on the market (§5.8).
  const atRisk = await db.inventoryLot.findMany({
    where: {
      sessionId,
      availableQuantity: { gt: 0 },
      status: { in: ["AVAILABLE", "RESERVED_LISTING", "RESERVED_WHOLESALE", "AT_RISK"] },
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
