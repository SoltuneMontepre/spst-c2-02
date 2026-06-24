// Wholesale channel: producer → intermediary (SRS §6.2).

import { ApiError } from "./api";
import type { Tx, CommandContext } from "./commands";
import type { RoundPhase } from "@/generated/prisma/enums";

function requirePhase(ctx: CommandContext, phase: RoundPhase): void {
  if (ctx.session.phase !== phase) throw new ApiError("WRONG_PHASE", 409);
}

async function currentRound(tx: Tx, sessionId: string, number: number) {
  return tx.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId, number } },
  });
}

/** Producer lists inventory for wholesale during MARKET_OPEN. */
export async function createWholesaleOffer(
  tx: Tx,
  ctx: CommandContext,
  input: { inventoryLotId: string; quantity: number; minimumPriceVnd: number },
): Promise<{ offerId: string }> {
  requirePhase(ctx, "MARKET_OPEN");
  if (ctx.participant.role !== "PRODUCER") throw new ApiError("WRONG_ROLE", 403);

  const lot = await tx.inventoryLot.findUnique({ where: { id: input.inventoryLotId } });
  if (!lot || lot.ownerParticipantId !== ctx.participant.id)
    throw new ApiError("NOT_OWNER", 403);
  if (lot.availableQuantity < input.quantity)
    throw new ApiError("INSUFFICIENT_INVENTORY", 409);

  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);
  await tx.inventoryLot.update({
    where: { id: lot.id },
    data: {
      availableQuantity: { decrement: input.quantity },
      status: lot.availableQuantity - input.quantity === 0 ? "RESERVED_WHOLESALE" : lot.status,
    },
  });

  const expiresAt = ctx.session.phaseEndsAt ?? new Date(Date.now() + 60_000);
  const offer = await tx.wholesaleOffer.create({
    data: {
      roundId: round.id,
      producerId: ctx.participant.id,
      inventoryLotId: lot.id,
      quantity: input.quantity,
      minimumPriceVnd: input.minimumPriceVnd,
      expiresAt,
    },
  });
  return { offerId: offer.id };
}

/** Intermediary or producer responds to a wholesale negotiation. */
export async function respondWholesale(
  tx: Tx,
  ctx: CommandContext,
  input: { offerId: string; decision: "ACCEPT" | "REJECT" | "COUNTER"; counterPriceVnd?: number },
): Promise<{ transactionId?: string }> {
  requirePhase(ctx, "MARKET_OPEN");

  const offer = await tx.wholesaleOffer.findUnique({
    where: { id: input.offerId },
    include: { inventoryLot: true },
  });
  if (!offer) throw new ApiError("OFFER_UNAVAILABLE", 409);
  if (offer.status !== "OPEN" && offer.status !== "COUNTERED")
    throw new ApiError("OFFER_UNAVAILABLE", 409);

  if (input.decision === "REJECT") {
    if (
      (ctx.participant.role === "INTERMEDIARY" && offer.status === "OPEN") ||
      (ctx.participant.role === "PRODUCER" && offer.status === "COUNTERED")
    ) {
      await releaseWholesaleInventory(tx, offer);
      await tx.wholesaleOffer.update({
        where: { id: offer.id },
        data: { status: "REJECTED" },
      });
    } else {
      throw new ApiError("WRONG_ROLE", 403);
    }
    return {};
  }

  if (input.decision === "COUNTER") {
    if (ctx.participant.role !== "INTERMEDIARY" || offer.status !== "OPEN")
      throw new ApiError("WRONG_ROLE", 403);
    if (!input.counterPriceVnd) throw new ApiError("MISSING_COUNTER_PRICE", 422);
    if (input.counterPriceVnd < offer.minimumPriceVnd)
      throw new ApiError("COUNTER_TOO_LOW", 422);

    await tx.wholesaleOffer.update({
      where: { id: offer.id },
      data: {
        status: "COUNTERED",
        counterPriceVnd: input.counterPriceVnd,
        intermediaryId: ctx.participant.id,
      },
    });
    return {};
  }

  // ACCEPT
  let unitPrice: number;
  let intermediaryId: string;

  if (ctx.participant.role === "INTERMEDIARY" && offer.status === "OPEN") {
    unitPrice = offer.minimumPriceVnd;
    intermediaryId = ctx.participant.id;
  } else if (ctx.participant.role === "PRODUCER" && offer.status === "COUNTERED") {
    if (!offer.counterPriceVnd || !offer.intermediaryId)
      throw new ApiError("OFFER_UNAVAILABLE", 409);
    unitPrice = offer.counterPriceVnd;
    intermediaryId = offer.intermediaryId;
  } else {
    throw new ApiError("WRONG_ROLE", 403);
  }

  const result = await executeWholesaleTrade(tx, ctx, offer, intermediaryId, unitPrice);
  await tx.wholesaleOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
  return { transactionId: result.transactionId };
}

