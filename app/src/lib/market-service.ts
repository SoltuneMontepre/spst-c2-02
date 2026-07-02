// Retail market engine (SRS §5.5, §6.1). All mutations run inside runCommand,
// so they are atomic and idempotent; here we enforce phase/role/domain rules.

import type { RoundPhase, Role, ProductivityProfile } from "@/generated/prisma/enums";
import { ApiError } from "./api";
import type { Tx, CommandContext } from "./commands";
import type {
  ProducerRoundState,
  ConsumerRoundState,
  IntermediaryRoundState,
} from "./role-state";
import { UPGRADE_COSTS, POLICIES } from "./scenario";
import { isProducerInputLockedAt } from "./producer-input-lock";
import { allowedProductionQuantity, producerUnitCostVnd } from "./economy";

function requirePhase(ctx: CommandContext, phase: RoundPhase): void {
  if (ctx.session.phase !== phase) throw new ApiError("WRONG_PHASE", 409);
}
function requireRole(ctx: CommandContext, role: Role): void {
  if (ctx.participant.role !== role) throw new ApiError("WRONG_ROLE", 403);
}

/** First 15s of DECISION locks producer input (SRS §5.10). Bots skip the lock. */
export function isProducerInputLocked(ctx: CommandContext): boolean {
  return isProducerInputLockedAt({
    phase: ctx.session.phase,
    phaseEndsAt: ctx.session.phaseEndsAt,
    isBot: ctx.participant.isBot,
  });
}

async function currentRound(tx: Tx, sessionId: string, number: number) {
  return tx.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId, number } },
  });
}

function nextProfile(current: ProductivityProfile): ProductivityProfile | null {
  if (current === "TRADITIONAL") return "SOCIAL_AVERAGE";
  if (current === "SOCIAL_AVERAGE") return "PIONEER";
  return null;
}

function upgradeCost(from: ProductivityProfile): number {
  if (from === "TRADITIONAL") return UPGRADE_COSTS.TRADITIONAL_TO_SOCIAL_AVERAGE;
  if (from === "SOCIAL_AVERAGE") return UPGRADE_COSTS.SOCIAL_AVERAGE_TO_PIONEER;
  return 0;
}

/** Producer makes goods during DECISION (SRS §5.5). */
export async function produce(
  tx: Tx,
  ctx: CommandContext,
  quantity: number,
): Promise<{ produced: number }> {
  requirePhase(ctx, "DECISION");
  requireRole(ctx, "PRODUCER");
  if (isProducerInputLocked(ctx)) throw new ApiError("PRODUCER_INPUT_LOCKED", 409);
  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);
  const rs = await tx.roleState.findUniqueOrThrow({
    where: { participantId_roundId: { participantId: ctx.participant.id, roundId: round.id } },
  });
  const state = rs.state as unknown as ProducerRoundState;
  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: ctx.participant.id },
  });

  const unitCost = producerUnitCostVnd(state);
  const remaining = allowedProductionQuantity({
    productionCapacity: state.productionCapacity,
    producedQuantity: state.producedQuantity,
    balanceVnd: wallet.balanceVnd,
    unitCostVnd: unitCost,
    availableLaborPoints: state.availableLaborPoints,
    individualLaborTime: state.individualLaborTime,
    productionCap: state.productionCap,
    individualUnitCostVnd: state.individualUnitCostVnd,
  });
  if (quantity < 0 || quantity > remaining) throw new ApiError("INVALID_QUANTITY", 422);
  if (quantity === 0) return { produced: 0 };

  const cost = quantity * unitCost;
  await tx.wallet.update({
    where: { participantId: ctx.participant.id },
    data: { balanceVnd: { decrement: cost } },
  });
  await tx.ledgerEntry.create({
    data: {
      sessionId: ctx.session.id,
      roundId: round.id,
      walletId: wallet.id,
      type: "PRODUCTION_COST",
      amountVnd: -cost,
    },
  });
  await tx.inventoryLot.create({
    data: {
      sessionId: ctx.session.id,
      roundIdProduced: round.id,
      ownerParticipantId: ctx.participant.id,
      quantity,
      availableQuantity: quantity,
      unitCostVnd: unitCost,
    },
  });
  await tx.roleState.update({
    where: { id: rs.id },
    data: {
      state: { ...state, producedQuantity: state.producedQuantity + quantity } as never,
    },
  });
  return { produced: quantity };
}

