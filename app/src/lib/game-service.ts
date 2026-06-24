import type { Role, RoundPhase, SessionStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { ApiError } from "./api";
import { publish } from "./events";
import {
  MIN_PLAYERS,
  START_MIN_HUMANS,
  PHASE_DURATIONS_SEC,
  PHASE_EXTENSION_SEC,
  MAX_PHASE_EXTENSIONS,
  PROFILE_ASSIGNMENT,
  ROLE_DISTRIBUTION,
  ROUND_EVENTS,
  SCENARIO,
} from "./scenario";
import {
  effectiveLaborTime,
  individualUnitCostVnd,
  roundResources,
  socialLaborTime,
  unitValueVnd,
} from "./economy";
import { settleRound } from "./settlement";
import type {
  ProducerRoundState,
  ConsumerRoundState,
  IntermediaryRoundState,
  GovernmentRoundState,
} from "./role-state";

const INITIAL_CAPITAL: Record<Role, number> = {
  PRODUCER: SCENARIO.producerStartingCapitalVnd,
  CONSUMER: 0,
  INTERMEDIARY: SCENARIO.intermediaryStartingCapitalVnd,
  GOVERNMENT: SCENARIO.stateStartingBudgetVnd,
};

const SETTLEMENT_DISPLAY_SEC = 4;

/** Increment stateVersion and broadcast (TECH-REALTIME). */
async function touch(sessionId: string, type: string, data?: unknown): Promise<void> {
  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: updated.stateVersion, data });
}

// ───────────────────────── Host start + assignment ─────────────────────────

/** Host start guard + full game initialization (FR-HOST-01, BR-ROLE-01). */
export async function startSession(
  hostUserId: string,
  sessionId: string,
): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { where: { isBot: false }, orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.hostUserId !== hostUserId) throw new ApiError("FORBIDDEN", 403);
  if (session.status !== "LOBBY") throw new ApiError("INVALID_STATE", 409);

  const humans = session.participants;
  if (humans.length < START_MIN_HUMANS) throw new ApiError("UNDER_MIN_PLAYERS", 409);
  if (!humans.every((p) => p.ready)) throw new ApiError("NOT_ALL_READY", 409);

  // Full role composition; humans fill the first slots, bots fill the rest (§3.2).
  // Bots cover every unfilled role (incl. producer/consumer) so a session can run
  // with as few as one human player.
  const slots = roleSlots(humans.length);
  const producerCount = slots.filter((r) => r === "PRODUCER").length;
  const profiles = PROFILE_ASSIGNMENT[producerCount] ?? PROFILE_ASSIGNMENT[2];
  const botCounters: Record<Role, number> = {
    PRODUCER: 0,
    CONSUMER: 0,
    INTERMEDIARY: 0,
    GOVERNMENT: 0,
  };

  await db.$transaction(async (tx) => {
    let producerIndex = 0;
    for (let i = 0; i < slots.length; i++) {
      const role = slots[i];
      const profile = role === "PRODUCER" ? profiles[producerIndex++] : null;
      const isBot = i >= humans.length;

      let participantId: string;
      if (isBot) {
        botCounters[role]++;
        const bot = await tx.participant.create({
          data: {
            sessionId,
            displayNameSnapshot: botName(role, botCounters[role]),
            role,
            productivityProfile: profile,
            isBot: true,
            controlMode: "BOT_PERMANENT",
            ready: true,
            presence: "ONLINE",
          },
        });
        participantId = bot.id;
      } else {
        await tx.participant.update({
          where: { id: humans[i].id },
          data: { role, productivityProfile: profile },
        });
        participantId = humans[i].id;
      }

      const wallet = await tx.wallet.create({
        data: { participantId, sessionId, balanceVnd: INITIAL_CAPITAL[role] },
      });
      if (INITIAL_CAPITAL[role] > 0) {
        await tx.ledgerEntry.create({
          data: {
            sessionId,
            walletId: wallet.id,
            type: "INITIAL_CAPITAL",
            amountVnd: INITIAL_CAPITAL[role],
          },
        });
      }
    }

    await tx.gameSession.update({
      where: { id: sessionId },
      data: { status: "INTRO", startedAt: new Date() },
    });
  });

  await touch(sessionId, "session:started");
}

const BOT_NAMES: Record<Role, string> = {
  PRODUCER: "Bot Sản xuất",
  CONSUMER: "Bot Tiêu dùng",
  INTERMEDIARY: "Bot Trung gian",
  GOVERNMENT: "Bot Nhà nước",
};

function botName(role: Role, index: number): string {
  return `${BOT_NAMES[role]} ${index}`;
}

/** Ordered full role composition: producers, consumers, one intermediary, one
 *  government. Uses the SRS table for 4..10 humans; a 2P/2C base otherwise. */
