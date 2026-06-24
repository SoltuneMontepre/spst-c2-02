import type { Role, RoundPhase, SessionStatus, ProductivityProfile } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { ApiError } from "./api";
import { ensureHostParticipant } from "./lobby-seat";
import { publish } from "./events";
import {
  START_MIN_HUMANS,
  PHASE_DURATIONS_SEC,
  PHASE_EXTENSION_SEC,
  MAX_PHASE_EXTENSIONS,
  INTRO_DURATION_SEC,
  DEBRIEF_DURATION_SEC,
  PROFILE_ASSIGNMENT,
  ROUND_EVENTS,
  SCENARIO,
  MAX_PLAYERS,
  compositionSlots,
} from "./scenario";
import {
  effectiveLaborTime,
  individualUnitCostVnd,
  roundResources,
  socialLaborTime,
  unitValueVnd,
} from "./economy";
import { settleRound } from "./settlement";
import { runBotDecisions, runBotMarket } from "./bots";
import { finalizeSession } from "./finalize";
import { scheduleTimer, clearTimer } from "./timer-service";
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

async function assertLobbyHost(hostUserId: string, sessionId: string) {
  const s = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!s) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (s.hostUserId !== hostUserId) throw new ApiError("FORBIDDEN", 403);
  if (s.status !== "LOBBY") throw new ApiError("SESSION_LOCKED", 409);
  return s;
}

/** Host swaps roles between two humans (FR-ROOM-05). */
export async function hostSwapRoles(
  hostUserId: string,
  sessionId: string,
  participantAId: string,
  participantBId: string,
): Promise<void> {
  await assertLobbyHost(hostUserId, sessionId);
  const [a, b] = await Promise.all([
    db.participant.findFirst({ where: { id: participantAId, sessionId, isBot: false } }),
    db.participant.findFirst({ where: { id: participantBId, sessionId, isBot: false } }),
  ]);
  if (!a || !b || !a.role || !b.role) throw new ApiError("NOT_FOUND", 404);

  const profileA = a.productivityProfile;
  const profileB = b.productivityProfile;
  await db.$transaction([
    db.participant.update({
      where: { id: a.id },
      data: { role: b.role, productivityProfile: b.role === "PRODUCER" ? profileB : null },
    }),
    db.participant.update({
      where: { id: b.id },
      data: { role: a.role, productivityProfile: a.role === "PRODUCER" ? profileA : null },
    }),
  ]);
  await touch(sessionId, "participant:role_set", { participantAId, participantBId });
}

/** Host assigns a role (and producer profile) in the lobby. */
export async function hostSetParticipantRole(
  hostUserId: string,
  sessionId: string,
  participantId: string,
  role: Role | null,
  productivityProfile?: ProductivityProfile | null,
): Promise<void> {
  await assertLobbyHost(hostUserId, sessionId);
  const p = await db.participant.findFirst({ where: { id: participantId, sessionId } });
  if (!p) throw new ApiError("NOT_FOUND", 404);

  let profile: ProductivityProfile | null = null;
  if (role === "PRODUCER") {
    profile = productivityProfile ?? p.productivityProfile ?? "SOCIAL_AVERAGE";
  }

  await db.participant.update({
    where: { id: participantId },
    data: { role, productivityProfile: profile },
  });
  await touch(sessionId, "participant:role_set", { participantId, role });
}

/** Host adds a lobby bot with a pre-assigned role. */
export async function hostAddBot(
  hostUserId: string,
  sessionId: string,
  role: Role,
  productivityProfile?: ProductivityProfile | null,
): Promise<void> {
  await assertLobbyHost(hostUserId, sessionId);
  const count = await db.participant.count({ where: { sessionId } });
  if (count >= MAX_PLAYERS) throw new ApiError("SESSION_FULL", 409);

  const roleBotCount = await db.participant.count({
    where: { sessionId, isBot: true, role },
  });
  const profile = role === "PRODUCER" ? (productivityProfile ?? "SOCIAL_AVERAGE") : null;

  await db.participant.create({
    data: {
      sessionId,
      displayNameSnapshot: botName(role, roleBotCount + 1),
      role,
      productivityProfile: profile,
      isBot: true,
      controlMode: "BOT_PERMANENT",
      ready: true,
      presence: "ONLINE",
    },
  });
  await touch(sessionId, "participant:bot_added", { role });
}