/** Cancel/modify production during DECISION (FR-PRODUCER-03). */
export async function cancelProduction(
  tx: Tx,
  ctx: CommandContext,
): Promise<{ refundedVnd: number }> {
  requirePhase(ctx, "DECISION");
  requireRole(ctx, "PRODUCER");
  if (isProducerInputLocked(ctx)) throw new ApiError("PRODUCER_INPUT_LOCKED", 409);

  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);
  const rs = await tx.roleState.findUniqueOrThrow({
    where: { participantId_roundId: { participantId: ctx.participant.id, roundId: round.id } },
  });
  const state = rs.state as unknown as ProducerRoundState;
  if (state.producedQuantity <= 0) return { refundedVnd: 0 };

  const lots = await tx.inventoryLot.findMany({
    where: {
      ownerParticipantId: ctx.participant.id,
      roundIdProduced: round.id,
      status: "AVAILABLE",
    },
  });
  const cancellable = lots.reduce((s, l) => s + l.availableQuantity, 0);
  if (cancellable < state.producedQuantity) {
    throw new ApiError("INVENTORY_RESERVED", 409, "Hàng đã niêm yết hoặc bán sỉ");
  }

  let refund = 0;
  for (const lot of lots) {
    refund += lot.availableQuantity * lot.unitCostVnd;
    await tx.inventoryLot.delete({ where: { id: lot.id } });
  }

  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: ctx.participant.id },
  });
  await tx.wallet.update({
    where: { participantId: ctx.participant.id },
    data: { balanceVnd: { increment: refund } },
  });
  await tx.ledgerEntry.create({
    data: {
      sessionId: ctx.session.id,
      roundId: round.id,
      walletId: wallet.id,
      type: "PRODUCTION_COST",
      amountVnd: refund,
    },
  });
  await tx.roleState.update({
    where: { id: rs.id },
    data: { state: { ...state, producedQuantity: 0 } as never },
  });
  return { refundedVnd: refund };
}

/** Tech upgrade effective next round (FR-PRODUCER-07). */
export async function investUpgrade(
  tx: Tx,
  ctx: CommandContext,
): Promise<{ pendingUpgrade: ProductivityProfile }> {
  requirePhase(ctx, "DECISION");
  requireRole(ctx, "PRODUCER");
  if (ctx.session.currentRound >= 4) throw new ApiError("UPGRADE_NOT_AVAILABLE", 422);
  if (isProducerInputLocked(ctx)) throw new ApiError("PRODUCER_INPUT_LOCKED", 409);

  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);
  const rs = await tx.roleState.findUniqueOrThrow({
    where: { participantId_roundId: { participantId: ctx.participant.id, roundId: round.id } },
  });
  const state = rs.state as unknown as ProducerRoundState;
  if (state.pendingUpgrade) throw new ApiError("UPGRADE_NOT_AVAILABLE", 422);

  const target = nextProfile(state.profile);
  if (!target) throw new ApiError("UPGRADE_NOT_AVAILABLE", 422);

  let cost = upgradeCost(state.profile);
  if (state.techSupportActive) {
    cost = Math.ceil(cost * (1 - POLICIES.TECH_SUPPORT.discountRate));
  }

  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: ctx.participant.id },
  });
  if (wallet.balanceVnd < cost) throw new ApiError("INSUFFICIENT_FUNDS", 409);

  await tx.wallet.update({
    where: { participantId: ctx.participant.id },
    data: { balanceVnd: { decrement: cost } },
  });
  await tx.ledgerEntry.create({
    data: {
      sessionId: ctx.session.id,
      roundId: round.id,
      walletId: wallet.id,
      type: "UPGRADE_COST",
      amountVnd: -cost,
    },
  });
  await tx.roleState.update({
    where: { id: rs.id },
    data: {
      state: {
        ...state,
        pendingUpgrade: target,
        techSupportActive: false,
      } as never,
    },
  });
  return { pendingUpgrade: target };
}

