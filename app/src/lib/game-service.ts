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
  SCENARIO_VERSION,
  compositionTarget,
  compositionSlots,
} from "./scenario";
import {
  effectiveLaborTime,
  effectiveProductionCapacity,
  effectiveUnitCostVnd,
  socialLaborTime,
  unitValueVnd,
} from "./economy";
import { settleRound } from "./settlement";
import {
  clearBotMarketTimers,
  runBotDecisions,
  runBotMarket,
  scheduleBotMarketWaves,
} from "./bots";
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
  assertRoleEditable(a);
  assertRoleEditable(b);

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

function assertRoleEditable(p: { isBot: boolean; ready: boolean }): void {
  if (!p.isBot && p.ready) {
    throw new ApiError("PARTICIPANT_READY_LOCKED", 409);
  }
}

/** Host assigns a role (and producer profile) in the lobby. */
export async function hostSetParticipantRole(
  hostUserId: string,
  sessionId: string,
  participantId: string,
  role: Role | null,
  productivityProfile?: ProductivityProfile | null,
): Promise<void> {
  const session = await assertLobbyHost(hostUserId, sessionId);
  const p = await db.participant.findFirst({ where: { id: participantId, sessionId } });
  if (!p) throw new ApiError("NOT_FOUND", 404);
  assertRoleEditable(p);

  if (role && role !== p.role) {
    const roleCount = await db.participant.count({ where: { sessionId, role } });
    const target = compositionTarget(session.maxPlayers);
    if (roleCount >= target[role]) throw new ApiError("ROLE_CAP_REACHED", 409);
  }

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
  const session = await assertLobbyHost(hostUserId, sessionId);
  const participants = await db.participant.findMany({
    where: { sessionId },
    select: { role: true },
  });
  if (participants.length >= session.maxPlayers) {
    throw new ApiError("SESSION_FULL", 409);
  }

  const target = compositionTarget(session.maxPlayers);
  const counts = countRoles(participants);
  if (ROLES.some((candidate) => counts[candidate] > target[candidate])) {
    throw new ApiError("INVALID_ROLE_DISTRIBUTION", 409);
  }
  if (counts[role] >= target[role]) throw new ApiError("ROLE_CAP_REACHED", 409);

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

const ROLES: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];

/** Fill every unoccupied target role slot with a lobby bot. */
export async function hostAutoFillBots(
  hostUserId: string,
  sessionId: string,
): Promise<void> {
  const session = await assertLobbyHost(hostUserId, sessionId);
  const participants = await db.participant.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { role: true, isBot: true },
  });

  if (participants.length >= session.maxPlayers) {
    throw new ApiError("SESSION_FULL", 409);
  }
  if (participants.some((participant) => !participant.role)) {
    throw new ApiError(
      "NOT_ALL_ROLES_ASSIGNED",
      409,
      "Hãy gán vai cho mọi người chơi trước khi tự động thêm bot.",
    );
  }

  const target = compositionTarget(session.maxPlayers);
  const counts = countRoles(participants);
  if (ROLES.some((role) => counts[role] > target[role])) {
    throw new ApiError("INVALID_ROLE_DISTRIBUTION", 409);
  }

  const missingRoles = ROLES.flatMap((role) =>
    Array<Role>(target[role] - counts[role]).fill(role),
  );
  if (participants.length + missingRoles.length !== session.maxPlayers) {
    throw new ApiError("INVALID_ROLE_DISTRIBUTION", 409);
  }

  const producerProfiles =
    PROFILE_ASSIGNMENT[target.PRODUCER] ?? PROFILE_ASSIGNMENT[2];
  const roleBotCounts = ROLES.reduce(
    (acc, role) => {
      acc[role] = participants.filter(
        (participant) => participant.isBot && participant.role === role,
      ).length;
      return acc;
    },
    { PRODUCER: 0, CONSUMER: 0, INTERMEDIARY: 0, GOVERNMENT: 0 } as Record<
      Role,
      number
    >,
  );
  let producerIndex = counts.PRODUCER;

  await db.participant.createMany({
    data: missingRoles.map((role) => {
      roleBotCounts[role]++;
      return {
        sessionId,
        displayNameSnapshot: botName(role, roleBotCounts[role]),
        role,
        productivityProfile:
          role === "PRODUCER"
            ? producerProfileAt(producerProfiles, producerIndex++)
            : null,
        isBot: true,
        controlMode: "BOT_PERMANENT" as const,
        ready: true,
        presence: "ONLINE" as const,
      };
    }),
  });
  await touch(sessionId, "participant:bot_added", {
    autoFill: true,
    count: missingRoles.length,
  });
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

