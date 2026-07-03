// Bot behavior (SRS §13). Deterministic heuristics under same rules as humans.

import type { Participant, Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { publish } from "./events";
import { clearNamedTimer, scheduleNamedTimer } from "./timer-service";
import {
  produce,
  listForSale,
  buyNow,
  makeOffer,
  respondOffer,
  investUpgrade,
} from "./market-service";
import { createWholesaleOffer, respondWholesale } from "./wholesale-service";
import { applyPolicy } from "./policy-service";
import {
  allowedProductionQuantity,
  producerUnitCostVnd,
  unitValueVnd,
} from "./economy";
import { PHASE_DURATIONS_SEC, POLICIES, UPGRADE_COSTS } from "./scenario";
import type {
  ProducerRoundState,
  ConsumerRoundState,
  GovernmentRoundState,
} from "./role-state";

async function bump(sessionId: string, type: string, data?: unknown): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}

function botCtx(bot: Participant, session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>) {
  return { participant: bot, session };
}

function botParticipants<
  T extends { role: string | null; controlMode: string },
>(bots: T[]): T[] {
  return bots.filter(
    (b) => b.role && (b.controlMode === "BOT_PERMANENT" || b.controlMode === "BOT_TAKEOVER"),
  );
}

/** DECISION: produce, upgrade, government policies (not export). */
export async function runBotDecisions(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.phase !== "DECISION") return;
  const round = await db.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId, number: session.currentRound } },
  });
  const bots = await db.participant.findMany({
    where: { sessionId, isBot: true },
    include: { wallet: true, roleStates: { where: { roundId: round.id }, take: 1 } },
  });

  await db.$transaction(async (tx) => {
    for (const bot of botParticipants(bots)) {
      if (bot.role === "PRODUCER") {
        const state = bot.roleStates[0]?.state as unknown as ProducerRoundState | undefined;
        if (!state || !bot.wallet) continue;

        // Upgrade if economical (§13.1).
        if (session.currentRound < 4 && !state.pendingUpgrade) {
          const nextCost =
            state.profile === "TRADITIONAL"
              ? UPGRADE_COSTS.TRADITIONAL_TO_SOCIAL_AVERAGE
              : state.profile === "SOCIAL_AVERAGE"
                ? UPGRADE_COSTS.SOCIAL_AVERAGE_TO_PIONEER
                : 0;
          const roundsLeft = 4 - session.currentRound;
          if (
            nextCost > 0 &&
            roundsLeft >= 2 &&
            nextCost <= bot.wallet.balanceVnd * 0.4
          ) {
            try {
              await investUpgrade(tx, botCtx(bot, session));
            } catch {
              /* skip if locked or insufficient */
            }
          }
        }

        const allowed = allowedProductionQuantity({
          productionCapacity: state.productionCapacity,
          producedQuantity: state.producedQuantity,
          availableLaborPoints: state.availableLaborPoints,
          individualLaborTime: state.individualLaborTime,
          productionCap: state.productionCap,
          balanceVnd: bot.wallet.balanceVnd,
          unitCostVnd: producerUnitCostVnd(state),
          individualUnitCostVnd: state.individualUnitCostVnd,
        });
        const qty = Math.max(allowed > 0 ? 1 : 0, Math.floor(allowed * 0.75));
        if (qty > 0) await produce(tx, botCtx(bot, session), qty);
      }

      if (bot.role === "GOVERNMENT") {
        const gstate = bot.roleStates[0]?.state as unknown as GovernmentRoundState | undefined;
        if (!gstate || gstate.policyUsed || !bot.wallet) continue;
        const n = session.currentRound;

        if (n === 2) {
          const listings = await tx.listing.count({
            where: { roundId: round.id },
          });
          const coldCost = POLICIES.COLD_STORAGE.perUnitCostVnd;
          if (listings > 0 && bot.wallet.balanceVnd >= coldCost + 2000) {
            const lots = await tx.inventoryLot.findMany({
              where: { sessionId, availableQuantity: { gt: 0 } },
              take: 3,
            });
            if (lots.length > 0) {
              await applyPolicy(tx, botCtx(bot, session), {
                policyType: "COLD_STORAGE",
                targetIds: lots.map((l) => l.id),
              });
            }
          }
        } else if (n === 3) {
          if (bot.wallet.balanceVnd >= POLICIES.INFO_DISCLOSURE.fixedCostVnd) {
            await applyPolicy(tx, botCtx(bot, session), {
              policyType: "INFO_DISCLOSURE",
            });
          } else {
            await applyPolicy(tx, botCtx(bot, session), { policyType: "NONE" });
          }
        } else if (n === 4) {
          await applyPolicy(tx, botCtx(bot, session), { policyType: "NONE" });
        }
      }
    }
  });
  await bump(sessionId, "bot:decisions");
}