/** Seller lists goods for retail during MARKET_OPEN (SRS §6.1). */
export async function listForSale(
  tx: Tx,
  ctx: CommandContext,
  input: { inventoryLotId: string; quantity: number; askPriceVnd: number },
): Promise<{ listingId: string }> {
  requirePhase(ctx, "MARKET_OPEN");
  if (ctx.participant.role !== "PRODUCER" && ctx.participant.role !== "INTERMEDIARY")
    throw new ApiError("WRONG_ROLE", 403);

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
      status: lot.availableQuantity - input.quantity === 0 ? "RESERVED_LISTING" : lot.status,
    },
  });
  const listing = await tx.listing.create({
    data: {
      roundId: round.id,
      sellerParticipantId: ctx.participant.id,
      sellerType: ctx.participant.role === "PRODUCER" ? "PRODUCER" : "INTERMEDIARY",
      inventoryLotId: lot.id,
      quantity: input.quantity,
      availableQuantity: input.quantity,
      askPriceVnd: input.askPriceVnd,
    },
  });
  return { listingId: listing.id };
}

/** Close a retail listing and return inventory (FR-PRODUCER-04). */
export async function closeListing(
  tx: Tx,
  ctx: CommandContext,
  listingId: string,
): Promise<void> {
  requirePhase(ctx, "MARKET_OPEN");
  if (ctx.participant.role !== "PRODUCER" && ctx.participant.role !== "INTERMEDIARY")
    throw new ApiError("WRONG_ROLE", 403);

  const listing = await tx.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerParticipantId !== ctx.participant.id)
    throw new ApiError("NOT_OWNER", 403);
  if (listing.status !== "OPEN" && listing.status !== "PARTIALLY_FILLED")
    throw new ApiError("LISTING_UNAVAILABLE", 409);

  if (listing.availableQuantity > 0) {
    await tx.inventoryLot.update({
      where: { id: listing.inventoryLotId },
      data: {
        availableQuantity: { increment: listing.availableQuantity },
        status: "AVAILABLE",
      },
    });
  }

  await tx.offer.updateMany({
    where: { listingId: listing.id, status: "OPEN" },
    data: { status: "EXPIRED" },
  });

  await tx.listing.update({
    where: { id: listing.id },
    data: { status: "CLOSED", availableQuantity: 0 },
  });
}

/** Consumer buys now at the ask price (SRS §6.1, atomic transfer). */
export async function buyNow(
  tx: Tx,
  ctx: CommandContext,
  input: { listingId: string; quantity: number },
): Promise<{ transactionId: string }> {
  requirePhase(ctx, "MARKET_OPEN");
  requireRole(ctx, "CONSUMER");

  const listing = await tx.listing.findUnique({ where: { id: input.listingId } });
  if (!listing || (listing.status !== "OPEN" && listing.status !== "PARTIALLY_FILLED"))
    throw new ApiError("LISTING_UNAVAILABLE", 409);
  if (listing.availableQuantity < input.quantity)
    throw new ApiError("INSUFFICIENT_LISTING", 409);

  return executeRetailTrade(tx, ctx, {
    listing,
    buyerId: ctx.participant.id,
    quantity: input.quantity,
    unitPriceVnd: listing.askPriceVnd,
  });
}

/** Consumer makes a counter-offer below the ask price (SRS §6.2). */
export async function makeOffer(
  tx: Tx,
  ctx: CommandContext,
  input: { listingId: string; quantity: number; offerPriceVnd: number },
): Promise<{ offerId: string }> {
  requirePhase(ctx, "MARKET_OPEN");
  requireRole(ctx, "CONSUMER");

  const listing = await tx.listing.findUnique({ where: { id: input.listingId } });
  if (!listing || (listing.status !== "OPEN" && listing.status !== "PARTIALLY_FILLED"))
    throw new ApiError("LISTING_UNAVAILABLE", 409);
  if (listing.availableQuantity < input.quantity)
    throw new ApiError("INSUFFICIENT_LISTING", 409);
  if (input.offerPriceVnd >= listing.askPriceVnd)
    throw new ApiError("OFFER_TOO_HIGH", 422);
  if (listing.sellerParticipantId === ctx.participant.id)
    throw new ApiError("SELF_TRADE", 409);

  const existing = await tx.offer.findFirst({
    where: {
      listingId: listing.id,
      fromParticipantId: ctx.participant.id,
      status: "OPEN",
    },
  });
  if (existing) throw new ApiError("DUPLICATE_OFFER", 409);

  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);
  const rs = await tx.roleState.findUniqueOrThrow({
    where: { participantId_roundId: { participantId: ctx.participant.id, roundId: round.id } },
  });
  const cstate = rs.state as unknown as ConsumerRoundState;
  const reserve = input.offerPriceVnd * input.quantity;
  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: ctx.participant.id },
  });
  const available =
    wallet.balanceVnd - (cstate.reservedOfferVnd ?? 0);
  if (available < reserve) throw new ApiError("INSUFFICIENT_FUNDS", 409);

  const expiresAt = ctx.session.phaseEndsAt ?? new Date(Date.now() + 60_000);
  const offer = await tx.offer.create({
    data: {
      listingId: listing.id,
      fromParticipantId: ctx.participant.id,
      toParticipantId: listing.sellerParticipantId,
      quantity: input.quantity,
      offerPriceVnd: input.offerPriceVnd,
      expiresAt,
    },
  });
  await tx.roleState.update({
    where: { id: rs.id },
    data: {
      state: {
        ...cstate,
        reservedOfferVnd: (cstate.reservedOfferVnd ?? 0) + reserve,
      } as never,
    },
  });
  return { offerId: offer.id };
}