function roleSlots(humanCount: number): Role[] {
  const dist =
    humanCount >= MIN_PLAYERS && humanCount <= 10
      ? ROLE_DISTRIBUTION[humanCount]
      : { producer: 2, consumer: 2 };
  return [
    ...Array<Role>(dist.producer).fill("PRODUCER"),
    ...Array<Role>(dist.consumer).fill("CONSUMER"),
    "INTERMEDIARY",
    "GOVERNMENT",
  ];
}

// ───────────────────────── Round entry ─────────────────────────

function roundConfig(n: number) {
  return {
    eventType: ROUND_EVENTS[n],
    socialLaborTime: socialLaborTime(n),
    unitValueVnd: unitValueVnd(n),
  };
}

async function enterRound(sessionId: string, n: number): Promise<void> {
  const cfg = roundConfig(n);
  const participants = await db.participant.findMany({
    where: { sessionId },
    include: { wallet: true },
  });
  const consumerCount = participants.filter((p) => p.role === "CONSUMER").length;
  const needPlan = distributeNeed(consumerCount, n);

  await db.$transaction(async (tx) => {
    const round = await tx.round.upsert({
      where: { sessionId_number: { sessionId, number: n } },
      create: { sessionId, number: n, phase: "EVENT", ...cfg },
      update: { phase: "EVENT" },
    });

    let consumerIdx = 0;
    for (const p of participants) {
      if (!p.role) continue;
      // Consumer subsidy each round (§5.1).
      if (p.role === "CONSUMER" && p.wallet) {
        await tx.wallet.update({
          where: { participantId: p.id },
          data: { balanceVnd: { increment: SCENARIO.consumerSubsidyPerRoundVnd } },
        });
        await tx.ledgerEntry.create({
          data: {
            sessionId,
            roundId: round.id,
            walletId: p.wallet.id,
            type: "SUBSIDY",
            amountVnd: SCENARIO.consumerSubsidyPerRoundVnd,
          },
        });
      }
      await tx.roleState.upsert({
        where: { participantId_roundId: { participantId: p.id, roundId: round.id } },
        create: {
          participantId: p.id,
          roundId: round.id,
          role: p.role,
          state: buildRoleState(
            p.role,
            p.productivityProfile,
            n,
            needPlan[consumerIdx],
          ) as unknown as Prisma.InputJsonValue,
        },
        update: {},
      });
      if (p.role === "CONSUMER") consumerIdx++;
    }

    await tx.gameSession.update({
      where: { id: sessionId },
      data: { status: `ROUND_${n}` as SessionStatus, currentRound: n },
    });
  });

  await setPhase(sessionId, "EVENT");
}

/** Distribute total need across consumers; round 3 boosts total by 50% (BR-ROUND-03). */
function distributeNeed(consumerCount: number, roundNumber: number): number[] {
  const base = consumerCount * SCENARIO.consumerBaseNeedUnits;
  const total = roundNumber === 3 ? Math.ceil(base * 1.5) : base;
  const plan = Array<number>(consumerCount).fill(
    Math.floor(total / Math.max(consumerCount, 1)),
  );
  let remainder = total - plan.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % consumerCount, remainder--) plan[i]++;
  return plan;
}

function buildRoleState(
  role: Role,
  profile: ProducerRoundState["profile"] | null,
  n: number,
  needTarget: number | undefined,
): ProducerRoundState | ConsumerRoundState | IntermediaryRoundState | GovernmentRoundState {
  if (role === "PRODUCER" && profile) {
    const laborTime = effectiveLaborTime(profile, n);
    const res = roundResources(n);
    return {
      kind: "PRODUCER",
      profile,
      individualLaborTime: laborTime,
      individualUnitCostVnd:
        n >= 4 ? 6000 : individualUnitCostVnd(profile),
      availableLaborPoints: res.availableLaborPoints,
      productionCap: res.productionCap,
      producedQuantity: 0,
      pendingUpgrade: null,
    };
  }
  if (role === "CONSUMER") {
    return { kind: "CONSUMER", needTarget: needTarget ?? 0, fulfilledUnits: 0, retailSpendingVnd: 0 };
  }
  if (role === "INTERMEDIARY") {
    return { kind: "INTERMEDIARY", connectedProducerIds: [], connectedConsumerIds: [] };
  }
  return { kind: "GOVERNMENT", policyUsed: false, policySpendVnd: 0 };
}

// ───────────────────────── Phase state machine ─────────────────────────

const TIMED_PHASES: RoundPhase[] = ["EVENT", "DECISION", "MARKET_OPEN", "SETTLEMENT"];

function phaseDurationSec(phase: RoundPhase): number {
  if (phase === "SETTLEMENT") return SETTLEMENT_DISPLAY_SEC;
  return PHASE_DURATIONS_SEC[phase];
}

async function setPhase(sessionId: string, phase: RoundPhase): Promise<void> {
  const durationSec = phaseDurationSec(phase);
  const timed = TIMED_PHASES.includes(phase);
  const phaseEndsAt = timed ? new Date(Date.now() + durationSec * 1000) : null;
  await db.gameSession.update({
    where: { id: sessionId },
    data: { phase, phaseEndsAt, phaseExtensions: 0, paused: false, pausedRemainingMs: null },
  });
  await db.round.updateMany({
    where: { sessionId, number: (await currentRoundNumber(sessionId)) },
    data: { phase },
  });
  if (timed && phaseEndsAt) scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await touch(sessionId, "round:phase_changed", { phase });
}