const BOT_MARKET_WAVE_COUNT = 6;
const BOT_MARKET_TIMER_PREFIX = "bot-market-wave";

function botMarketTimerName(wave: number): string {
  return `${BOT_MARKET_TIMER_PREFIX}-${wave}`;
}

function marketWaveOffsets(totalMs: number): number[] {
  const safeTotal = Math.max(20_000, totalMs);
  return [0.02, 0.16, 0.32, 0.5, 0.7, 0.88].map((pct) =>
    Math.max(1_000, Math.floor(safeTotal * pct)),
  );
}

export function clearBotMarketTimers(sessionId: string): void {
  for (let wave = 1; wave <= BOT_MARKET_WAVE_COUNT; wave++) {
    clearNamedTimer(sessionId, botMarketTimerName(wave));
  }
}

export function scheduleBotMarketWaves(
  sessionId: string,
  totalMs = PHASE_DURATIONS_SEC.MARKET_OPEN * 1000,
  includeFirst = true,
): void {
  clearBotMarketTimers(sessionId);
  marketWaveOffsets(totalMs).forEach((offset, index) => {
    const wave = index + 1;
    if (!includeFirst && wave === 1) return;
    scheduleNamedTimer(sessionId, botMarketTimerName(wave), offset, () => {
      void runBotMarketWave(sessionId, wave).catch((e) =>
        console.error("bot market wave:", e),
      );
    });
  });
}

/** MARKET_OPEN: start staggered bot trading waves. */
export async function runBotMarket(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.phase !== "MARKET_OPEN") return;
  const remaining = session.phaseEndsAt
    ? session.phaseEndsAt.getTime() - Date.now()
    : PHASE_DURATIONS_SEC.MARKET_OPEN * 1000;
  scheduleBotMarketWaves(sessionId, remaining, false);
  await runBotMarketWave(sessionId, 1);
}

async function runBotMarketWave(sessionId: string, wave: number): Promise<void> {
  const session = await db.gameSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.phase !== "MARKET_OPEN" || session.paused) return;
  const price = unitValueVnd(session.currentRound);
  const round = await db.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId, number: session.currentRound } },
  });
  let actions = 0;

  await db.$transaction(async (tx) => {
    if (wave === 1) {
      actions += await applyBotExportPromotion(tx, session, round.id);
      actions += await listBotProducerRetail(tx, session, round.id, price);
    }

    if (wave === 2) {
      actions += await createBotWholesaleOffers(tx, session, round.id, price);
    }

    if (wave === 3) {
      actions += await respondBotWholesaleOffers(tx, session, round.id, price);
    }

    if (wave === 4) {
      actions += await acceptBotWholesaleCounters(tx, session, round.id);
      actions += await listBotIntermediaryRetail(tx, session);
    }

    if (wave === 5) {
      actions += await runBotConsumerDemand(tx, session, 1);
    }

    if (wave === 6) {
      actions += await respondBotRetailOffers(tx, session, price);
      actions += await runBotConsumerDemand(tx, session, 2);
    }
  });

  await bump(sessionId, "bot:market_wave", { wave, actions });
}

async function applyBotExportPromotion(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  roundId: string,
): Promise<number> {
  const govBot = await tx.participant.findFirst({
    where: { sessionId: session.id, isBot: true, role: "GOVERNMENT" },
    include: {
      wallet: true,
      roleStates: { where: { roundId }, take: 1 },
    },
  });
  const gstate = govBot?.roleStates[0]?.state as unknown as GovernmentRoundState | undefined;
  if (
    !govBot?.wallet ||
    !gstate ||
    gstate.policyUsed ||
    session.currentRound !== 2 ||
    govBot.wallet.balanceVnd < POLICIES.EXPORT_PROMOTION.fixedCostVnd
  ) {
    return 0;
  }

  try {
    await applyPolicy(tx, botCtx(govBot, session), { policyType: "EXPORT_PROMOTION" });
    return 1;
  } catch {
    return 0;
  }
}

async function botProducers(
  tx: Prisma.TransactionClient,
  sessionId: string,
  roundId: string,
) {
  return tx.participant.findMany({
    where: { sessionId, isBot: true, role: "PRODUCER" },
    include: { roleStates: { where: { roundId }, take: 1 } },
  });
}