/** Accept, reject, or counter an open retail offer. */
export async function respondOffer(
  tx: Tx,
  ctx: CommandContext,
  input: { offerId: string; decision: "ACCEPT" | "REJECT" | "COUNTER"; counterPriceVnd?: number },
): Promise<{ transactionId?: string; offerId?: string }> {
  requirePhase(ctx, "MARKET_OPEN");

  const offer = await tx.offer.findUnique({
    where: { id: input.offerId },
    include: { listing: true },
  });
  if (!offer || (offer.status !== "OPEN" && offer.status !== "COUNTERED"))
    throw new ApiError("OFFER_UNAVAILABLE", 409);
  if (offer.toParticipantId !== ctx.participant.id)
    throw new ApiError("NOT_OFFER_RECIPIENT", 403);

  if (input.decision === "REJECT") {
    await releaseOfferReservation(tx, ctx.session.id, ctx.session.currentRound, offer);
    await tx.offer.update({ where: { id: offer.id }, data: { status: "REJECTED" } });
    return {};
  }

  if (input.decision === "ACCEPT") {
    if (!offer.listing) throw new ApiError("LISTING_UNAVAILABLE", 409);
    const buyerId =
      ctx.participant.role === "CONSUMER" ? ctx.participant.id : offer.fromParticipantId;
    await releaseOfferReservation(tx, ctx.session.id, ctx.session.currentRound, offer);
    const result = await executeRetailTrade(tx, ctx, {
      listing: offer.listing,
      buyerId,
      quantity: offer.quantity,
      unitPriceVnd: offer.offerPriceVnd,
    });
    await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
    return { transactionId: result.transactionId };
  }

  // COUNTER — seller proposes a new price back to the consumer.
  if (!input.counterPriceVnd) throw new ApiError("MISSING_COUNTER_PRICE", 422);
  if (ctx.participant.role !== "PRODUCER" && ctx.participant.role !== "INTERMEDIARY")
    throw new ApiError("WRONG_ROLE", 403);
  if (!offer.listing) throw new ApiError("LISTING_UNAVAILABLE", 409);
  if (input.counterPriceVnd >= offer.listing.askPriceVnd)
    throw new ApiError("COUNTER_TOO_HIGH", 422);

  await tx.offer.update({ where: { id: offer.id }, data: { status: "COUNTERED" } });
  const expiresAt = ctx.session.phaseEndsAt ?? new Date(Date.now() + 60_000);
  const counter = await tx.offer.create({
    data: {
      listingId: offer.listingId,
      fromParticipantId: ctx.participant.id,
      toParticipantId: offer.fromParticipantId,
      quantity: offer.quantity,
      offerPriceVnd: input.counterPriceVnd,
      parentOfferId: offer.id,
      expiresAt,
    },
  });
  return { offerId: counter.id };
}

async function releaseOfferReservation(
  tx: Tx,
  sessionId: string,
  roundNumber: number,
  offer: { fromParticipantId: string; offerPriceVnd: number; quantity: number },
): Promise<void> {
  const round = await currentRound(tx, sessionId, roundNumber);
  const rs = await tx.roleState.findUnique({
    where: { participantId_roundId: { participantId: offer.fromParticipantId, roundId: round.id } },
  });
  if (!rs) return;
  const cstate = rs.state as unknown as ConsumerRoundState;
  const reserve = offer.offerPriceVnd * offer.quantity;
  await tx.roleState.update({
    where: { id: rs.id },
    data: {
      state: {
        ...cstate,
        reservedOfferVnd: Math.max(0, (cstate.reservedOfferVnd ?? 0) - reserve),
      } as never,
    },
  });
}

