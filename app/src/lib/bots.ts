// Bot behavior (SRS §13). Seeded variation keeps decisions reproducible.

import type { Participant, Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { publish } from "./events";
import { withSessionLock } from "./session-lock";
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
  afterTaxBreakevenAskVnd,
  producerUnitCostVnd,
  unitValueVnd,
} from "./economy";
import { PHASE_DURATIONS_SEC, POLICIES, UPGRADE_COSTS } from "./scenario";
import { MIN_PRICE_VND, MAX_PRICE_VND, PRICE_STEP_VND } from "./money";
import type {
  ProducerRoundState,
  ConsumerRoundState,
  GovernmentRoundState,
} from "./role-state";

type BotTemperament = "CAUTIOUS" | "BALANCED" | "BOLD";
type BotSession = Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>;

const BOT_TEMPERAMENTS: Record<
  BotTemperament,
  {
    productionShare: [number, number];
    upgradeBalanceShare: number;
    askSteps: [number, number];
    /**
     * Thrifty (30%): steps vs market going rate — usually at/below market.
     * Impulse (70%): usually at/slightly above market.
     */
    buyOffsetSteps: [number, number];
    impulseOffsetSteps: [number, number];
    offerDiscountSteps: [number, number];
    sellerConcessionSteps: [number, number];
  }
> = {
  CAUTIOUS: {
    productionShare: [0.55, 0.75],
    upgradeBalanceShare: 0.3,
    askSteps: [0, 1],
    buyOffsetSteps: [-4, -1],
    impulseOffsetSteps: [-1, 2],
    offerDiscountSteps: [2, 4],
    sellerConcessionSteps: [0, 1],
  },
  BALANCED: {
    productionShare: [0.7, 0.9],
    upgradeBalanceShare: 0.4,
    askSteps: [1, 2],
    buyOffsetSteps: [-3, 0],
    impulseOffsetSteps: [0, 3],
    offerDiscountSteps: [2, 3],
    sellerConcessionSteps: [0, 1],
  },
  BOLD: {
    productionShare: [0.85, 1],
    upgradeBalanceShare: 0.5,
    askSteps: [1, 3],
    buyOffsetSteps: [-2, 1],
    impulseOffsetSteps: [1, 4],
    offerDiscountSteps: [1, 3],
    sellerConcessionSteps: [1, 2],
  },
};

/** 70% impulse buy-now / 30% thrifty negotiate. */
const CONSUMER_BUY_NOW_RATE = 0.7;

function seededUnit(...parts: Array<string | number>): number {
  const seed = parts.join(":");
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return (hash >>> 0) / 4294967296;
}

function seededInt(
  min: number,
  max: number,
  ...parts: Array<string | number>
): number {
  if (max <= min) return min;
  return min + Math.floor(seededUnit(...parts) * (max - min + 1));
}

function temperament(bot: Participant, session: BotSession): BotTemperament {
  const options: BotTemperament[] = ["CAUTIOUS", "BALANCED", "BOLD"];
  return options[
    seededInt(
      0,
      options.length - 1,
      session.id,
      session.currentRound,
      bot.id,
      "temperament",
    )
  ];
}

function botConfig(bot: Participant, session: BotSession) {
  return BOT_TEMPERAMENTS[temperament(bot, session)];
}

/**
 * Willingness ceiling: 70/30 impulse/thrifty still applies, but both paths
 * are random offsets around the live market going rate — not bare social 10k
 * and not a hard "never above market" cap.
 */
function consumerBuyCeilingVnd(
  bot: Participant,
  session: BotSession,
  purpose: string,
  mode: "thrifty" | "impulse",
  marketGoingRateVnd: number,
): number {
  const config = botConfig(bot, session);
  const [lo, hi] =
    mode === "impulse" ? config.impulseOffsetSteps : config.buyOffsetSteps;
  const offset = botInt(bot, session, purpose, lo, hi);
  return Math.min(
    MAX_PRICE_VND,
    Math.max(MIN_PRICE_VND, marketGoingRateVnd + offset * PRICE_STEP_VND),
  );
}

function botInt(
  bot: Participant,
  session: BotSession,
  purpose: string,
  min: number,
  max: number,
): number {
  return seededInt(min, max, session.id, session.currentRound, bot.id, purpose);
}

function medianInt(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  // Round even medians to the price grid.
  return (
    Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) / PRICE_STEP_VND) *
    PRICE_STEP_VND
  );
}

/**
 * Live market anchor for bot asks — not bare social unit value (10k).
 * Prefer human shelf asks + clears this round, else prior-round market price.
 */
async function collectMarketPriceSamples(
  tx: Prisma.TransactionClient,
  session: { id: string; currentRound: number },
): Promise<{ social: number; samples: number[] }> {
  const social = unitValueVnd(session.currentRound);
  const samples: number[] = [];

  if (session.currentRound > 1) {
    const prev = await tx.marketSnapshot.findFirst({
      where: {
        isFinal: true,
        marketPriceVnd: { not: null },
        round: {
          sessionId: session.id,
          number: session.currentRound - 1,
        },
      },
      select: { marketPriceVnd: true },
      orderBy: { capturedAt: "desc" },
    });
    if (prev?.marketPriceVnd != null && prev.marketPriceVnd > 0) {
      samples.push(prev.marketPriceVnd);
    }
  }

  const round = await tx.round.findUnique({
    where: {
      sessionId_number: {
        sessionId: session.id,
        number: session.currentRound,
      },
    },
    select: { id: true },
  });
  if (!round) return { social, samples };

  const listings = await tx.listing.findMany({
    where: {
      roundId: round.id,
      status: { in: ["OPEN", "PARTIALLY_FILLED"] },
      availableQuantity: { gt: 0 },
    },
    select: { askPriceVnd: true, sellerParticipantId: true },
  });
  if (listings.length > 0) {
    const sellers = await tx.participant.findMany({
      where: {
        id: { in: [...new Set(listings.map((l) => l.sellerParticipantId))] },
      },
      select: { id: true, isBot: true },
    });
    const isBot = new Map(sellers.map((s) => [s.id, s.isBot]));
    const humanAsks = listings
      .filter((l) => !isBot.get(l.sellerParticipantId))
      .map((l) => l.askPriceVnd);
    const pool =
      humanAsks.length > 0
        ? humanAsks
        : listings.map((l) => l.askPriceVnd);
    samples.push(...pool);
  }

  const trades = await tx.transaction.findMany({
    where: {
      roundId: round.id,
      status: "COMPLETED",
      channel: { in: ["RETAIL_DIRECT", "RETAIL_INTERMEDIARY"] },
    },
    select: { unitPriceVnd: true },
  });
  if (trades.length > 0) {
    samples.push(...trades.map((t) => t.unitPriceVnd));
  }

  return { social, samples };
}