/** Host removes a lobby bot. */
export async function hostRemoveBot(
  hostUserId: string,
  sessionId: string,
  participantId: string,
): Promise<void> {
  await assertLobbyHost(hostUserId, sessionId);
  const p = await db.participant.findFirst({
    where: { id: participantId, sessionId, isBot: true },
  });
  if (!p) throw new ApiError("NOT_FOUND", 404);
  await db.participant.delete({ where: { id: participantId } });
  await touch(sessionId, "participant:bot_removed", { participantId });
}

async function createInitialWallet(
  tx: Prisma.TransactionClient,
  sessionId: string,
  participantId: string,
  role: Role,
): Promise<void> {
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

function countRoles(participants: { role: Role | null }[]): Record<Role, number> {
  const counts: Record<Role, number> = {
    PRODUCER: 0,
    CONSUMER: 0,
    INTERMEDIARY: 0,
    GOVERNMENT: 0,
  };
  for (const p of participants) {
    if (p.role) counts[p.role]++;
  }
  return counts;
}

/** Slots still needed after manual lobby assignments. */
function missingRoleSlots(
  target: Role[],
  assigned: { role: Role | null }[],
): Role[] {
  const pool = countRoles(assigned);
  const missing: Role[] = [];
  for (const role of target) {
    if (pool[role] > 0) pool[role]--;
    else missing.push(role);
  }
  return missing;
}

/** Host start guard + full game initialization (FR-HOST-01, BR-ROLE-01). */
export async function startSession(
  hostUserId: string,
  sessionId: string,
): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.hostUserId !== hostUserId) throw new ApiError("FORBIDDEN", 403);
  if (session.status !== "LOBBY") throw new ApiError("INVALID_STATE", 409);

  const humans = session.participants.filter((p) => !p.isBot);
  const lobbyBots = session.participants.filter((p) => p.isBot);
  const minHumans = session.autoHost ? 1 : START_MIN_HUMANS;
  if (humans.length < minHumans) throw new ApiError("UNDER_MIN_PLAYERS", 409);
  if (!humans.every((p) => p.ready)) throw new ApiError("NOT_ALL_READY", 409);

  const manualMode =
    lobbyBots.length > 0 || session.participants.some((p) => p.role !== null);

  if (manualMode) {
    await startSessionManual(sessionId, humans, lobbyBots);
  } else {
    await startSessionAuto(sessionId, humans);
  }

  await touch(sessionId, "session:started");

  const { autoHost } = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { autoHost: true },
  });
  if (autoHost) await scheduleIntroAdvance(sessionId);
}

/** Legacy auto-assign: humans take first slots, bots fill the rest. */
async function startSessionAuto(
  sessionId: string,
  humans: { id: string }[],
): Promise<void> {
  const slots = compositionSlots(humans.length);
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
      await createInitialWallet(tx, sessionId, participantId, role);
    }

    await tx.gameSession.update({
      where: { id: sessionId },
      data: { status: "INTRO", startedAt: new Date() },
    });
  });
}

