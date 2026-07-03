// Session finalization (SRS §5.9): scores, badges, and an AI debrief narration.

import type { BadgeType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import {
  producerProfitVnd,
  consumerUtilityVnd,
  intermediaryProfitVnd,
  socialScore,
} from "./economy";
import type { ConsumerRoundState } from "./role-state";
import { generateText } from "./ai";
import { formatThousandDong } from "./money";
import { generateAiDebriefReview } from "./debrief-ai";

const RETAIL = ["RETAIL_DIRECT", "RETAIL_INTERMEDIARY", "SYSTEM_EXPORT"];

export interface ParticipantOutcome {
  participantId: string;
  displayName: string;
  role: string;
  isBot: boolean;
  scoreVnd: number; // profit / utility, or socialScore (points) for government
  fulfilledUnits?: number;
  needUnits?: number;
  avgBuyPriceVnd?: number | null;
}

/** Compute outcomes + badges, persist SessionResult, generate narration. */
export async function finalizeSession(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { participants: { include: { wallet: true, roleStates: true } } },
  });
  const completed = session.status === "COMPLETED";

  const [txs, snapshots, policyActions] = await Promise.all([
    db.transaction.findMany({
      where: { sessionId, status: "COMPLETED" },
    }),
    db.marketSnapshot.findMany({
      where: { isFinal: true, round: { sessionId } },
      include: { round: { select: { number: true } } },
      orderBy: { round: { number: "asc" } },
    }),
    db.policyAction.findMany({
      where: { status: "APPLIED", round: { sessionId } },
      select: { fixedCostVnd: true, variableCostVnd: true },
    }),
  ]);
  const retailTxs = txs.filter((t) => RETAIL.includes(t.channel));
  const spoiledTotal = snapshots.reduce((s, r) => s + r.spoiledQuantity, 0);
  const completedRetailQuantity = retailTxs.reduce((s, t) => s + t.quantity, 0);
  // Policy spend from applied PolicyAction rows — not roleState counters.
  const policySpendVnd = policyActions.reduce(
    (s, p) => s + p.fixedCostVnd + p.variableCostVnd,
    0,
  );

  // Per-consumer, per-round retail purchases derived from the transaction log —
  // the single source of truth for money and quantities (§5.9). Live roleState
  // counters (fulfilledUnits/retailSpendingVnd) exist only for in-round UI and
  // are intentionally NOT trusted here.
  const consumerBuysByRound = new Map<string, Map<string, { qty: number; spendVnd: number }>>();
  for (const t of retailTxs) {
    if (t.buyerType !== "CONSUMER" || !t.buyerId) continue;
    const byRound = consumerBuysByRound.get(t.buyerId) ?? new Map<string, { qty: number; spendVnd: number }>();
    const cur = byRound.get(t.roundId) ?? { qty: 0, spendVnd: 0 };
    cur.qty += t.quantity;
    cur.spendVnd += t.totalPriceVnd;
    byRound.set(t.roundId, cur);
    consumerBuysByRound.set(t.buyerId, byRound);
  }

  const outcomes: ParticipantOutcome[] = [];
  let totalNeed = 0;
  let totalFulfilled = 0;
  let insolventProducers = 0;
  const governmentParticipants = [] as typeof session.participants;

  for (const p of session.participants) {
    if (!p.role) continue;
    const balance = p.wallet?.balanceVnd ?? 0;

    if (p.role === "PRODUCER") {
      if (balance <= 0) insolventProducers++;
      outcomes.push(base(p, producerProfitVnd(balance)));
    } else if (p.role === "CONSUMER") {
      // needTarget is set at round start and never mutated, so it stays the
      // per-round demand cap; fulfillment/spend come from transactions.
      const byRound = consumerBuysByRound.get(p.id) ?? new Map<string, { qty: number; spendVnd: number }>();
      let need = 0;
      let fulfilled = 0;
      let spending = 0;
      let bought = 0;
      for (const rs of p.roleStates) {
        const cs = rs.state as unknown as ConsumerRoundState;
        const roundNeed = cs?.needTarget ?? 0;
        const buy = byRound.get(rs.roundId) ?? { qty: 0, spendVnd: 0 };
        need += roundNeed;
        fulfilled += Math.min(buy.qty, roundNeed);
        bought += buy.qty;
        spending += buy.spendVnd;
      }
      totalNeed += need;
      totalFulfilled += fulfilled;
      outcomes.push({
        ...base(p, consumerUtilityVnd(fulfilled, spending)),
        fulfilledUnits: fulfilled,
        needUnits: need,
        avgBuyPriceVnd: bought > 0 ? Math.round(spending / bought) : null,
      });
    } else if (p.role === "INTERMEDIARY") {
      outcomes.push(base(p, intermediaryProfitVnd(balance)));
    } else {
      // GOVERNMENT — social score needs the full fulfillment total, so defer.
      governmentParticipants.push(p);
    }
  }

  const fulfillmentRate = totalNeed > 0 ? Math.min(1, totalFulfilled / totalNeed) : 0;
  for (const p of governmentParticipants) {
    outcomes.push(
      base(
        p,
        socialScore({
          completedRetailQuantity,
          consumerFulfillmentRate: fulfillmentRate,
          spoiledQuantity: spoiledTotal,
          insolventProducerCount: insolventProducers,
          policySpendVnd,
        }),
      ),
    );
  }

  const badges = completed ? await computeBadges(outcomes, sessionId) : [];
  const marketLines = snapshots.map(
    (s) =>
      `Vòng ${s.round.number}: giá trị ${formatThousandDong(s.unitValueVnd)}, giá thị trường ${
        s.marketPriceVnd === null ? "không hình thành" : formatThousandDong(s.marketPriceVnd)
      }`,
  );
  const aiDebrief = await generateAiDebriefReview({
    outcomes,
    badges,
    marketLines,
    sessionCompleted: completed,
  }).catch(() => null);
  const narration = aiDebrief?.overall.comment ?? (await buildNarration(snapshots).catch(() => null));

  await db.$transaction(async (tx) => {
    await tx.badge.deleteMany({ where: { sessionId } });
    for (const b of badges) {
      await tx.badge.create({
        data: { sessionId, participantId: b.participantId, type: b.type, metrics: {} },
      });
    }
    await tx.sessionResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        scenarioVersion: session.scenarioVersion,
        status: session.status,
        roundSnapshotIds: snapshots.map((s) => s.id),
        participantOutcomes: outcomes as unknown as Prisma.InputJsonValue,
        badges: badges as unknown as Prisma.InputJsonValue,
        narration,
        aiDebrief: aiDebrief as unknown as Prisma.InputJsonValue,
      },
      update: {
        status: session.status,
        participantOutcomes: outcomes as unknown as Prisma.InputJsonValue,
        badges: badges as unknown as Prisma.InputJsonValue,
        narration,
        aiDebrief: aiDebrief as unknown as Prisma.InputJsonValue,
      },
    });
  });
}