/** Seller reference — track the going market (median), not a single outlier ask. */
async function observeMarketReferenceVnd(
  tx: Prisma.TransactionClient,
  session: { id: string; currentRound: number },
): Promise<number> {
  const { social, samples } = await collectMarketPriceSamples(tx, session);
  if (samples.length === 0) return social;
  return Math.min(MAX_PRICE_VND, Math.max(social, medianInt(samples)));
}

/** Going market rate for consumer willingness (± temperament offsets). */
async function observeMarketGoingRateVnd(
  tx: Prisma.TransactionClient,
  session: { id: string; currentRound: number },
): Promise<number> {
  return observeMarketReferenceVnd(tx, session);
}

function botAskPrice(
  bot: Participant,
  session: BotSession,
  purpose: string,
  referencePriceVnd: number,
  floorPriceVnd: number,
): number {
  const [minStep, maxStep] = botConfig(bot, session).askSteps;
  const step = botInt(bot, session, purpose, minStep, maxStep);
  // Never list below after-tax cost recovery — leave ≥1 step headroom above
  // floor so buyers can counter-offer and bots still have room to reply.
  const costFloor = afterTaxBreakevenAskVnd(floorPriceVnd);
  const listFloor = Math.min(MAX_PRICE_VND, costFloor + PRICE_STEP_VND);
  return Math.max(listFloor, referencePriceVnd + step * PRICE_STEP_VND, floorPriceVnd);
}

/** Raise bot OPEN asks toward observed market (never lower mid-round). */
async function repriceBotRetailListings(
  tx: Prisma.TransactionClient,
  session: BotSession,
  marketRef: number,
): Promise<number> {
  const bots = await tx.participant.findMany({
    where: { sessionId: session.id, isBot: true },
  });
  if (bots.length === 0) return 0;
  const botById = new Map(bots.map((b) => [b.id, b]));

  const listings = await tx.listing.findMany({
    where: {
      sellerParticipantId: { in: bots.map((b) => b.id) },
      status: { in: ["OPEN", "PARTIALLY_FILLED"] },
      availableQuantity: { gt: 0 },
      round: { sessionId: session.id, number: session.currentRound },
    },
    include: { inventoryLot: true },
  });

  let actions = 0;
  for (const listing of listings) {
    const seller = botById.get(listing.sellerParticipantId);
    if (!seller) continue;
    const target = botAskPrice(
      seller,
      session,
      `reprice-${listing.id}-${marketRef}`,
      marketRef,
      listing.inventoryLot.unitCostVnd,
    );
    if (target < listing.askPriceVnd + PRICE_STEP_VND) continue;
    await tx.listing.update({
      where: { id: listing.id },
      data: { askPriceVnd: target },
    });
    actions++;
  }
  return actions;
}

function intermediaryBidCeiling(
  bot: Participant,
  session: BotSession,
  purpose: string,
  referencePriceVnd: number,
): number {
  // Bid toward consumer willingness / producer cost (~16–22k), not just
  // social unit value — otherwise TRADITIONAL wholesale (~18k) never clears.
  const range: Record<BotTemperament, [number, number]> = {
    CAUTIOUS: [6, 8],
    BALANCED: [7, 10],
    BOLD: [8, 12],
  };
  const [minStep, maxStep] = range[temperament(bot, session)];
  return Math.max(
    1000,
    referencePriceVnd + botInt(bot, session, purpose, minStep, maxStep) * 1000,
  );
}

function seededOrder<T extends { id: string }>(
  items: T[],
  session: BotSession,
  purpose: string,
): T[] {
  return [...items].sort(
    (a, b) =>
      seededUnit(session.id, session.currentRound, a.id, purpose) -
      seededUnit(session.id, session.currentRound, b.id, purpose),
  );
}

async function bump(
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

  const patches = (data as { walletPatches?: Record<string, number> } | undefined)
    ?.walletPatches;
  if (patches && Object.keys(patches).length > 0) {
    await import("./live-room")
      .then((m) => m.patchLiveRoomBalances(sessionId, patches))
      .catch((e) => console.error("live-room wallet patch:", e));
  }

  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}

/** Mark all bots ready after they finish their phase actions. */
async function markBotsPhaseReady(sessionId: string): Promise<void> {
  await db.participant.updateMany({
    where: { sessionId, isBot: true },
    data: { phaseReady: true },
  });
}

/** Run a bot action without aborting the whole batch on a single failure. */
async function botTry(
  label: string,
  sessionId: string,
  fn: () => Promise<unknown>,
): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (e) {
    console.error(`bot ${label} (${sessionId}):`, e);
    return false;
  }
}

function botCtx(bot: Participant, session: BotSession) {
  return { participant: bot, session };
}

function botParticipants<
  T extends { role: string | null; controlMode: string },
>(bots: T[]): T[] {
  return bots.filter(
    (b) =>
      b.role &&
      (b.controlMode === "BOT_PERMANENT" || b.controlMode === "BOT_TAKEOVER"),
  );
}

