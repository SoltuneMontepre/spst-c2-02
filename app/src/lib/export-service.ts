// System export purchases (SRS §5.10 — Xúc tiến xuất khẩu).

import type { Tx } from "./commands";
import { unitValueVnd } from "./economy";
import { POLICIES } from "./scenario";

interface ExportContext {
  sessionId: string;
  roundId: string;
  roundNumber: number;
  governmentId: string;
  governmentWalletId: string;
}

/** Buy retail listings for system export up to target quantity and budget. */
export async function executeSystemExport(
  tx: Tx,
  ctx: ExportContext,
): Promise<{ purchased: number; spentVnd: number }> {
  const maxPrice = unitValueVnd(ctx.roundNumber);
  const listings = await tx.listing.findMany({
    where: {
      roundId: ctx.roundId,
      status: { in: ["OPEN", "PARTIALLY_FILLED"] },
      availableQuantity: { gt: 0 },
      askPriceVnd: { lte: maxPrice },
    },
    orderBy: [{ askPriceVnd: "asc" }, { createdAt: "asc" }],
  });

  const totalSupply = listings.reduce((s, l) => s + l.availableQuantity, 0);
  let target = Math.max(1, Math.ceil(totalSupply * POLICIES.EXPORT_PROMOTION.demandShare));
  let purchased = 0;
  let spentVnd = 0;

  const govWallet = await tx.wallet.findUniqueOrThrow({
    where: { id: ctx.governmentWalletId },
  });
  let balance = govWallet.balanceVnd;

  for (const listing of listings) {
    if (target <= 0 || balance < listing.askPriceVnd) break;
    const qty = Math.min(1, listing.availableQuantity, target);
    const cost = qty * listing.askPriceVnd;
    if (balance < cost) break;

    await tx.wallet.update({
      where: { id: ctx.governmentWalletId },
      data: { balanceVnd: { decrement: cost } },
    });
    await tx.wallet.update({
      where: { participantId: listing.sellerParticipantId },
      data: { balanceVnd: { increment: cost } },
    });
    await tx.ledgerEntry.createMany({
      data: [
        {
          sessionId: ctx.sessionId,
          roundId: ctx.roundId,
          walletId: ctx.governmentWalletId,
          type: "POLICY_COST",
          amountVnd: -cost,
        },
        {
          sessionId: ctx.sessionId,
          roundId: ctx.roundId,
          walletId: (
            await tx.wallet.findUniqueOrThrow({
              where: { participantId: listing.sellerParticipantId },
            })
          ).id,
          type: "EXPORT_REVENUE",
          amountVnd: cost,
        },
      ],
    });

    const left = listing.availableQuantity - qty;
    await tx.listing.update({
      where: { id: listing.id },
      data: {
        availableQuantity: left,
        status: left === 0 ? "FILLED" : "PARTIALLY_FILLED",
      },
    });

    await tx.transaction.create({
      data: {
        sessionId: ctx.sessionId,
        roundId: ctx.roundId,
        channel: "SYSTEM_EXPORT",
        buyerType: "SYSTEM_EXPORT",
        buyerId: ctx.governmentId,
        sellerId: listing.sellerParticipantId,
        quantity: qty,
        unitPriceVnd: listing.askPriceVnd,
        totalPriceVnd: cost,
        status: "COMPLETED",
      },
    });

    balance -= cost;
    spentVnd += cost;
    purchased += qty;
    target -= qty;
  }

  return { purchased, spentVnd };
}