/** Manual lobby: honor host assignments, fill any remaining standard slots with bots. */
async function startSessionManual(
  sessionId: string,
  humans: { id: string; role: Role | null; productivityProfile: ProductivityProfile | null }[],
  lobbyBots: { id: string; role: Role | null; productivityProfile: ProductivityProfile | null }[],
): Promise<void> {
  if (!humans.every((p) => p.role)) {
    throw new ApiError("NOT_ALL_ROLES_ASSIGNED", 409, "Mọi người chơi cần được gán vai");
  }
  if (lobbyBots.some((p) => !p.role)) {
    throw new ApiError("NOT_ALL_ROLES_ASSIGNED", 409, "Mọi bot cần được gán vai");
  }

  const assigned = [...humans, ...lobbyBots];
  const counts = countRoles(assigned);
  if (counts.PRODUCER < 1 || counts.CONSUMER < 1) {
    throw new ApiError("INVALID_COMPOSITION", 409, "Cần ít nhất 1 sản xuất và 1 tiêu dùng");
  }

  const toCreate = missingRoleSlots(compositionSlots(humans.length), assigned);
  const botCounters: Record<Role, number> = {
    PRODUCER: lobbyBots.filter((b) => b.role === "PRODUCER").length,
    CONSUMER: lobbyBots.filter((b) => b.role === "CONSUMER").length,
    INTERMEDIARY: lobbyBots.filter((b) => b.role === "INTERMEDIARY").length,
    GOVERNMENT: lobbyBots.filter((b) => b.role === "GOVERNMENT").length,
  };

  await db.$transaction(async (tx) => {
    for (const p of assigned) {
      if (p.role === "PRODUCER" && !p.productivityProfile) {
        await tx.participant.update({
          where: { id: p.id },
          data: { productivityProfile: "SOCIAL_AVERAGE" },
        });
      }
    }

    const roster: { id: string; role: Role }[] = assigned.map((p) => ({
      id: p.id,
      role: p.role!,
    }));

    for (const role of toCreate) {
      botCounters[role]++;
      const bot = await tx.participant.create({
        data: {
          sessionId,
          displayNameSnapshot: botName(role, botCounters[role]),
          role,
          productivityProfile:
            role === "PRODUCER" ? "SOCIAL_AVERAGE" : null,
          isBot: true,
          controlMode: "BOT_PERMANENT",
          ready: true,
          presence: "ONLINE",
        },
      });
      roster.push({ id: bot.id, role });
    }

    for (const { id, role } of roster) {
      await createInitialWallet(tx, sessionId, id, role);
    }

    await tx.gameSession.update({
      where: { id: sessionId },
      data: { status: "INTRO", startedAt: new Date() },
    });
  });
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

      // Apply pending tech upgrade from previous round (SRS §5.4).
      if (n > 1 && p.role === "PRODUCER") {
        const prevRound = await tx.round.findUnique({
          where: { sessionId_number: { sessionId, number: n - 1 } },
        });
        if (prevRound) {
          const prevRs = await tx.roleState.findUnique({
            where: {
              participantId_roundId: { participantId: p.id, roundId: prevRound.id },
            },
          });
          const prev = prevRs?.state as unknown as ProducerRoundState | undefined;
          if (prev?.pendingUpgrade) {
            await tx.participant.update({
              where: { id: p.id },
              data: { productivityProfile: prev.pendingUpgrade },
            });
            p.productivityProfile = prev.pendingUpgrade;
          }
        }
      }

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
    return {
      kind: "CONSUMER",
      needTarget: needTarget ?? 0,
      fulfilledUnits: 0,
      retailSpendingVnd: 0,
      reservedOfferVnd: 0,
    };
  }
  if (role === "INTERMEDIARY") {
    return {
      kind: "INTERMEDIARY",
      connectedProducerIds: [],
      connectedConsumerIds: [],
      spoiledQuantity: 0,
    };
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
  const session = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { autoHost: true, currentRound: true },
  });
  // RECAP is host-driven by default, but the AI host auto-advances it too.
  const timed = TIMED_PHASES.includes(phase) || (phase === "RECAP" && session.autoHost);
  const durationSec = phaseDurationSec(phase);
  const phaseEndsAt = timed ? new Date(Date.now() + durationSec * 1000) : null;
  await db.gameSession.update({
    where: { id: sessionId },
    data: { phase, phaseEndsAt, phaseExtensions: 0, paused: false, pausedRemainingMs: null },
  });
  await db.round.updateMany({
    where: { sessionId, number: session.currentRound },
    data: { phase },
  });
  if (timed && phaseEndsAt) scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await touch(sessionId, "round:phase_changed", { phase });
  void import("./ai-host").then((m) =>
    Promise.all([m.resetPhaseReady(sessionId), m.announcePhase(sessionId)]),
  );
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
  // AI host finishes the session after the debrief settles.
  if (session.status === "DEBRIEF") {
    if (session.autoHost) await completeSession(sessionId);
    return;
  }
  if (!session.phase) return;

  switch (session.phase) {
    case "EVENT":
      await setPhase(sessionId, "DECISION");
      await runBotDecisions(sessionId);
      return;
    case "DECISION":
      await setPhase(sessionId, "MARKET_OPEN");
      await runBotMarket(sessionId);
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
        const phaseEndsAt = session.autoHost
          ? new Date(Date.now() + DEBRIEF_DURATION_SEC * 1000)
          : null;
        await db.gameSession.update({
          where: { id: sessionId },
          data: { status: "DEBRIEF", phase: null, phaseEndsAt },
        });
        await finalizeSession(sessionId).catch((e) => console.error("finalize:", e));
        if (session.autoHost && phaseEndsAt) {
          scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
        }
        void import("./ai-host").then((m) => m.announcePhase(sessionId));
        await touch(sessionId, "session:debrief");
      } else {
        await enterRound(sessionId, n + 1);
      }
      return;
  }
}