/** DECISION: produce, upgrade, government policies (not export). */
export async function runBotDecisions(sessionId: string): Promise<void> {
  await withSessionLock(sessionId, async () => {
    try {
      const session = await db.gameSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
      if (session.phase !== "DECISION") return;
      const round = await db.round.findUniqueOrThrow({
        where: { sessionId_number: { sessionId, number: session.currentRound } },
      });
      const bots = await db.participant.findMany({
        where: { sessionId, isBot: true },
        include: {
          wallet: true,
          roleStates: { where: { roundId: round.id }, take: 1 },
        },
      });

      // One transaction per bot so a single failure cannot roll back the batch.
      for (const bot of botParticipants(bots)) {
        await botTry(`decision:${bot.id}`, sessionId, async () => {
          await db.$transaction(async (tx) => {
            if (bot.role === "PRODUCER") {
              const state = bot.roleStates[0]?.state as unknown as
                | ProducerRoundState
                | undefined;
              if (!state || !bot.wallet) return;
              const config = botConfig(bot, session);

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
                  nextCost <= bot.wallet.balanceVnd * config.upgradeBalanceShare
                ) {
                  await botTry(`upgrade:${bot.id}`, sessionId, () =>
                    investUpgrade(tx, botCtx(bot, session)),
                  );
                }
              }

              // Fresh wallet/state inside the tx — not the preloaded snapshot.
              const wallet = await tx.wallet.findUnique({
                where: { participantId: bot.id },
              });
              const rs = await tx.roleState.findUnique({
                where: {
                  participantId_roundId: {
                    participantId: bot.id,
                    roundId: round.id,
                  },
                },
              });
              const live = (rs?.state ?? state) as unknown as ProducerRoundState;
              if (!wallet) return;

              const allowed = allowedProductionQuantity({
                productionCapacity: live.productionCapacity,
                producedQuantity: live.producedQuantity,
                availableLaborPoints: live.availableLaborPoints,
                individualLaborTime: live.individualLaborTime,
                productionCap: live.productionCap,
                balanceVnd: wallet.balanceVnd,
                unitCostVnd: producerUnitCostVnd(live),
                individualUnitCostVnd: live.individualUnitCostVnd,
              });
              const productionShare =
                config.productionShare[0] +
                seededUnit(
                  session.id,
                  session.currentRound,
                  bot.id,
                  "production-share",
                ) *
                  (config.productionShare[1] - config.productionShare[0]);
              const qty = Math.min(
                allowed,
                Math.max(
                  allowed > 0 ? 1 : 0,
                  Math.round(allowed * productionShare),
                ),
              );
              if (qty > 0) await produce(tx, botCtx(bot, session), qty);
            }

            if (bot.role === "GOVERNMENT") {
              const gstate = bot.roleStates[0]?.state as unknown as
                | GovernmentRoundState
                | undefined;
              if (!gstate || gstate.policyUsed || !bot.wallet) return;
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
                if (
                  bot.wallet.balanceVnd >= POLICIES.INFO_DISCLOSURE.fixedCostVnd
                ) {
                  await applyPolicy(tx, botCtx(bot, session), {
                    policyType: "INFO_DISCLOSURE",
                  });
                } else {
                  await applyPolicy(tx, botCtx(bot, session), {
                    policyType: "NONE",
                  });
                }
              } else if (n === 4) {
                await applyPolicy(tx, botCtx(bot, session), {
                  policyType: "NONE",
                });
              }
            }
          });
        });
      }
    } catch (e) {
      console.error(`bot decisions (${sessionId}):`, e);
    } finally {
      // Always mark ready + broadcast so the UI never stalls on a partial failure.
      await markBotsPhaseReady(sessionId).catch((e) =>
        console.error("markBotsPhaseReady:", e),
      );
      await bump(sessionId, "bot:decisions").catch((e) =>
        console.error("bot:decisions bump:", e),
      );
    }
  });
}

const BOT_MARKET_WAVE_COUNT = 6;
const BOT_MARKET_TIMER_PREFIX = "bot-market-wave";
const BOT_CONSUMER_REACT_TIMER = "bot-consumer-react";
const BOT_SELLER_REACT_TIMER = "bot-seller-react";

function botMarketTimerName(wave: number): string {
  return `${BOT_MARKET_TIMER_PREFIX}-${wave}`;
}

function marketWaveOffsets(sessionId: string, totalMs: number): number[] {
  const safeTotal = Math.max(20_000, totalMs);
  return [0.02, 0.16, 0.32, 0.5, 0.7, 0.88].map((pct, index) => {
    const jitter =
      (seededUnit(sessionId, index + 1, "wave-timing") - 0.5) * 0.05;
    return Math.max(
      1_000,
      Math.floor(safeTotal * Math.max(0.01, pct + jitter)),
    );
  });
}

export function clearBotMarketTimers(sessionId: string): void {
  for (let wave = 1; wave <= BOT_MARKET_WAVE_COUNT; wave++) {
    clearNamedTimer(sessionId, botMarketTimerName(wave));
  }
  clearNamedTimer(sessionId, BOT_CONSUMER_REACT_TIMER);
  clearNamedTimer(sessionId, BOT_SELLER_REACT_TIMER);
}

/**
 * Debounced re-shop after a human (or late) listing appears. Consumer bots used
 * to decide only in late waves — often while the shelf was still empty — then
 * never revisit human goods. This fires ~2.5s after each listing so demand
 * tracks the live market.
 */
export function scheduleBotConsumerReaction(sessionId: string): void {
  scheduleNamedTimer(sessionId, BOT_CONSUMER_REACT_TIMER, 2_500, () => {
    void runBotConsumerReaction(sessionId).catch((e) =>
      console.error("bot consumer reaction:", e),
    );
  });
}

/** Bot sellers reply to human counter-offers within ~1.5s (not only on market waves). */
export function scheduleBotSellerReaction(sessionId: string): void {
  scheduleNamedTimer(sessionId, BOT_SELLER_REACT_TIMER, 1_500, () => {
    void runBotSellerReaction(sessionId).catch((e) =>
      console.error("bot seller reaction:", e),
    );
  });
}

async function runBotConsumerReaction(sessionId: string): Promise<void> {
  await withSessionLock(sessionId, async () => {
    const session = await db.gameSession.findUnique({ where: { id: sessionId } });
    if (!session || session.phase !== "MARKET_OPEN" || session.paused) return;
    let actions = 0;
    const walletPatches: Record<string, number> = {};
    await db.$transaction(async (tx) => {
      const marketRef = await observeMarketReferenceVnd(tx, session);
      actions += await repriceBotRetailListings(tx, session, marketRef);
      const demand = await runBotConsumerDemand(tx, session, 2, {
        requireHumanListings: true,
      });
      actions += demand.actions;
      Object.assign(walletPatches, demand.walletPatches);
      const counters = await acceptBotRetailCounters(tx, session);
      actions += counters.actions;
      Object.assign(walletPatches, counters.walletPatches);
    });
    if (actions > 0) {
      await bump(sessionId, "bot:consumer_react", { actions, walletPatches }).catch(
        (e) => console.error("bot:consumer_react bump:", e),
      );
    }
  });
}