/** Matches `startSession` manual vs auto-assign branch. */
export function lobbyManualMode(session: {
  autoAssignRoles: boolean;
  participants: { isBot: boolean; role: Role | null }[];
}): boolean {
  const lobbyBots = session.participants.filter((p) => p.isBot);
  return (
    !session.autoAssignRoles ||
    lobbyBots.length > 0 ||
    session.participants.some((p) => p.role !== null)
  );
}

/** Pre-flight for AI-host auto-start — same guards as `startSession`. */
export function canAutoStartLobby(session: {
  autoAssignRoles: boolean;
  status: string;
  participants: { isBot: boolean; role: Role | null; ready: boolean }[];
}): boolean {
  if (session.status !== "LOBBY") return false;

  const humans = session.participants.filter((p) => !p.isBot);
  if (humans.length < 1) return false;
  if (!humans.every((p) => p.ready)) return false;

  if (!lobbyManualMode(session)) return true;

  const lobbyBots = session.participants.filter((p) => p.isBot);
  if (!humans.every((p) => p.role)) return false;
  if (lobbyBots.some((p) => !p.role)) return false;

  const counts = countRoles([...humans, ...lobbyBots]);
  return counts.PRODUCER >= 1 && counts.CONSUMER >= 1;
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
    !session.autoAssignRoles ||
    lobbyBots.length > 0 ||
    session.participants.some((p) => p.role !== null);

  if (manualMode) {
    await startSessionManual(sessionId, session.maxPlayers, humans, lobbyBots);
  } else {
    await startSessionAuto(sessionId, session.maxPlayers, humans);
  }

  await touch(sessionId, "session:started");

  const { autoHost } = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { autoHost: true },
  });
  if (autoHost) await scheduleIntroAdvance(sessionId);
}

function balancedRoleSlots(slots: Role[]): Role[] {
  const pool = countRoles(slots.map((role) => ({ role })));
  const order: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];
  const balanced: Role[] = [];
  while (balanced.length < slots.length) {
    for (const role of order) {
      if (pool[role] <= 0) continue;
      balanced.push(role);
      pool[role]--;
      if (balanced.length >= slots.length) break;
    }
  }
  return balanced;
}

function producerProfileAt(
  profiles: ProductivityProfile[],
  index: number,
): ProductivityProfile {
  return profiles[index] ?? "SOCIAL_AVERAGE";
}