// Persistent server timers (Docker deployment).
function scheduleAdvance(sessionId: string, ms: number): void {
  scheduleTimer(sessionId, ms, () => {
    void transition(sessionId, true).catch((e) => console.error("advance:", e));
  });
}

async function scheduleIntroAdvance(sessionId: string): Promise<void> {
  const phaseEndsAt = new Date(Date.now() + INTRO_DURATION_SEC * 1000);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { phaseEndsAt },
  });
  scheduleAdvance(sessionId, INTRO_DURATION_SEC * 1000);
  void import("./ai-host").then((m) => m.announcePhase(sessionId));
}

/** Force next phase (timer skip / all-ready fast-forward). */
export async function requestPhaseTransition(sessionId: string): Promise<void> {
  clearTimer(sessionId);
  await transition(sessionId, false);
}

/** Mark session complete, persist final scores/badges. */
async function completeSession(sessionId: string): Promise<void> {
  clearTimer(sessionId);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", phase: null, phaseEndsAt: null, endedAt: new Date() },
  });
  await finalizeSession(sessionId).catch((e) => console.error("finalize:", e));
  await touch(sessionId, "session:ended", { status: "COMPLETED" });
}

/** Lazy advance for serverless: call when reading state. */
export async function maybeAutoAdvance(sessionId: string): Promise<void> {
  const s = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!s || s.paused || !s.phaseEndsAt) return;
  if (Date.now() < s.phaseEndsAt.getTime()) return;

  if (s.status === "INTRO" && s.autoHost) {
    await transition(sessionId, true);
    return;
  }
  if (s.status === "DEBRIEF" && s.autoHost) {
    await completeSession(sessionId);
    return;
  }
  if (!s.phase) return;
  const timed = TIMED_PHASES.includes(s.phase) || (s.phase === "RECAP" && s.autoHost);
  if (timed) await transition(sessionId, true);
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
  clearTimer(sessionId);
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
  clearTimer(sessionId);
  const status = s.status === "DEBRIEF" ? "COMPLETED" : "INCOMPLETE";
  await db.gameSession.update({
    where: { id: sessionId },
    data: { status, phase: null, phaseEndsAt: null, endedAt: new Date() },
  });
  await finalizeSession(sessionId).catch((e) => console.error("finalize:", e));
  await touch(sessionId, "session:ended", { status });
}

/** Toggle AI host auto-pilot (lobby only). */
export async function hostSetAutoHost(
  hostUserId: string,
  sessionId: string,
  autoHost: boolean,
): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.status !== "LOBBY") throw new ApiError("INVALID_STATE", 409);
  if (autoHost) await ensureHostParticipant(sessionId, hostUserId);
  await db.gameSession.update({ where: { id: sessionId }, data: { autoHost } });
  await touch(sessionId, "session:auto_host", { autoHost });
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