async function runBotSellerReaction(sessionId: string): Promise<void> {
  await withSessionLock(sessionId, async () => {
    const session = await db.gameSession.findUnique({ where: { id: sessionId } });
    if (!session || session.phase !== "MARKET_OPEN" || session.paused) return;
    const price = unitValueVnd(session.currentRound);
    let actions = 0;
    const walletPatches: Record<string, number> = {};

    // Separate txs — a wholesale failure must not roll back retail accept/reject.
    await db.$transaction(async (tx) => {
      actions += await respondBotRetailOffers(tx, session, price);
    });
    await db.$transaction(async (tx) => {
      const counters = await acceptBotRetailCounters(tx, session);
      actions += counters.actions;
      Object.assign(walletPatches, counters.walletPatches);
    });
    const round = await db.round.findUnique({
      where: {
        sessionId_number: { sessionId: session.id, number: session.currentRound },
      },
      select: { id: true },
    });
    if (round) {
      await db.$transaction(async (tx) => {
        actions += await acceptBotWholesaleCounters(tx, session, round.id);
      });
    }

    if (actions > 0) {
      await bump(sessionId, "bot:seller_react", { actions, walletPatches }).catch(
        (e) => console.error("bot:seller_react bump:", e),
      );
    }
  });
}

export function scheduleBotMarketWaves(
  sessionId: string,
  totalMs = PHASE_DURATIONS_SEC.MARKET_OPEN * 1000,
  includeFirst = true,
): void {
  clearBotMarketTimers(sessionId);
  marketWaveOffsets(sessionId, totalMs).forEach((offset, index) => {
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
  const session = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  if (session.phase !== "MARKET_OPEN") return;
  const remaining = session.phaseEndsAt
    ? session.phaseEndsAt.getTime() - Date.now()
    : PHASE_DURATIONS_SEC.MARKET_OPEN * 1000;
  scheduleBotMarketWaves(sessionId, remaining, false);
  await runBotMarketWave(sessionId, 1);
}

async function runBotMarketWave(
  sessionId: string,
  wave: number,
): Promise<void> {
  await withSessionLock(sessionId, () => runBotMarketWaveInner(sessionId, wave));
}

/**
 * Guarantee consumer bots get one last chance to buy before MARKET_OPEN ends.
 * Waves 5/6 (consumer demand) are scheduled late (~70-88% through the phase)
 * and are cancelled the moment the host force-advances or the round settles
 * early, so call this synchronously before settlement.
 * Caller must already hold the session lock (e.g. from within transition()).
 */
export async function runFinalBotConsumerPass(sessionId: string): Promise<void> {
  // Last chance before settlement — may buy bot stock if humans never listed.
  await runBotMarketWaveInner(sessionId, 6);
}

async function runBotMarketWaveInner(
  sessionId: string,
  wave: number,
): Promise<void> {
    let actions = 0;
    const walletPatches: Record<string, number> = {};
    try {
      const session = await db.gameSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
      if (session.phase !== "MARKET_OPEN" || session.paused) return;
      const price = await observeMarketReferenceVnd(db, session);
      const round = await db.round.findUniqueOrThrow({
        where: {
          sessionId_number: { sessionId, number: session.currentRound },
        },
      });

      // Separate transactions per step so one failure does not wipe the wave.
      const steps: Array<() => Promise<number>> = [];
      if (wave === 1) {
        steps.push(
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await applyBotExportPromotion(tx, session, round.id);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await createHumanIntermediaryStarterOffers(
                tx,
                session,
                round.id,
              );
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(
              async (tx) => {
                n += await listBotProducerRetail(
                  tx,
                  session,
                  round.id,
                  price,
                );
              },
              { timeout: 15_000 },
            );
            return n;
          },
        );
      }
      if (wave === 2) {
        steps.push(
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await createBotWholesaleOffers(tx, session, round.id, price);
            });
            return n;
          },
          // Early consumer pass — catch human listings that appear mid-phase,
          // not only after the shelf was empty at wave 1.
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const demand = await runBotConsumerDemand(tx, session, 1, {
                requireHumanListings: true,
              });
              Object.assign(walletPatches, demand.walletPatches);
              n += demand.actions;
            });
            return n;
          },
        );
      }
      if (wave === 3) {
        steps.push(
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const marketRef = await observeMarketReferenceVnd(tx, session);
              n += await repriceBotRetailListings(tx, session, marketRef);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await respondBotWholesaleOffers(tx, session, round.id, price);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await respondBotRetailOffers(tx, session, price);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const counters = await acceptBotRetailCounters(tx, session);
              Object.assign(walletPatches, counters.walletPatches);
              n += counters.actions;
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const demand = await runBotConsumerDemand(tx, session, 1, {
                requireHumanListings: true,
              });
              Object.assign(walletPatches, demand.walletPatches);
              n += demand.actions;
            });
            return n;
          },
        );
      }
      if (wave === 4) {
        steps.push(
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await acceptBotWholesaleCounters(tx, session, round.id);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const marketRef = await observeMarketReferenceVnd(tx, session);
              n += await repriceBotRetailListings(tx, session, marketRef);
              n += await listBotIntermediaryRetail(tx, session, marketRef);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await respondBotRetailOffers(tx, session, price);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const counters = await acceptBotRetailCounters(tx, session);
              Object.assign(walletPatches, counters.walletPatches);
              n += counters.actions;
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const demand = await runBotConsumerDemand(tx, session, 1, {
                requireHumanListings: true,
              });
              Object.assign(walletPatches, demand.walletPatches);
              n += demand.actions;
            });
            return n;
          },
        );
      }
      if (wave === 5) {
        steps.push(async () => {
          let n = 0;
          await db.$transaction(async (tx) => {
            const demand = await runBotConsumerDemand(tx, session, 2, {
              requireHumanListings: true,
            });
            Object.assign(walletPatches, demand.walletPatches);
            n += demand.actions;
          });
          return n;
        });
      }
      if (wave === 6) {
        steps.push(
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              n += await respondBotRetailOffers(tx, session, price);
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const counters = await acceptBotRetailCounters(tx, session);
              Object.assign(walletPatches, counters.walletPatches);
              n += counters.actions;
            });
            return n;
          },
          async () => {
            let n = 0;
            await db.$transaction(async (tx) => {
              const demand = await runBotConsumerDemand(tx, session, 3, {
                requireHumanListings: false,
              });
              Object.assign(walletPatches, demand.walletPatches);
              n += demand.actions;
            });
            return n;
          },
        );
      }

      // Publish after each step so clients see listings/trades/counters live
      // instead of one batched jump at the end of the wave.
      for (const step of steps) {
        let stepActions = 0;
        const ok = await botTry(`market-wave-${wave}`, sessionId, async () => {
          stepActions = await step();
          actions += stepActions;
        });
        if (!ok) continue;
        if (stepActions > 0) {
          await bump(sessionId, "bot:market_wave", {
            wave,
            actions: stepActions,
            walletPatches,
          }).catch((e) => console.error("bot:market_wave bump:", e));
        }
      }
    } catch (e) {
      console.error(`bot market wave ${wave} (${sessionId}):`, e);
    } finally {
      // Only mark ready once trading waves (incl. consumer demand) finish —
      // wave 1 used to mark consumers "ready" before they ever shopped.
      if (wave >= BOT_MARKET_WAVE_COUNT) {
        await markBotsPhaseReady(sessionId).catch((e) =>
          console.error("markBotsPhaseReady:", e),
        );
      }
      await bump(sessionId, "bot:market_wave", {
        wave,
        actions,
        walletPatches,
      }).catch((e) => console.error("bot:market_wave bump:", e));
      // After human-facing listing waves, nudge consumers — they still require
      // human stock until the final wave.
      if (wave === 4) {
        scheduleBotConsumerReaction(sessionId);
      }
    }
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
  const gstate = govBot?.roleStates[0]?.state as unknown as
    | GovernmentRoundState
    | undefined;
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
    await applyPolicy(tx, botCtx(govBot, session), {
      policyType: "EXPORT_PROMOTION",
    });
    return 1;
  } catch {
    return 0;
  }
}