async function listBotProducerRetail(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  roundId: string,
  price: number,
): Promise<number> {
  let actions = 0;
  const producers = await botProducers(tx, session.id, roundId);
  for (const seller of producers) {
    const pstate = seller.roleStates[0]?.state as unknown as ProducerRoundState | undefined;
    const ask = Math.max(pstate ? producerUnitCostVnd(pstate) : price, price);
    const lots = await tx.inventoryLot.findMany({
      where: {
        ownerParticipantId: seller.id,
        availableQuantity: { gt: 0 },
        status: { in: ["AVAILABLE", "CARRIED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const lot of lots) {
      const retailQty = Math.min(
        lot.availableQuantity,
        Math.max(1, Math.ceil(lot.availableQuantity / 2)),
      );
      if (retailQty <= 0) continue;
      try {
        await listForSale(tx, botCtx(seller, session), {
          inventoryLotId: lot.id,
          quantity: retailQty,
          askPriceVnd: ask,
        });
        actions++;
      } catch {
        /* listing may become unavailable after another action */
      }
    }
  }
  return actions;
}

async function createBotWholesaleOffers(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  roundId: string,
  price: number,
): Promise<number> {
  let actions = 0;
  const producers = await botProducers(tx, session.id, roundId);
  for (const seller of producers) {
    const pstate = seller.roleStates[0]?.state as unknown as ProducerRoundState | undefined;
    const ask = Math.max(pstate ? producerUnitCostVnd(pstate) : price, price);
    const lots = await tx.inventoryLot.findMany({
      where: {
        ownerParticipantId: seller.id,
        availableQuantity: { gt: 0 },
        status: { in: ["AVAILABLE", "CARRIED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const lot of lots) {
      const qty = Math.min(lot.availableQuantity, 2);
      if (qty <= 0) continue;
      try {
        await createWholesaleOffer(tx, botCtx(seller, session), {
          inventoryLotId: lot.id,
          quantity: qty,
          minimumPriceVnd: Math.max(1000, ask - 1000),
        });
        actions++;
      } catch {
        /* skip invalid wholesale attempts */
      }
    }
  }
  return actions;
}

async function respondBotWholesaleOffers(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  roundId: string,
  price: number,
): Promise<number> {
  let actions = 0;
  const intermediaries = await tx.participant.findMany({
    where: { sessionId: session.id, isBot: true, role: "INTERMEDIARY" },
    include: { wallet: true },
  });
  for (const im of intermediaries) {
    if (!im.wallet) continue;
    const wholesale = await tx.wholesaleOffer.findFirst({
      where: { roundId, status: "OPEN" },
      orderBy: [{ minimumPriceVnd: "asc" }, { createdAt: "asc" }],
    });
    if (!wholesale) continue;
    try {
      if (
        wholesale.minimumPriceVnd <= price &&
        im.wallet.balanceVnd >= wholesale.minimumPriceVnd * wholesale.quantity
      ) {
        await respondWholesale(tx, botCtx(im, session), {
          offerId: wholesale.id,
          decision: "ACCEPT",
        });
        actions++;
      } else if (wholesale.minimumPriceVnd > price) {
        await respondWholesale(tx, botCtx(im, session), {
          offerId: wholesale.id,
          decision: "COUNTER",
          counterPriceVnd: Math.max(1000, price),
        });
        actions++;
      }
    } catch {
      /* another buyer may have taken it */
    }
  }
  return actions;
}

async function acceptBotWholesaleCounters(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  roundId: string,
): Promise<number> {
  let actions = 0;
  const producers = await botProducers(tx, session.id, roundId);
  const producerById = new Map(producers.map((p) => [p.id, p]));
  const countered = await tx.wholesaleOffer.findMany({
    where: { roundId, status: "COUNTERED" },
    orderBy: { updatedAt: "asc" },
  });
  for (const offer of countered) {
    const seller = producerById.get(offer.producerId);
    if (!seller) continue;
    try {
      await respondWholesale(tx, botCtx(seller, session), {
        offerId: offer.id,
        decision: "ACCEPT",
      });
      actions++;
    } catch {
      /* skip if trade cannot complete */
    }
  }
  return actions;
}

async function listBotIntermediaryRetail(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
): Promise<number> {
  let actions = 0;
  const intermediaries = await tx.participant.findMany({
    where: { sessionId: session.id, isBot: true, role: "INTERMEDIARY" },
    include: { wallet: true },
  });
  for (const im of intermediaries) {
    const stock = await tx.inventoryLot.findMany({
      where: {
        ownerParticipantId: im.id,
        availableQuantity: { gt: 0 },
        status: { in: ["AVAILABLE", "CARRIED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const lot of stock) {
      const retailAsk = Math.min(30000, lot.unitCostVnd + 2000);
      try {
        await listForSale(tx, botCtx(im, session), {
          inventoryLotId: lot.id,
          quantity: lot.availableQuantity,
          askPriceVnd: retailAsk,
        });
        actions++;
      } catch {
        /* skip stale stock */
      }
    }
  }
  return actions;
}

async function runBotConsumerDemand(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  maxActionsPerConsumer: number,
): Promise<number> {
  let actions = 0;
  const round = await tx.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId: session.id, number: session.currentRound } },
    select: { id: true },
  });
  const consumers = await tx.participant.findMany({
    where: { sessionId: session.id, isBot: true, role: "CONSUMER" },
    include: { wallet: true, roleStates: { where: { roundId: round.id }, take: 1 } },
  });
  for (const consumer of consumers) {
    const state = consumer.roleStates[0]?.state as unknown as ConsumerRoundState | undefined;
    if (!state) continue;
    let need = Math.max(0, state.needTarget - state.fulfilledUnits);
    let attempts = 0;
    while (need > 0 && attempts < maxActionsPerConsumer) {
      attempts++;
      const wallet = await tx.wallet.findUnique({ where: { participantId: consumer.id } });
      if (!wallet) break;
      const listing = await tx.listing.findFirst({
        where: {
          round: { sessionId: session.id, number: session.currentRound },
          status: { in: ["OPEN", "PARTIALLY_FILLED"] },
          availableQuantity: { gt: 0 },
          sellerParticipantId: { not: consumer.id },
        },
        orderBy: [{ askPriceVnd: "asc" }, { createdAt: "asc" }],
      });
      if (!listing) break;
      const maxPay = Math.min(20000, Math.floor(wallet.balanceVnd / Math.max(need, 1)));
      try {
        if (listing.askPriceVnd <= maxPay) {
          await buyNow(tx, botCtx(consumer, session), {
            listingId: listing.id,
            quantity: 1,
          });
          need--;
          actions++;
        } else {
          const offerPrice = Math.max(1000, listing.askPriceVnd - 2000);
          if (offerPrice < listing.askPriceVnd && wallet.balanceVnd >= offerPrice) {
            await makeOffer(tx, botCtx(consumer, session), {
              listingId: listing.id,
              quantity: 1,
              offerPriceVnd: offerPrice,
            });
            actions++;
          }
          break;
        }
      } catch {
        break;
      }
    }
  }
  return actions;
}

async function respondBotRetailOffers(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  price: number,
): Promise<number> {
  let actions = 0;
  const offers = await tx.offer.findMany({
    where: {
      status: "OPEN",
      listing: {
        round: { sessionId: session.id, number: session.currentRound },
        sellerParticipantId: {
          in: (
            await tx.participant.findMany({
              where: {
                sessionId: session.id,
                isBot: true,
                role: { in: ["PRODUCER", "INTERMEDIARY"] },
              },
              select: { id: true },
            })
          ).map((p) => p.id),
        },
      },
    },
    include: { listing: true },
    orderBy: { createdAt: "asc" },
    take: 12,
  });
  for (const offer of offers) {
    if (!offer.listing) continue;
    const seller = await tx.participant.findUnique({ where: { id: offer.toParticipantId } });
    if (!seller?.isBot) continue;
    const acceptFloor = Math.max(1000, Math.min(price, offer.listing.askPriceVnd - 1000));
    try {
      if (offer.offerPriceVnd >= acceptFloor) {
        await respondOffer(tx, botCtx(seller, session), {
          offerId: offer.id,
          decision: "ACCEPT",
        });
        actions++;
      } else if (offer.listing.askPriceVnd - offer.offerPriceVnd >= 3000) {
        await respondOffer(tx, botCtx(seller, session), {
          offerId: offer.id,
          decision: "COUNTER",
          counterPriceVnd: Math.max(1000, offer.listing.askPriceVnd - 1000),
        });
        actions++;
      }
    } catch {
      /* offer/listing may have changed */
    }
  }
  return actions;
}

/** Run bot actions for participants under BOT_TAKEOVER during active phases. */
export async function runBotTakeover(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session?.phase) return;
  if (session.phase === "DECISION") await runBotDecisions(sessionId);
  else if (session.phase === "MARKET_OPEN") await runBotMarketWave(sessionId, 5);
}