/** Auto-assign humans across balanced slots, then fill remaining seats with bots. */
async function startSessionAuto(
  sessionId: string,
  targetCount: number,
  humans: { id: string }[],
): Promise<void> {
  const slots = balancedRoleSlots(compositionSlots(targetCount));
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
      const profile =
        role === "PRODUCER" ? producerProfileAt(profiles, producerIndex++) : null;
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
  targetCount: number,
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
    throw new ApiError("INVALID_COMPOSITION", 409, "Cần ít nhất 1 nhà cung cấp và 1 khách hàng");
  }

  const targetSlots = compositionSlots(targetCount);
  const targetCounts = countRoles(targetSlots.map((role) => ({ role })));
  if (ROLES.some((role) => counts[role] > targetCounts[role])) {
    throw new ApiError("INVALID_ROLE_DISTRIBUTION", 409);
  }
  const toCreate = missingRoleSlots(targetSlots, assigned).slice(
    0,
    Math.max(0, targetSlots.length - assigned.length),
  );
  const producerCount = targetSlots.filter((r) => r === "PRODUCER").length;
  const profiles = PROFILE_ASSIGNMENT[producerCount] ?? PROFILE_ASSIGNMENT[2];
  const botCounters: Record<Role, number> = {
    PRODUCER: lobbyBots.filter((b) => b.role === "PRODUCER").length,
    CONSUMER: lobbyBots.filter((b) => b.role === "CONSUMER").length,
    INTERMEDIARY: lobbyBots.filter((b) => b.role === "INTERMEDIARY").length,
    GOVERNMENT: lobbyBots.filter((b) => b.role === "GOVERNMENT").length,
  };

  await db.$transaction(async (tx) => {
    let producerIndex = 0;
    for (const p of assigned) {
      if (p.role === "PRODUCER" && !p.productivityProfile) {
        await tx.participant.update({
          where: { id: p.id },
          data: { productivityProfile: producerProfileAt(profiles, producerIndex) },
        });
      }
      if (p.role === "PRODUCER") producerIndex++;
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
            role === "PRODUCER" ? producerProfileAt(profiles, producerIndex++) : null,
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

const BOT_PERSONAS: Record<Role, string[]> = {
  PRODUCER: [
    "Vuon An Phu",
    "Hop tac xa Binh Minh",
    "Trang trai Hong Ngoc",
    "Vuon Thanh Son",
    "Nong ho Tam Chau",
    "Vuon Phu Quy",
  ],
  CONSUMER: [
    "Co Mai",
    "Anh Khoa",
    "Chi Linh",
    "Minh Quan",
    "Bao Tran",
    "Nha Hang Sen",
    "Tiem Nuoc An Nhien",
  ],
  INTERMEDIARY: ["Dai ly Song Xanh", "Kho Van Thanh", "Dai ly Minh Phat"],
  GOVERNMENT: ["Ban quan ly cho", "To dieu phoi gia"],
};

function botName(role: Role, index: number): string {
  const personas = BOT_PERSONAS[role];
  return personas[index - 1] ?? `${personas[personas.length - 1]} ${index}`;
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
  const session = await db.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    select: { totalRounds: true },
  });
  if (n > session.totalRounds) {
    throw new ApiError("INVALID_ROUND", 409);
  }
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
    const productionCapacity = effectiveProductionCapacity(profile, n);
    const unitCost = effectiveUnitCostVnd(profile, n);
    return {
      kind: "PRODUCER",
      scenarioVersion: SCENARIO_VERSION,
      profile,
      productionCapacity,
      unitCostVnd: unitCost,
      individualLaborTime: laborTime,
      individualUnitCostVnd: unitCost,
      availableLaborPoints: productionCapacity * laborTime,
      productionCap: productionCapacity,
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
  if (phase !== "MARKET_OPEN") clearBotMarketTimers(sessionId);
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
  await db.participant.updateMany({
    where: { sessionId, isBot: false },
    data: { phaseReady: false },
  });
  if (timed && phaseEndsAt) scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await touch(sessionId, "round:phase_changed", {
    phase,
    phaseEndsAt: phaseEndsAt?.toISOString() ?? null,
    paused: false,
    phaseExtensions: 0,
  });
  void import("./ai-host").then((m) => m.announcePhase(sessionId));
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
      await touch(sessionId, "round:settled", { round: n });
      return;
    case "SETTLEMENT":
      await setPhase(sessionId, "RECAP");
      return;
    case "RECAP":
      if (n >= session.totalRounds) {
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
  await touch(sessionId, "round:phase_changed", {
    phase: null,
    phaseEndsAt: phaseEndsAt.toISOString(),
    paused: false,
  });
}

/** Force next phase (timer skip / all-ready fast-forward). */
export async function requestPhaseTransition(sessionId: string): Promise<void> {
  clearTimer(sessionId);
  await transition(sessionId, false);
}

/** Mark session complete, persist final scores/badges. */
async function completeSession(sessionId: string): Promise<void> {
  clearTimer(sessionId);
  clearBotMarketTimers(sessionId);
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
  if (s.phase === "MARKET_OPEN") clearBotMarketTimers(sessionId);
  await db.gameSession.update({
    where: { id: sessionId },
    data: { paused: true, pausedRemainingMs: remaining, phaseEndsAt: null },
  });
  await touch(sessionId, "session:paused", {
    paused: true,
    phaseEndsAt: null,
  });
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
  if (s.phase === "MARKET_OPEN") scheduleBotMarketWaves(sessionId, remaining);
  await touch(sessionId, "session:resumed", {
    paused: false,
    phaseEndsAt: phaseEndsAt.toISOString(),
  });
}

export async function hostExtend(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.phase === "SETTLEMENT" || s.phase === "RECAP") {
    throw new ApiError("CANNOT_EXTEND", 409);
  }
  if (s.phaseExtensions >= MAX_PHASE_EXTENSIONS) throw new ApiError("EXTEND_LIMIT", 409);

  if (s.paused) {
    if (s.pausedRemainingMs == null) throw new ApiError("CANNOT_EXTEND", 409);
    const updated = await db.gameSession.update({
      where: { id: sessionId },
      data: {
        pausedRemainingMs: s.pausedRemainingMs + PHASE_EXTENSION_SEC * 1000,
        phaseExtensions: { increment: 1 },
      },
      select: { phaseExtensions: true },
    });
    await touch(sessionId, "session:extended", {
      paused: true,
      phaseEndsAt: null,
      phaseExtensions: updated.phaseExtensions,
    });
    return;
  }

  if (!s.phaseEndsAt) throw new ApiError("CANNOT_EXTEND", 409);
  const phaseEndsAt = new Date(s.phaseEndsAt.getTime() + PHASE_EXTENSION_SEC * 1000);
  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: { phaseEndsAt, phaseExtensions: { increment: 1 } },
    select: { phaseExtensions: true },
  });
  scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await touch(sessionId, "session:extended", {
    paused: false,
    phaseEndsAt: phaseEndsAt.toISOString(),
    phaseExtensions: updated.phaseExtensions,
  });
}