/** 70/30 variety split so producer bots don't push every lot through both
 *  channels every round — most lots go retail, some go wholesale instead. */
function producerLotChannel(
  lot: { id: string },
  session: BotSession,
): "retail" | "wholesale" {
  return seededUnit(session.id, session.currentRound, lot.id, "lot-channel") < 0.7
    ? "retail"
    : "wholesale";
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
  const producers = seededOrder(
    await botProducers(tx, session.id, roundId),
    session,
    "producer-retail-order",
  );
  for (const seller of producers) {
    const pstate = seller.roleStates[0]?.state as unknown as
      | ProducerRoundState
      | undefined;
    const unitCost = pstate ? producerUnitCostVnd(pstate) : price;
    const lots = await tx.inventoryLot.findMany({
      where: {
        ownerParticipantId: seller.id,
        availableQuantity: { gt: 0 },
        status: { in: ["AVAILABLE", "CARRIED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const lot of lots) {
      if (producerLotChannel(lot, session) !== "retail") continue;
      const ask = botAskPrice(
        seller,
        session,
        `producer-retail-ask-${lot.id}`,
        price,
        unitCost,
      );
      const listingShare = botInt(
        seller,
        session,
        `producer-retail-qty-${lot.id}`,
        40,
        75,
      );
      const retailQty = Math.min(
        lot.availableQuantity,
        Math.max(1, Math.ceil((lot.availableQuantity * listingShare) / 100)),
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
  const producers = seededOrder(
    await botProducers(tx, session.id, roundId),
    session,
    "producer-wholesale-order",
  );
  for (const seller of producers) {
    const pstate = seller.roleStates[0]?.state as unknown as
      | ProducerRoundState
      | undefined;
    const unitCost = pstate ? producerUnitCostVnd(pstate) : price;
    const lots = await tx.inventoryLot.findMany({
      where: {
        ownerParticipantId: seller.id,
        availableQuantity: { gt: 0 },
        status: { in: ["AVAILABLE", "CARRIED"] },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const lot of lots) {
      if (producerLotChannel(lot, session) !== "wholesale") continue;
      const ask = botAskPrice(
        seller,
        session,
        `producer-wholesale-ask-${lot.id}`,
        price,
        unitCost,
      );
      const qty = Math.min(
        lot.availableQuantity,
        botInt(seller, session, `producer-wholesale-qty-${lot.id}`, 1, 3),
      );
      if (qty <= 0) continue;
      const discountSteps = botInt(
        seller,
        session,
        `producer-wholesale-discount-${lot.id}`,
        1,
        2,
      );
      try {
        // Allow floors slightly below unit cost so TRADITIONAL lots can clear
        // against intermediary bid ceilings (mirrors human starter offers).
        await createWholesaleOffer(tx, botCtx(seller, session), {
          inventoryLotId: lot.id,
          quantity: qty,
          minimumPriceVnd: Math.max(
            MIN_PRICE_VND,
            Math.min(unitCost, ask - discountSteps * 1000),
          ),
        });
        actions++;
      } catch {
        /* skip invalid wholesale attempts */
      }
    }
  }
  return actions;
}

/** Reserve an immediate, affordable sourcing action for each human intermediary. */
async function createHumanIntermediaryStarterOffers(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  roundId: string,
): Promise<number> {
  const intermediaries = await tx.participant.findMany({
    where: { sessionId: session.id, isBot: false, role: "INTERMEDIARY" },
    include: { wallet: true },
    orderBy: { createdAt: "asc" },
  });
  const buyers = intermediaries.filter(
    (intermediary) => (intermediary.wallet?.balanceVnd ?? 0) >= MIN_PRICE_VND,
  );
  if (buyers.length === 0) return 0;

  const existingOffers = await tx.wholesaleOffer.findMany({
    where: { roundId, status: "OPEN" },
    select: { quantity: true, minimumPriceVnd: true },
  });
  const affordableOfferCount = existingOffers.filter((offer) =>
    buyers.some(
      (buyer) =>
        (buyer.wallet?.balanceVnd ?? 0) >=
        offer.quantity * offer.minimumPriceVnd,
    ),
  ).length;
  let needed = Math.max(0, buyers.length - affordableOfferCount);
  if (needed === 0) return 0;

  const producers = seededOrder(
    await botProducers(tx, session.id, roundId),
    session,
    "human-intermediary-starter-order",
  );
  let actions = 0;
  for (const seller of producers) {
    if (needed === 0) break;
    const pstate = seller.roleStates[0]?.state as unknown as
      | ProducerRoundState
      | undefined;
    if (!pstate) continue;
    const lots = await tx.inventoryLot.findMany({
      where: {
        ownerParticipantId: seller.id,
        availableQuantity: { gt: 0 },
        status: { in: ["AVAILABLE", "CARRIED"] },
      },
      orderBy: { createdAt: "asc" },
    });

    for (const lot of lots) {
      if (needed === 0) break;
      const buyer = buyers[actions % buyers.length];
      const budget = Math.floor((buyer.wallet?.balanceVnd ?? 0) / 1000) * 1000;
      const minimumPriceVnd = Math.max(
        MIN_PRICE_VND,
        Math.min(producerUnitCostVnd(pstate), budget),
      );
      if (minimumPriceVnd > budget) continue;

      try {
        await createWholesaleOffer(tx, botCtx(seller, session), {
          inventoryLotId: lot.id,
          quantity: 1,
          minimumPriceVnd,
        });
        actions++;
        needed--;
      } catch {
        /* another starter offer may have reserved this lot */
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
  const intermediaries = seededOrder(
    await tx.participant.findMany({
      where: { sessionId: session.id, isBot: true, role: "INTERMEDIARY" },
      include: { wallet: true },
    }),
    session,
    "wholesale-buyer-order",
  );
  for (const im of intermediaries) {
    if (!im.wallet) continue;
    const wholesale = await tx.wholesaleOffer.findFirst({
      where: { roundId, status: "OPEN" },
      orderBy: [{ minimumPriceVnd: "asc" }, { createdAt: "asc" }],
    });
    if (!wholesale) continue;
    const bidCeiling = intermediaryBidCeiling(
      im,
      session,
      `wholesale-bid-${wholesale.id}`,
      price,
    );
    try {
      if (
        wholesale.minimumPriceVnd <= bidCeiling &&
        im.wallet.balanceVnd >= wholesale.minimumPriceVnd * wholesale.quantity
      ) {
        await respondWholesale(tx, botCtx(im, session), {
          offerId: wholesale.id,
          decision: "ACCEPT",
        });
        actions++;
      } else if (wholesale.minimumPriceVnd > bidCeiling) {
        const roll = seededUnit(
          session.id,
          session.currentRound,
          im.id,
          wholesale.id,
          "negotiate-wholesale",
        );
        const canAffordCounter =
          im.wallet.balanceVnd >= bidCeiling * wholesale.quantity;
        if (canAffordCounter && roll < 0.55) {
          await respondWholesale(tx, botCtx(im, session), {
            offerId: wholesale.id,
            decision: "COUNTER",
            counterPriceVnd: bidCeiling,
          });
          actions++;
        } else if (roll < 0.35) {
          await respondWholesale(tx, botCtx(im, session), {
            offerId: wholesale.id,
            decision: "REJECT",
          });
          actions++;
        }
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
    include: { inventoryLot: true },
    orderBy: { updatedAt: "asc" },
  });
  for (const offer of countered) {
    const seller = producerById.get(offer.producerId);
    if (!seller) continue;
    // Accept at/above after-tax cost — never dump at social unit value.
    const costFloor = afterTaxBreakevenAskVnd(offer.inventoryLot.unitCostVnd);
    const priceOk =
      Boolean(offer.counterPriceVnd) && offer.counterPriceVnd! >= costFloor;
    const accepts =
      priceOk &&
      seededUnit(
        session.id,
        session.currentRound,
        seller.id,
        offer.id,
        "accept-wholesale-counter",
      ) < 0.7;
    try {
      await respondWholesale(tx, botCtx(seller, session), {
        offerId: offer.id,
        decision: accepts ? "ACCEPT" : "REJECT",
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
  marketRef: number,
): Promise<number> {
  let actions = 0;
  const intermediaries = seededOrder(
    await tx.participant.findMany({
      where: { sessionId: session.id, isBot: true, role: "INTERMEDIARY" },
      include: { wallet: true },
    }),
    session,
    "intermediary-retail-order",
  );
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
      // 70/30 variety split: most lots get a modest markup, some go aggressive
      // so retail asks don't all cluster in the same narrow band.
      const aggressive =
        seededUnit(session.id, session.currentRound, lot.id, "markup-mode") >= 0.7;
      const [markupMin, markupMax] = aggressive ? [3, 6] : [1, 2];
      const markupSteps = botInt(
        im,
        session,
        `intermediary-markup-${lot.id}`,
        markupMin,
        markupMax,
      );
      const costAsk = Math.max(
        afterTaxBreakevenAskVnd(lot.unitCostVnd),
        lot.unitCostVnd + markupSteps * PRICE_STEP_VND,
      );
      // Track the live shelf / prior clear — don't stick at cost+tiny markup
      // while humans are posting 20k+.
      const marketAsk = marketRef + (aggressive ? 2 : 0) * PRICE_STEP_VND;
      const retailAsk = Math.min(MAX_PRICE_VND, Math.max(costAsk, marketAsk));
      const retailQty = botInt(
        im,
        session,
        `intermediary-qty-${lot.id}`,
        1,
        lot.availableQuantity,
      );
      try {
        await listForSale(tx, botCtx(im, session), {
          inventoryLotId: lot.id,
          quantity: retailQty,
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
  opts: { requireHumanListings?: boolean } = {},
): Promise<{ actions: number; walletPatches: Record<string, number> }> {
  const requireHumanListings = opts.requireHumanListings ?? false;
  let actions = 0;
  const walletPatches: Record<string, number> = {};
  const marketGoingRate = await observeMarketGoingRateVnd(tx, session);
  const round = await tx.round.findUniqueOrThrow({
    where: {
      sessionId_number: { sessionId: session.id, number: session.currentRound },
    },
    select: { id: true },
  });
  const consumers = seededOrder(
    await tx.participant.findMany({
      where: { sessionId: session.id, isBot: true, role: "CONSUMER" },
      include: {
        wallet: true,
        roleStates: { where: { roundId: round.id }, take: 1 },
      },
    }),
    session,
    `consumer-demand-order-${maxActionsPerConsumer}-${requireHumanListings}`,
  );
  for (const consumer of consumers) {
    const state = consumer.roleStates[0]?.state as unknown as
      | ConsumerRoundState
      | undefined;
    if (!state) continue;
    let need = Math.max(0, state.needTarget - state.fulfilledUnits);
    let attempts = 0;
    // Shop up to remaining need (not a hard 1–2), so bots can place several
    // concurrent offers across stalls within one wave.
    const actionCap = Math.min(12, Math.max(maxActionsPerConsumer, need));
    const alreadyOffered = new Set(
      (
        await tx.offer.findMany({
          where: {
            fromParticipantId: consumer.id,
            status: "OPEN",
            listingId: { not: null },
            listing: {
              round: { sessionId: session.id, number: session.currentRound },
            },
          },
          select: { listingId: true },
        })
      )
        .map((o) => o.listingId)
        .filter((id): id is string => typeof id === "string"),
    );
    while (need > 0 && attempts < actionCap) {
      const wallet = await tx.wallet.findUnique({
        where: { participantId: consumer.id },
      });
      if (!wallet) break;
      const availableVnd = Math.max(
        0,
        wallet.balanceVnd - (state.reservedOfferVnd ?? 0),
      );
      if (availableVnd < 1000) break;
      const listings = await tx.listing.findMany({
        where: {
          round: { sessionId: session.id, number: session.currentRound },
          status: { in: ["OPEN", "PARTIALLY_FILLED"] },
          availableQuantity: { gt: 0 },
          sellerParticipantId: { not: consumer.id },
          ...(alreadyOffered.size > 0
            ? { id: { notIn: [...alreadyOffered] } }
            : {}),
        },
        orderBy: [{ askPriceVnd: "asc" }, { createdAt: "asc" }],
        take: 16,
      });
      // Empty shelf — wait for a later wave / listing reaction; don't burn attempts.
      if (listings.length === 0) break;

      const sellerIds = [...new Set(listings.map((l) => l.sellerParticipantId))];
      const sellers = await tx.participant.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, isBot: true },
      });
      const sellerIsBot = new Map(sellers.map((s) => [s.id, s.isBot]));
      const humanListings = listings.filter(
        (l) => !sellerIsBot.get(l.sellerParticipantId),
      );
      // Wait for players to put goods on the market before buying bot stock.
      if (requireHumanListings && humanListings.length === 0) break;

      attempts++;
      const shopListings =
        requireHumanListings || humanListings.length > 0
          ? humanListings.length > 0
            ? humanListings
            : listings
          : listings;
      // Extreme outliers only — willingness itself is market ± temperament range.
      const ripoffAsk = marketGoingRate + 8 * PRICE_STEP_VND;
      const fairListings = shopListings.filter((l) => l.askPriceVnd <= ripoffAsk);
      if (fairListings.length === 0) break;
      const ranked = [...fairListings].sort((a, b) => {
        const aBot = sellerIsBot.get(a.sellerParticipantId) ? 1 : 0;
        const bBot = sellerIsBot.get(b.sellerParticipantId) ? 1 : 0;
        if (aBot !== bBot) return aBot - bBot;
        return a.askPriceVnd - b.askPriceVnd;
      });
      const pool = ranked.slice(0, Math.min(4, ranked.length));
      const listing =
        pool[
          botInt(
            consumer,
            session,
            `consumer-listing-${maxActionsPerConsumer}-${attempts}`,
            0,
            Math.max(0, pool.length - 1),
          )
        ];
      if (!listing) break;
      const config = botConfig(consumer, session);
      // 70% impulse buy-now (higher offset), 30% thrifty negotiate.
      const impulse =
        seededUnit(
          session.id,
          session.currentRound,
          consumer.id,
          listing.id,
          `buy-now-roll-${attempts}`,
        ) < CONSUMER_BUY_NOW_RATE;
      const fairBuy = consumerBuyCeilingVnd(
        consumer,
        session,
        `consumer-fair-buy-${maxActionsPerConsumer}-${attempts}`,
        impulse ? "impulse" : "thrifty",
        marketGoingRate,
      );
      // Use full available cash for the next unit — dividing by remaining need
      // left bots unable to buy a ~19k fruit when need=2–3 and wallet ~40–50k.
      const maxPay = Math.min(fairBuy, availableVnd);
      try {
        if (listing.askPriceVnd <= maxPay) {
          const trade = await buyNow(tx, botCtx(consumer, session), {
            listingId: listing.id,
            quantity: 1,
          });
          walletPatches[trade.sellerParticipantId] = trade.sellerBalanceVnd;
          walletPatches[trade.buyerId] = trade.buyerBalanceVnd;
          need--;
          actions++;
        } else {
          const discountSteps = botInt(
            consumer,
            session,
            `consumer-offer-${listing.id}`,
            config.offerDiscountSteps[0],
            config.offerDiscountSteps[1],
          );
          const offerPrice = Math.max(
            PRICE_STEP_VND,
            Math.min(
              maxPay,
              listing.askPriceVnd - discountSteps * PRICE_STEP_VND,
            ),
          );
          if (
            offerPrice < listing.askPriceVnd &&
            availableVnd >= offerPrice
          ) {
            await makeOffer(tx, botCtx(consumer, session), {
              listingId: listing.id,
              quantity: 1,
              offerPriceVnd: offerPrice,
            });
            alreadyOffered.add(listing.id);
            state.reservedOfferVnd = (state.reservedOfferVnd ?? 0) + offerPrice;
            actions++;
            continue;
          }
        }
      } catch {
        continue;
      }
    }
  }
  return { actions, walletPatches };
}

async function respondBotRetailOffers(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
  price: number,
): Promise<number> {
  let actions = 0;
  const botSellers = await tx.participant.findMany({
    where: {
      sessionId: session.id,
      isBot: true,
      role: { in: ["PRODUCER", "INTERMEDIARY"] },
    },
    select: { id: true },
  });
  if (botSellers.length === 0) return 0;
  const botSellerIds = botSellers.map((p) => p.id);

  const offers = seededOrder(
    await tx.offer.findMany({
      where: {
        status: "OPEN",
        parentOfferId: null,
        toParticipantId: { in: botSellerIds },
        listing: {
          round: { sessionId: session.id, number: session.currentRound },
          status: { in: ["OPEN", "PARTIALLY_FILLED"] },
        },
      },
      include: { listing: true },
      orderBy: { createdAt: "asc" },
      take: 24,
    }),
    session,
    "retail-offer-response-order",
  );

  const decide = async (
    seller: Participant,
    offerId: string,
    decision: "ACCEPT" | "REJECT" | "COUNTER",
    counterPriceVnd?: number,
  ): Promise<boolean> => {
    try {
      await respondOffer(tx, botCtx(seller, session), {
        offerId,
        decision,
        counterPriceVnd,
      });
      return true;
    } catch (e) {
      console.error(`bot retail ${decision}:`, offerId, e);
      return false;
    }
  };

  for (const offer of offers) {
    if (!offer.listing) continue;
    const seller = await tx.participant.findUnique({
      where: { id: offer.toParticipantId },
    });
    if (!seller?.isBot) continue;

    const config = botConfig(seller, session);
    const lotCost =
      (
        await tx.inventoryLot.findUnique({
          where: { id: offer.listing.inventoryLotId },
          select: { unitCostVnd: true },
        })
      )?.unitCostVnd ?? price;
    const costFloor = afterTaxBreakevenAskVnd(lotCost);
    const ask = offer.listing.askPriceVnd;
    const concessionSteps = botInt(
      seller,
      session,
      `seller-concession-${offer.id}`,
      config.sellerConcessionSteps[0],
      config.sellerConcessionSteps[1],
    );
    const counterPrice = Math.max(
      costFloor,
      Math.min(
        ask - PRICE_STEP_VND,
        Math.max(
          offer.offerPriceVnd + PRICE_STEP_VND,
          ask - Math.max(1, concessionSteps) * PRICE_STEP_VND,
        ),
      ),
    );

    if (offer.offerPriceVnd >= costFloor) {
      if (await decide(seller, offer.id, "ACCEPT")) {
        actions++;
        continue;
      }
    }

    const canCounter =
      costFloor < ask &&
      counterPrice < ask &&
      counterPrice > offer.offerPriceVnd &&
      counterPrice >= costFloor;
    if (canCounter && (await decide(seller, offer.id, "COUNTER", counterPrice))) {
      actions++;
      continue;
    }

    // Lowball / no room to negotiate — always decline, never leave hanging.
    if (await decide(seller, offer.id, "REJECT")) actions++;
  }
  return actions;
}

/** Consumer bots accept (or reject) seller counter-offers sent to them. */
async function acceptBotRetailCounters(
  tx: Prisma.TransactionClient,
  session: Awaited<ReturnType<typeof db.gameSession.findUniqueOrThrow>>,
): Promise<{ actions: number; walletPatches: Record<string, number> }> {
  let actions = 0;
  const walletPatches: Record<string, number> = {};
  const marketGoingRate = await observeMarketGoingRateVnd(tx, session);
  const consumers = await tx.participant.findMany({
    where: { sessionId: session.id, isBot: true, role: "CONSUMER" },
    include: { wallet: true },
  });
  if (consumers.length === 0) return { actions: 0, walletPatches };
  const consumerById = new Map(consumers.map((c) => [c.id, c]));
  const offers = seededOrder(
    await tx.offer.findMany({
      where: {
        status: "OPEN",
        parentOfferId: { not: null },
        toParticipantId: { in: consumers.map((c) => c.id) },
      },
      include: { listing: true },
      orderBy: { createdAt: "asc" },
      take: 16,
    }),
    session,
    "retail-counter-accept-order",
  );
  for (const offer of offers) {
    const consumer = consumerById.get(offer.toParticipantId);
    if (!consumer?.wallet) continue;
    const maxPay = Math.min(
      consumerBuyCeilingVnd(
        consumer,
        session,
        `consumer-counter-fair-${offer.id}`,
        seededUnit(
          session.id,
          session.currentRound,
          consumer.id,
          offer.id,
          "counter-impulse",
        ) < CONSUMER_BUY_NOW_RATE
          ? "impulse"
          : "thrifty",
        marketGoingRate,
      ),
      consumer.wallet.balanceVnd,
    );
    try {
      if (offer.offerPriceVnd <= maxPay) {
        const trade = await respondOffer(tx, botCtx(consumer, session), {
          offerId: offer.id,
          decision: "ACCEPT",
        });
        if (
          trade.sellerParticipantId &&
          trade.buyerId &&
          typeof trade.sellerBalanceVnd === "number" &&
          typeof trade.buyerBalanceVnd === "number"
        ) {
          walletPatches[trade.sellerParticipantId] = trade.sellerBalanceVnd;
          walletPatches[trade.buyerId] = trade.buyerBalanceVnd;
        }
        actions++;
      } else {
        // Always decline overpriced seller counters — don't leave the buyer hanging.
        try {
          await respondOffer(tx, botCtx(consumer, session), {
            offerId: offer.id,
            decision: "REJECT",
          });
          actions++;
        } catch (e) {
          console.error("bot retail counter reject:", offer.id, e);
        }
      }
    } catch {
      /* offer may have expired or funds moved */
    }
  }
  return { actions, walletPatches };
}

/** Run bot actions for participants under BOT_TAKEOVER during active phases. */
export async function runBotTakeover(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session?.phase) return;
  if (session.phase === "DECISION") await runBotDecisions(sessionId);
  else if (session.phase === "MARKET_OPEN")
    await runBotMarketWave(sessionId, 5);
}