async function currentRoundNumber(sessionId: string): Promise<number> {
  const s = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { currentRound: true },
  });
  return s.currentRound;
}

/** One forward step in the round/phase machine. */
async function transition(sessionId: string, auto: boolean): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) return;
  if (auto) {
    if (session.paused) return;
    if (session.phaseEndsAt && Date.now() < session.phaseEndsAt.getTime() - 1000) return;
  }
  const n = session.currentRound;

  // INTRO -> Round 1
  if (session.status === "INTRO") {
    await enterRound(sessionId, 1);
    return;
  }
  if (!session.phase) return;

  switch (session.phase) {
    case "EVENT":
      await setPhase(sessionId, "DECISION");
      return;
    case "DECISION":
      await setPhase(sessionId, "MARKET_OPEN");
      return;
    case "MARKET_OPEN":
      await setPhase(sessionId, "SETTLEMENT");
      await settleRound(sessionId, n);
      return;
    case "SETTLEMENT":
      await setPhase(sessionId, "RECAP");
      return;
    case "RECAP":
      if (n >= 4) {
        await db.gameSession.update({
          where: { id: sessionId },
          data: { status: "DEBRIEF", phase: null, phaseEndsAt: null },
        });
        await touch(sessionId, "session:debrief");
      } else {
        await enterRound(sessionId, n + 1);
      }
      return;
  }
}

// In-process scheduler (works in dev / persistent Node; serverless falls back to
// lazy advance on snapshot read via maybeAutoAdvance).
const timers = new Map<string, NodeJS.Timeout>();

function scheduleAdvance(sessionId: string, ms: number): void {
  const existing = timers.get(sessionId);
  if (existing) clearTimeout(existing);
  timers.set(
    sessionId,
    setTimeout(() => {
      timers.delete(sessionId);
      void transition(sessionId, true).catch((e) => console.error("advance:", e));
    }, Math.max(0, ms)),
  );
}

/** Lazy advance for serverless: call when reading state. */
export async function maybeAutoAdvance(sessionId: string): Promise<void> {
  const s = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!s || s.paused || !s.phaseEndsAt) return;
  if (!s.phase || !TIMED_PHASES.includes(s.phase)) return;
  if (Date.now() >= s.phaseEndsAt.getTime()) await transition(sessionId, true);
}

// ───────────────────────── Host controls (FR-HOST-02..05) ─────────────────────────

async function assertHost(hostUserId: string, sessionId: string) {
  const s = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!s) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (s.hostUserId !== hostUserId) throw new ApiError("FORBIDDEN", 403);
  return s;
}

export async function hostNext(hostUserId: string, sessionId: string): Promise<void> {
  await assertHost(hostUserId, sessionId);
  await transition(sessionId, false);
}

export async function hostPause(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.paused || !s.phaseEndsAt) return;
  const remaining = Math.max(0, s.phaseEndsAt.getTime() - Date.now());
  const t = timers.get(sessionId);
  if (t) clearTimeout(t);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { paused: true, pausedRemainingMs: remaining, phaseEndsAt: null },
  });
  await touch(sessionId, "session:paused");
}

export async function hostResume(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (!s.paused) return;
  const remaining = s.pausedRemainingMs ?? 0;
  const phaseEndsAt = new Date(Date.now() + remaining);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { paused: false, pausedRemainingMs: null, phaseEndsAt },
  });
  scheduleAdvance(sessionId, remaining);
  await touch(sessionId, "session:resumed");
}

export async function hostExtend(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.phase === "SETTLEMENT" || !s.phaseEndsAt) throw new ApiError("CANNOT_EXTEND", 409);
  if (s.phaseExtensions >= MAX_PHASE_EXTENSIONS) throw new ApiError("EXTEND_LIMIT", 409);
  const phaseEndsAt = new Date(s.phaseEndsAt.getTime() + PHASE_EXTENSION_SEC * 1000);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { phaseEndsAt, phaseExtensions: { increment: 1 } },
  });
  scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await touch(sessionId, "session:extended");
}

export async function hostEnd(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  const t = timers.get(sessionId);
  if (t) clearTimeout(t);
  const status = s.status === "DEBRIEF" ? "COMPLETED" : "INCOMPLETE";
  await db.gameSession.update({
    where: { id: sessionId },
    data: { status, phase: null, phaseEndsAt: null, endedAt: new Date() },
  });
  await touch(sessionId, "session:ended", { status });
}

export async function hostCancel(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.status !== "LOBBY" && s.status !== "CREATED")
    throw new ApiError("INVALID_STATE", 409);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED", endedAt: new Date() },
  });
  await touch(sessionId, "session:ended", { status: "CANCELLED" });
}