export async function hostEnd(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  clearTimer(sessionId);
  clearBotMarketTimers(sessionId);
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
  await ensureHostParticipant(sessionId, hostUserId);
  await db.gameSession.update({ where: { id: sessionId }, data: { autoHost } });
  await touch(sessionId, "session:auto_host", { autoHost });
}

export async function hostCancel(hostUserId: string, sessionId: string): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.status !== "LOBBY" && s.status !== "CREATED")
    throw new ApiError("INVALID_STATE", 409);
  clearTimer(sessionId);
  clearBotMarketTimers(sessionId);
  await db.gameSession.update({
    where: { id: sessionId },
    data: {
      status: "CANCELLED",
      endedAt: new Date(),
      lobbySoloSince: null,
      lobbySoloExtendUsed: false,
    },
  });
  await touch(sessionId, "session:ended", { status: "CANCELLED", reason: "host_cancelled" });
}

/** Reset the solo-lobby auto-cancel timer (+1 minute) — once per solo wait. */
export async function hostExtendSoloLobby(
  hostUserId: string,
  sessionId: string,
): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.status !== "LOBBY") throw new ApiError("SESSION_LOCKED", 409);
  if (!s.lobbySoloSince) throw new ApiError("INVALID_STATE", 409);
  if (s.lobbySoloExtendUsed) throw new ApiError("SOLO_EXTEND_USED", 409);

  const humanCount = await db.participant.count({
    where: { sessionId, isBot: false },
  });
  if (humanCount > 1) throw new ApiError("INVALID_STATE", 409);

  await db.gameSession.update({
    where: { id: sessionId },
    data: { lobbySoloSince: new Date(), lobbySoloExtendUsed: true },
  });
  await touch(sessionId, "lobby:solo_extended", {});
}