async function executeRetailTrade(
  tx: Tx,
  ctx: CommandContext,
  params: {
    listing: {
      id: string;
      sellerParticipantId: string;
      sellerType: string;
      availableQuantity: number;
      inventoryLotId: string;
    };
    buyerId: string;
    quantity: number;
    unitPriceVnd: number;
  },
): Promise<{ transactionId: string }> {
  const { listing, buyerId, quantity, unitPriceVnd } = params;
  if (listing.availableQuantity < quantity) throw new ApiError("INSUFFICIENT_LISTING", 409);

  const total = quantity * unitPriceVnd;
  const buyerWallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: buyerId },
  });
  if (buyerWallet.balanceVnd < total) throw new ApiError("INSUFFICIENT_FUNDS", 409);
  const sellerWallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: listing.sellerParticipantId },
  });
  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);

  await tx.wallet.update({
    where: { participantId: buyerId },
    data: { balanceVnd: { decrement: total } },
  });
  await tx.wallet.update({
    where: { participantId: listing.sellerParticipantId },
    data: { balanceVnd: { increment: total } },
  });
  await tx.ledgerEntry.createMany({
    data: [
      {
        sessionId: ctx.session.id,
        roundId: round.id,
        walletId: buyerWallet.id,
        type: "PURCHASE_COST",
        amountVnd: -total,
      },
      {
        sessionId: ctx.session.id,
        roundId: round.id,
        walletId: sellerWallet.id,
        type: "SALE_REVENUE",
        amountVnd: total,
      },
    ],
  });

  const left = listing.availableQuantity - quantity;
  await tx.listing.update({
    where: { id: listing.id },
    data: { availableQuantity: left, status: left === 0 ? "FILLED" : "PARTIALLY_FILLED" },
  });

  const buyer = await tx.participant.findUniqueOrThrow({ where: { id: buyerId } });
  if (buyer.role === "CONSUMER") {
    const rs = await tx.roleState.findUniqueOrThrow({
      where: { participantId_roundId: { participantId: buyerId, roundId: round.id } },
    });
    const cstate = rs.state as unknown as ConsumerRoundState;
    const towardNeed = Math.min(quantity, Math.max(0, cstate.needTarget - cstate.fulfilledUnits));
    await tx.roleState.update({
      where: { id: rs.id },
      data: {
        state: {
          ...cstate,
          fulfilledUnits: cstate.fulfilledUnits + towardNeed,
          retailSpendingVnd: cstate.retailSpendingVnd + total,
        } as never,
      },
    });
  }

  const seller = await tx.participant.findUniqueOrThrow({
    where: { id: listing.sellerParticipantId },
  });
  if (seller.role === "INTERMEDIARY" && buyer.role === "CONSUMER") {
    const irs = await tx.roleState.findUniqueOrThrow({
      where: { participantId_roundId: { participantId: seller.id, roundId: round.id } },
    });
    const istate = irs.state as unknown as IntermediaryRoundState;
    const producers = new Set(istate.connectedProducerIds ?? []);
    const consumers = new Set(istate.connectedConsumerIds ?? []);
    consumers.add(buyerId);
    await tx.roleState.update({
      where: { id: irs.id },
      data: {
        state: {
          ...istate,
          connectedProducerIds: [...producers],
          connectedConsumerIds: [...consumers],
        } as never,
      },
    });
  }
  if (seller.role === "PRODUCER" && buyer.role === "INTERMEDIARY") {
    const irs = await tx.roleState.findUniqueOrThrow({
      where: { participantId_roundId: { participantId: buyerId, roundId: round.id } },
    });
    const istate = irs.state as unknown as IntermediaryRoundState;
    const producers = new Set(istate.connectedProducerIds ?? []);
    producers.add(seller.id);
    await tx.roleState.update({
      where: { id: irs.id },
      data: {
        state: { ...istate, connectedProducerIds: [...producers] } as never,
      },
    });
  }

  const tradeTx = await tx.transaction.create({
    data: {
      sessionId: ctx.session.id,
      roundId: round.id,
      channel: listing.sellerType === "PRODUCER" ? "RETAIL_DIRECT" : "RETAIL_INTERMEDIARY",
      buyerType: buyer.role === "CONSUMER" ? "CONSUMER" : "INTERMEDIARY",
      buyerId,
      sellerId: listing.sellerParticipantId,
      quantity,
      unitPriceVnd,
      totalPriceVnd: total,
      status: "COMPLETED",
    },
  });
  return { transactionId: tradeTx.id };
}