function base(
  p: { id: string; displayNameSnapshot: string; role: string | null; isBot: boolean },
  scoreVnd: number,
): ParticipantOutcome {
  return {
    participantId: p.id,
    displayName: p.displayNameSnapshot,
    role: p.role ?? "",
    isBot: p.isBot,
    scoreVnd,
  };
}

interface AwardedBadge {
  participantId: string;
  type: BadgeType;
}

async function computeBadges(
  outcomes: ParticipantOutcome[],
  sessionId: string,
): Promise<AwardedBadge[]> {
  const humans = outcomes.filter((o) => !o.isBot);
  const badges: AwardedBadge[] = [];

  const producers = humans.filter((o) => o.role === "PRODUCER");
  const topProducer = producers.sort((a, b) => b.scoreVnd - a.scoreVnd)[0];
  if (topProducer) badges.push({ participantId: topProducer.participantId, type: "EFFICIENT_PRODUCER" });

  const wise = humans
    .filter((o) => o.role === "CONSUMER" && (o.needUnits ?? 0) > 0 && o.fulfilledUnits! >= o.needUnits!)
    .sort((a, b) => (a.avgBuyPriceVnd ?? Infinity) - (b.avgBuyPriceVnd ?? Infinity))[0];
  if (wise) badges.push({ participantId: wise.participantId, type: "WISE_CONSUMER" });

  const gov = humans.find((o) => o.role === "GOVERNMENT" && o.scoreVnd > 0);
  if (gov) badges.push({ participantId: gov.participantId, type: "BALANCED_REGULATOR" });

  const txs = await db.transaction.findMany({
    where: { sessionId, status: "COMPLETED" },
  });
  for (const o of humans.filter((x) => x.role === "INTERMEDIARY")) {
    const hasWholesale = txs.some(
      (t) => t.channel === "WHOLESALE" && (t.buyerId === o.participantId || t.sellerId === o.participantId),
    );
    const hasRetail = txs.some(
      (t) =>
        (t.channel === "RETAIL_INTERMEDIARY" && t.sellerId === o.participantId) ||
        (t.channel === "RETAIL_INTERMEDIARY" && t.buyerId === o.participantId),
    );
    if (hasWholesale && hasRetail && o.scoreVnd >= 0) {
      badges.push({ participantId: o.participantId, type: "MARKET_CONNECTOR" });
    }
  }

  return badges;
}

async function buildNarration(
  snapshots: { round: { number: number }; unitValueVnd: number; marketPriceVnd: number | null }[],
): Promise<string | null> {
  if (snapshots.length === 0) return null;
  const lines = snapshots
    .map(
      (s) =>
        `Vòng ${s.round.number}: giá trị ${formatThousandDong(s.unitValueVnd)}, giá thị trường ${
          s.marketPriceVnd === null ? "không hình thành" : formatThousandDong(s.marketPriceVnd)
        }`,
    )
    .join("; ");
  return generateText({
    systemInstruction:
      "Bạn là trợ giảng Kinh tế Chính trị Mác-Lênin. Viết 3-4 câu tiếng Việt, " +
      "không đánh đồng giá trị với giá cả, nhấn mạnh giá cả dao động quanh giá trị và tác động cung-cầu.",
    prompt: `Tổng kết phiên chợ thanh long từ dữ liệu thật: ${lines}. Giải thích ngắn gọn cho sinh viên.`,
  });
}
