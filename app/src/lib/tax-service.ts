// Sales tax: a cut of every retail/wholesale trade routed to the government
// wallet, so the state has real income instead of only spending its budget.

import type { Tx } from "./commands";
import { SCENARIO } from "./scenario";

/** Government wallet for the session, or null if this composition has no state seat. */
async function findGovernmentWallet(
  tx: Tx,
  sessionId: string,
): Promise<{ participantId: string; walletId: string } | null> {
  const gov = await tx.participant.findFirst({
    where: { sessionId, role: "GOVERNMENT" },
    include: { wallet: true },
  });
  if (!gov?.wallet) return null;
  return { participantId: gov.id, walletId: gov.wallet.id };
}

/**
 * Skims the sales tax off a trade's total price and credits it to the
 * government wallet. Returns the net amount the seller actually receives.
 * No-op (full amount to seller) when the session has no government seat.
 */
export async function collectSalesTax(
  tx: Tx,
  params: { sessionId: string; roundId: string; totalPriceVnd: number },
): Promise<{ netSellerVnd: number; taxVnd: number }> {
  const gov = await findGovernmentWallet(tx, params.sessionId);
  if (!gov) return { netSellerVnd: params.totalPriceVnd, taxVnd: 0 };

  const taxVnd = Math.round(params.totalPriceVnd * SCENARIO.salesTaxRate);
  if (taxVnd <= 0) return { netSellerVnd: params.totalPriceVnd, taxVnd: 0 };

  await tx.wallet.update({
    where: { id: gov.walletId },
    data: { balanceVnd: { increment: taxVnd } },
  });
  await tx.ledgerEntry.create({
    data: {
      sessionId: params.sessionId,
      roundId: params.roundId,
      walletId: gov.walletId,
      type: "TAX_REVENUE",
      amountVnd: taxVnd,
    },
  });

  return { netSellerVnd: params.totalPriceVnd - taxVnd, taxVnd };
}
