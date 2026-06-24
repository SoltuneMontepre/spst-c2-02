// Bot behavior (SRS §13). Deterministic heuristics under same rules as humans.

import type { Participant } from "@/generated/prisma/client";
import { db } from "./db";
import { publish } from "./events";
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
import { allowedProductionQuantity, unitValueVnd, individualUnitCostVnd } from "./economy";
import { POLICIES, UPGRADE_COSTS } from "./scenario";
import type {
  ProducerRoundState,
  ConsumerRoundState,
  GovernmentRoundState,
} from "./role-state";

async function bump(sessionId: string, type: string): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: s.stateVersion });
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
          availableLaborPoints: state.availableLaborPoints,
          individualLaborTime: state.individualLaborTime,
          productionCap: state.productionCap,
          balanceVnd: bot.wallet.balanceVnd,
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

/** MARKET_OPEN: trade + export promotion if not yet used. */
export async function runBotMarket(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.phase !== "MARKET_OPEN") return;
  const price = unitValueVnd(session.currentRound);
  const round = await db.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId, number: session.currentRound } },
  });

  await db.$transaction(async (tx) => {
    // Government export on round 2 if no policy used yet (§13.4).
    const govBot = await tx.participant.findFirst({
      where: { sessionId, isBot: true, role: "GOVERNMENT" },
      include: {
        wallet: true,
        roleStates: { where: { roundId: round.id }, take: 1 },
      },
    });
    const gstate = govBot?.roleStates[0]?.state as unknown as GovernmentRoundState | undefined;
    if (
      govBot?.wallet &&
      gstate &&
      !gstate.policyUsed &&
      session.currentRound === 2 &&
      govBot.wallet.balanceVnd >= POLICIES.EXPORT_PROMOTION.fixedCostVnd
    ) {
      await applyPolicy(tx, botCtx(govBot, session), {
        policyType: "EXPORT_PROMOTION",
      });
    }

    const producers = await db.participant.findMany({
      where: { sessionId, isBot: true, role: "PRODUCER" },
      include: { roleStates: { where: { roundId: round.id }, take: 1 } },
    });
    for (const seller of producers) {
      const pstate = seller.roleStates[0]?.state as unknown as ProducerRoundState | undefined;
      const ask = Math.max(
        pstate?.individualUnitCostVnd ?? price,
        price,
      );
      const lots = await tx.inventoryLot.findMany({
        where: {
          ownerParticipantId: seller.id,
          availableQuantity: { gt: 0 },
          status: { in: ["AVAILABLE", "CARRIED"] },
        },
      });
      for (const lot of lots) {
        const qty = Math.min(lot.availableQuantity, 2);
        if (qty > 0) {
          await createWholesaleOffer(tx, botCtx(seller, session), {
            inventoryLotId: lot.id,
            quantity: qty,
            minimumPriceVnd: Math.max(1000, ask - 1000),
          });
        }
      }
      const lotsAfter = await tx.inventoryLot.findMany({
        where: {
          ownerParticipantId: seller.id,
          availableQuantity: { gt: 0 },
          status: { in: ["AVAILABLE", "CARRIED"] },
        },
      });
      for (const lot of lotsAfter) {
        await listForSale(tx, botCtx(seller, session), {
          inventoryLotId: lot.id,
          quantity: lot.availableQuantity,
          askPriceVnd: ask,
        });
      }
    }

    const intermediaries = await db.participant.findMany({
      where: { sessionId, isBot: true, role: "INTERMEDIARY" },
      include: { wallet: true },
    });
    for (const im of intermediaries) {
      if (!im.wallet) continue;
      const wholesale = await tx.wholesaleOffer.findFirst({
        where: { roundId: round.id, status: "OPEN" },
        orderBy: { minimumPriceVnd: "asc" },
      });
      if (wholesale) {
        if (wholesale.minimumPriceVnd <= price && im.wallet.balanceVnd >= wholesale.minimumPriceVnd * wholesale.quantity) {
          await respondWholesale(tx, botCtx(im, session), {
            offerId: wholesale.id,
            decision: "ACCEPT",
          });
        } else if (wholesale.minimumPriceVnd > price) {
          await respondWholesale(tx, botCtx(im, session), {
            offerId: wholesale.id,
            decision: "COUNTER",
            counterPriceVnd: Math.max(1000, price),
          });
        }
      }
      const stock = await tx.inventoryLot.findMany({
        where: {
          ownerParticipantId: im.id,
          availableQuantity: { gt: 0 },
          status: { in: ["AVAILABLE", "CARRIED"] },
        },
      });
      for (const lot of stock) {
        const retailAsk = Math.min(30000, lot.unitCostVnd + 2000);
        await listForSale(tx, botCtx(im, session), {
          inventoryLotId: lot.id,
          quantity: lot.availableQuantity,
          askPriceVnd: retailAsk,
        });
      }
    }

    const consumers = await db.participant.findMany({
      where: { sessionId, isBot: true, role: "CONSUMER" },
      include: { wallet: true, roleStates: { where: { roundId: round.id }, take: 1 } },
    });
    for (const consumer of consumers) {
      const state = consumer.roleStates[0]?.state as unknown as ConsumerRoundState | undefined;
      if (!state) continue;
      let need = Math.max(0, state.needTarget - state.fulfilledUnits);
      while (need > 0) {
        const wallet = await tx.wallet.findUnique({ where: { participantId: consumer.id } });
        if (!wallet) break;
        const listing = await tx.listing.findFirst({
          where: {
            round: { sessionId, number: session.currentRound },
            status: { in: ["OPEN", "PARTIALLY_FILLED"] },
            availableQuantity: { gt: 0 },
            sellerParticipantId: { not: consumer.id },
          },
          orderBy: [{ askPriceVnd: "asc" }, { createdAt: "asc" }],
        });
        if (!listing) break;
        const maxPay = Math.min(20000, Math.floor(wallet.balanceVnd / need));
        if (listing.askPriceVnd <= maxPay) {
          await buyNow(tx, botCtx(consumer, session), {
            listingId: listing.id,
            quantity: 1,
          });
          need--;
        } else {
          const offerPrice = Math.max(1000, listing.askPriceVnd - 2000);
          if (offerPrice < listing.askPriceVnd && wallet.balanceVnd >= offerPrice) {
            await makeOffer(tx, botCtx(consumer, session), {
              listingId: listing.id,
              quantity: 1,
              offerPriceVnd: offerPrice,
            });
          }
          break;
        }
      }
    }
  });
  await bump(sessionId, "bot:market");
}

/** Run bot actions for participants under BOT_TAKEOVER during active phases. */
export async function runBotTakeover(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session?.phase) return;
  if (session.phase === "DECISION") await runBotDecisions(sessionId);
  else if (session.phase === "MARKET_OPEN") await runBotMarket(sessionId);
}