async function executeWholesaleTrade(
  tx: Tx,
  ctx: CommandContext,
  offer: {
    id: string;
    producerId: string;
    inventoryLotId: string;
    quantity: number;
    inventoryLot: { unitCostVnd: number };
  },
  intermediaryId: string,
  unitPriceVnd: number,
): Promise<{ transactionId: string }> {
  const total = offer.quantity * unitPriceVnd;
  const buyerWallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: intermediaryId },
  });
  if (buyerWallet.balanceVnd < total) throw new ApiError("INSUFFICIENT_FUNDS", 409);
  const sellerWallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: offer.producerId },
  });
  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);

  await tx.wallet.update({
    where: { participantId: intermediaryId },
    data: { balanceVnd: { decrement: total } },
  });
  await tx.wallet.update({
    where: { participantId: offer.producerId },
    data: { balanceVnd: { increment: total } },
  });
  await tx.ledgerEntry.createMany({
    data: [
      {
        sessionId: ctx.session.id,
        roundId: round.id,
        walletId: buyerWallet.id,
        type: "WHOLESALE_COST",
        amountVnd: -total,
      },
      {
        sessionId: ctx.session.id,
        roundId: round.id,
        walletId: sellerWallet.id,
        type: "WHOLESALE_REVENUE",
        amountVnd: total,
      },
    ],
  });

  // Transfer inventory to intermediary as a new lot.
  const producerLot = await tx.inventoryLot.findUniqueOrThrow({
    where: { id: offer.inventoryLotId },
  });
  await tx.inventoryLot.update({
    where: { id: offer.inventoryLotId },
    data: {
      quantity: { decrement: offer.quantity },
      status: producerLot.quantity - offer.quantity <= 0 ? "SOLD" : producerLot.status,
    },
  });
  await tx.inventoryLot.create({
    data: {
      sessionId: ctx.session.id,
      roundIdProduced: round.id,
      ownerParticipantId: intermediaryId,
      quantity: offer.quantity,
      availableQuantity: offer.quantity,
      unitCostVnd: unitPriceVnd,
      status: "AVAILABLE",
    },
  });

  const tradeTx = await tx.transaction.create({
    data: {
      sessionId: ctx.session.id,
      roundId: round.id,
      channel: "WHOLESALE",
      buyerType: "INTERMEDIARY",
      buyerId: intermediaryId,
      sellerId: offer.producerId,
      quantity: offer.quantity,
      unitPriceVnd,
      totalPriceVnd: total,
      status: "COMPLETED",
    },
  });
  return { transactionId: tradeTx.id };
}

async function releaseWholesaleInventory(
  tx: Tx,
  offer: { inventoryLotId: string; quantity: number },
): Promise<void> {
  await tx.inventoryLot.update({
    where: { id: offer.inventoryLotId },
    data: {
      availableQuantity: { increment: offer.quantity },
      status: "AVAILABLE",
    },
  });
}
