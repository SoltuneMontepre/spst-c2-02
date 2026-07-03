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
  ALL_READY_COUNTDOWN_SEC,
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
  runFinalBotConsumerPass,
  scheduleBotMarketWaves,
} from "./bots";
import { finalizeSession } from "./finalize";
import { withSessionLock } from "./session-lock";
import { scheduleTimer, clearTimer } from "./timer-service";
import { ROUND_NAMES, PHASE_BANNERS } from "./labels";
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

const EVENT_NARRATION: Record<number, string> = {
  1: "Thị trường cơ sở — giá trị 10 nghìn Đồng là mốc so sánh.",
  2: "Được mùa — cung tăng, giá có thể chịu áp lực giảm.",
  3: "Thanh long viral — cầu tăng, chợ có thể nóng lên.",
  4: "Công nghệ phổ biến — giá trị chuẩn giảm còn 6 nghìn Đồng.",
};

/** Static host line written with the phase row (no separate LLM / write race). */
function phaseNarration(input: {
  status: string;
  phase: string | null;
  currentRound: number;
  autoHost: boolean;
}): string | null {
  if (!input.autoHost) return null;
  const round = input.currentRound;
  const phase = input.phase;
  if (input.status === "INTRO") {
    return "Bốn vòng chợ thanh long sắp bắt đầu — hãy nhớ phân biệt giá trị và giá cả.";
  }
  if (phase === "EVENT" && round > 0) {
    return `${ROUND_NAMES[round]}: ${EVENT_NARRATION[round] ?? "Biến cố mới của vòng."}`;
  }
  if (phase && PHASE_BANNERS[phase]) {
    return `${PHASE_BANNERS[phase]}. ${round ? `Vòng ${round}.` : ""} Hãy ra quyết định trước khi hết giờ.`;
  }
  if (input.status === "DEBRIEF") {
    return "Phiên sắp kết thúc. Hãy xem lại dữ liệu thị trường và so sánh với lý thuyết.";
  }
  return "Chào mừng đến Phiên chợ giá trị.";
}

/** Postgres deadlocks (40P01) and Prisma P2028 ("unable to start a
 *  transaction in the given time" — connection pool briefly saturated,
 *  or a Neon cold start) are both transient: safe to retry shortly after. */
function isTransientDbError(error: unknown): boolean {
  const code =
    (error as { code?: string })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code ??
    (error as { meta?: { code?: string } })?.meta?.code;
  const message = String((error as { message?: string })?.message ?? error);
  return (
    code === "40P01" ||
    code === "P2028" ||
    /deadlock detected/i.test(message) ||
    /unable to start a transaction/i.test(message)
  );
}

/** Increment stateVersion and broadcast (TECH-REALTIME). */
async function touch(sessionId: string, type: string, data?: unknown): Promise<void> {
  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await import("./session-service")
    .then((m) => m.refreshLiveRoom(sessionId))
    .catch((e) => console.error("live-room refresh:", e));
  await publish({ sessionId, type, stateVersion: updated.stateVersion, data });
}

/** Broadcast after a write that already bumped stateVersion. */
async function publishState(
  sessionId: string,
  stateVersion: number,
  type: string,
  data?: unknown,
): Promise<void> {
  await import("./session-service")
    .then((m) => m.refreshLiveRoom(sessionId))
    .catch((e) => console.error("live-room refresh:", e));
  await publish({ sessionId, type, stateVersion, data });
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

/**
 * Player picks their own lobby role (null = Ngẫu nhiên).
 * Slot caps follow compositionTarget — full roles cannot be selected.
 */
export async function setOwnLobbyRole(
  userId: string,
  sessionId: string,
  role: Role | null,
  productivityProfile?: ProductivityProfile | null,
): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.status !== "LOBBY") throw new ApiError("INVALID_STATE", 409);
  if (session.autoAssignRoles) {
    throw new ApiError("INVALID_STATE", 409, "Phòng đang tự động phân vai");
  }

  const p = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
  });
  if (!p) throw new ApiError("FORBIDDEN", 403);
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
    where: { id: p.id },
    data: { role, productivityProfile: profile },
  });
  await touch(sessionId, "participant:role_set", { participantId: p.id, role });
}

/** Host route compatibility — only allows the host to set their own role. */
export async function hostSetParticipantRole(
  hostUserId: string,
  sessionId: string,
  participantId: string,
  role: Role | null,
  productivityProfile?: ProductivityProfile | null,
): Promise<void> {
  const p = await db.participant.findFirst({
    where: { id: participantId, sessionId, userId: hostUserId, isBot: false },
  });
  if (!p) throw new ApiError("FORBIDDEN", 403, "Chỉ được chọn vai của chính mình");
  await setOwnLobbyRole(hostUserId, sessionId, role, productivityProfile);
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
  maxPlayers: number;
  participants: { isBot: boolean; role: Role | null; ready: boolean }[];
}): boolean {
  if (session.status !== "LOBBY") return false;

  const humans = session.participants.filter((p) => !p.isBot);
  if (humans.length < 1) return false;
  if (!humans.every((p) => p.ready)) return false;

  if (!lobbyManualMode(session)) return true;

  // null role = Ngẫu nhiên (resolved at start). Only reject over-cap picks.
  const target = compositionTarget(session.maxPlayers);
  const counts = countRoles(humans);
  return ROLES.every((role) => counts[role] <= target[role]);
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

export type StartRoleAssignment = {
  participantId: string;
  role: Role;
  productivityProfile?: ProductivityProfile | null;
};

/** Resolve null (Ngẫu nhiên) picks into concrete roles within composition caps. */
function assignRandomLobbyRoles(
  humans: {
    id: string;
    role: Role | null;
    productivityProfile: ProductivityProfile | null;
  }[],
  maxPlayers: number,
): {
  id: string;
  role: Role;
  productivityProfile: ProductivityProfile | null;
}[] {
  const target = compositionTarget(maxPlayers);
  const counts: Record<Role, number> = {
    PRODUCER: 0,
    CONSUMER: 0,
    INTERMEDIARY: 0,
    GOVERNMENT: 0,
  };
  for (const h of humans) {
    if (h.role) counts[h.role]++;
  }
  if (ROLES.some((role) => counts[role] > target[role])) {
    throw new ApiError("INVALID_ROLE_DISTRIBUTION", 409);
  }

  const pool: Role[] = [];
  for (const role of ROLES) {
    for (let i = counts[role]; i < target[role]; i++) pool.push(role);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let poolIdx = 0;
  return humans.map((h) => {
    if (h.role) {
      return {
        id: h.id,
        role: h.role,
        productivityProfile:
          h.role === "PRODUCER"
            ? (h.productivityProfile ?? "SOCIAL_AVERAGE")
            : null,
      };
    }
    const role = pool[poolIdx++];
    if (!role) {
      throw new ApiError("INVALID_COMPOSITION", 409, "Không đủ chỗ vai cho người chơi");
    }
    return {
      id: h.id,
      role,
      // Leave profile unset so startSessionManual draws from the shuffled pool.
      productivityProfile: null,
    };
  });
}

/** Host start guard + full game initialization (FR-HOST-01, BR-ROLE-01). */
export async function startSession(
  hostUserId: string,
  sessionId: string,
  _options?: { roleAssignments?: StartRoleAssignment[] },
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

  if (!session.autoAssignRoles) {
    // Players may pick a role or leave it Random (null). Resolve random picks,
    // drop lobby bots, and fill remaining seats with bots.
    await db.participant.deleteMany({ where: { sessionId, isBot: true } });
    const humansWithRoles = assignRandomLobbyRoles(humans, session.maxPlayers);
    await startSessionManual(sessionId, session.maxPlayers, humansWithRoles, []);
  } else if (lobbyManualMode(session)) {
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

/** Shuffle so humans are not deterministically handed TRADITIONAL (worst). */
function shuffledProducerProfiles(producerCount: number): ProductivityProfile[] {
  const base = PROFILE_ASSIGNMENT[producerCount] ?? PROFILE_ASSIGNMENT[2];
  const profiles = [...base];
  for (let i = profiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [profiles[i], profiles[j]] = [profiles[j], profiles[i]];
  }
  return profiles;
}

/** Auto-assign humans across balanced slots, then fill remaining seats with bots. */
async function startSessionAuto(
  sessionId: string,
  targetCount: number,
  humans: { id: string }[],
): Promise<void> {
  const slots = balancedRoleSlots(compositionSlots(targetCount));
  const producerCount = slots.filter((r) => r === "PRODUCER").length;
  // Shuffle profiles so the first human producer slot is not always TRADITIONAL.
  const profiles = shuffledProducerProfiles(producerCount);
  const botCounters: Record<Role, number> = {
    PRODUCER: 0,
    CONSUMER: 0,
    INTERMEDIARY: 0,
    GOVERNMENT: 0,
  };

  await db.$transaction(async (tx) => {
    // Parent row first — avoids FK ShareLock upgrade deadlocks with heartbeats.
    await tx.gameSession.update({
      where: { id: sessionId },
      data: { status: "INTRO", startedAt: new Date() },
    });

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

  const targetSlots = compositionSlots(targetCount);
  const targetCounts = countRoles(targetSlots.map((role) => ({ role })));
  if (ROLES.some((role) => counts[role] > targetCounts[role])) {
    throw new ApiError("INVALID_ROLE_DISTRIBUTION", 409);
  }
  // Bots fill remaining target seats — validate the final roster, not humans alone.
  const toCreate = missingRoleSlots(targetSlots, assigned).slice(
    0,
    Math.max(0, targetSlots.length - assigned.length),
  );
  const finalCounts = countRoles([
    ...assigned,
    ...toCreate.map((role) => ({ role })),
  ]);
  if (finalCounts.PRODUCER < 1 || finalCounts.CONSUMER < 1) {
    throw new ApiError("INVALID_COMPOSITION", 409, "Cần ít nhất 1 nhà cung cấp và 1 khách hàng");
  }
  const producerCount = targetSlots.filter((r) => r === "PRODUCER").length;
  // Shuffle, then reserve profiles already chosen in lobby so bots get the rest.
  const profilePool = shuffledProducerProfiles(producerCount);
  for (const p of assigned) {
    if (p.role !== "PRODUCER" || !p.productivityProfile) continue;
    const idx = profilePool.indexOf(p.productivityProfile);
    if (idx >= 0) profilePool.splice(idx, 1);
  }
  const botCounters: Record<Role, number> = {
    PRODUCER: lobbyBots.filter((b) => b.role === "PRODUCER").length,
    CONSUMER: lobbyBots.filter((b) => b.role === "CONSUMER").length,
    INTERMEDIARY: lobbyBots.filter((b) => b.role === "INTERMEDIARY").length,
    GOVERNMENT: lobbyBots.filter((b) => b.role === "GOVERNMENT").length,
  };

  await db.$transaction(async (tx) => {
    // Parent row first — avoids FK ShareLock upgrade deadlocks with heartbeats.
    await tx.gameSession.update({
      where: { id: sessionId },
      data: { status: "INTRO", startedAt: new Date() },
    });

    let poolIdx = 0;
    const roster: { id: string; role: Role }[] = [];

    for (const p of assigned) {
      let profile: ProductivityProfile | null = null;
      if (p.role === "PRODUCER") {
        profile =
          p.productivityProfile ??
          profilePool[poolIdx++] ??
          "SOCIAL_AVERAGE";
      }
      await tx.participant.update({
        where: { id: p.id },
        data: { role: p.role, productivityProfile: profile },
      });
      roster.push({ id: p.id, role: p.role! });
    }

    for (const role of toCreate) {
      botCounters[role]++;
      const bot = await tx.participant.create({
        data: {
          sessionId,
          displayNameSnapshot: botName(role, botCounters[role]),
          role,
          productivityProfile:
            role === "PRODUCER"
              ? (profilePool[poolIdx++] ?? "SOCIAL_AVERAGE")
              : null,
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
    select: { totalRounds: true, autoHost: true },
  });
  if (n > session.totalRounds) {
    throw new ApiError("INVALID_ROUND", 409);
  }
  const cfg = roundConfig(n);
  const participants = await db.participant.findMany({
    where: { sessionId },
    include: { wallet: true },
  });
  const previousRound =
    n > 1
      ? await db.round.findUnique({
          where: { sessionId_number: { sessionId, number: n - 1 } },
          include: { roleStates: { where: { role: "PRODUCER" } } },
        })
      : null;
  const previousProducerState = new Map(
    (previousRound?.roleStates ?? []).map((state) => [
      state.participantId,
      state.state as unknown as ProducerRoundState,
    ]),
  );
  const upgradeIds: Record<ProductivityProfile, string[]> = {
    TRADITIONAL: [],
    SOCIAL_AVERAGE: [],
    PIONEER: [],
  };
  for (const participant of participants) {
    if (participant.role !== "PRODUCER") continue;
    const upgrade = previousProducerState.get(participant.id)?.pendingUpgrade;
    if (!upgrade) continue;
    participant.productivityProfile = upgrade;
    upgradeIds[upgrade].push(participant.id);
  }

  const consumerCount = participants.filter((p) => p.role === "CONSUMER").length;
  const needPlan = distributeNeed(consumerCount, n);
  const phaseEndsAt = new Date(Date.now() + PHASE_DURATIONS_SEC.EVENT * 1000);
  const status = `ROUND_${n}` as SessionStatus;
  const narration = phaseNarration({
    status,
    phase: "EVENT",
    currentRound: n,
    autoHost: session.autoHost,
  });

  // Lock GameSession first (RowExclusive), then children. Updating participants
  // before the session row takes a ShareLock on GameSession via FK checks; a
  // concurrent touch/heartbeat that wants Exclusive then deadlocks on upgrade.
  const stateVersion = await db.$transaction(
    async (tx) => {
      const updated = await tx.gameSession.update({
        where: { id: sessionId },
        data: {
          status,
          currentRound: n,
          phase: "EVENT",
          phaseEndsAt,
          phaseExtensions: 0,
          paused: false,
          pausedRemainingMs: null,
          ...(narration != null ? { aiNarration: narration } : {}),
          stateVersion: { increment: 1 },
        },
        select: { stateVersion: true },
      });

      const round = await tx.round.upsert({
        where: { sessionId_number: { sessionId, number: n } },
        create: { sessionId, number: n, phase: "EVENT", ...cfg },
        update: { phase: "EVENT", ...cfg },
      });
      const initializedCount = await tx.roleState.count({
        where: { roundId: round.id },
      });

      if (initializedCount === 0) {
        for (const profile of Object.keys(upgradeIds) as ProductivityProfile[]) {
          if (upgradeIds[profile].length === 0) continue;
          await tx.participant.updateMany({
            where: { id: { in: upgradeIds[profile] } },
            data: { productivityProfile: profile },
          });
        }

        const consumers = participants.filter(
          (participant) => participant.role === "CONSUMER" && participant.wallet,
        );
        if (consumers.length > 0) {
          await tx.wallet.updateMany({
            where: { participantId: { in: consumers.map((consumer) => consumer.id) } },
            data: { balanceVnd: { increment: SCENARIO.consumerSubsidyPerRoundVnd } },
          });
          await tx.ledgerEntry.createMany({
            data: consumers.map((consumer) => ({
              sessionId,
              roundId: round.id,
              walletId: consumer.wallet!.id,
              type: "SUBSIDY",
              amountVnd: SCENARIO.consumerSubsidyPerRoundVnd,
            })),
          });
        }

        let consumerIndex = 0;
        const roleStates = participants.flatMap((participant) => {
          if (!participant.role) return [];
          const state = buildRoleState(
            participant.role,
            participant.productivityProfile,
            n,
            needPlan[consumerIndex],
          ) as unknown as Prisma.InputJsonValue;
          if (participant.role === "CONSUMER") consumerIndex++;
          return [{
            participantId: participant.id,
            roundId: round.id,
            role: participant.role,
            state,
          }];
        });
        await tx.roleState.createMany({ data: roleStates, skipDuplicates: true });
      }

      await tx.participant.updateMany({
        where: { sessionId, isBot: false },
        data: { phaseReady: false },
      });

      return updated.stateVersion;
    },
    { timeout: 15_000 },
  );

  scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await publishState(sessionId, stateVersion, "round:phase_changed", {
    phase: "EVENT",
    phaseEndsAt: phaseEndsAt.toISOString(),
    paused: false,
    phaseExtensions: 0,
  });
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
    select: { autoHost: true, currentRound: true, status: true },
  });
  // RECAP is host-driven by default, but the AI host auto-advances it too.
  const timed = TIMED_PHASES.includes(phase) || (phase === "RECAP" && session.autoHost);
  const durationSec = phaseDurationSec(phase);
  const phaseEndsAt = timed ? new Date(Date.now() + durationSec * 1000) : null;
  const narration = phaseNarration({
    status: session.status,
    phase,
    currentRound: session.currentRound,
    autoHost: session.autoHost,
  });

  const stateVersion = await db.$transaction(async (tx) => {
    const updated = await tx.gameSession.update({
      where: { id: sessionId },
      data: {
        phase,
        phaseEndsAt,
        phaseExtensions: 0,
        paused: false,
        pausedRemainingMs: null,
        ...(narration != null ? { aiNarration: narration } : {}),
        stateVersion: { increment: 1 },
      },
      select: { stateVersion: true },
    });
    await tx.round.updateMany({
      where: { sessionId, number: session.currentRound },
      data: { phase },
    });
    await tx.participant.updateMany({
      where: { sessionId, isBot: false },
      data: { phaseReady: false },
    });
    return updated.stateVersion;
  });

  if (timed && phaseEndsAt) scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
  await publishState(sessionId, stateVersion, "round:phase_changed", {
    phase,
    phaseEndsAt: phaseEndsAt?.toISOString() ?? null,
    paused: false,
    phaseExtensions: 0,
  });
}

/** One forward step in the round/phase machine.
 *  Serialized by withSessionLock (Redis + in-process) — no DB lease needed. */
async function transition(sessionId: string, auto: boolean): Promise<void> {
  await withSessionLock(sessionId, async () => {
    const session = await db.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return;
    if (auto) {
      if (session.paused) return;
      if (!session.phaseEndsAt) return;
      const dueIn = session.phaseEndsAt.getTime() - Date.now();
      // Timer fired early — reschedule the remainder instead of no-oping forever.
      if (dueIn > 1000) {
        scheduleAdvance(sessionId, dueIn);
        return;
      }
    }
    const n = session.currentRound;

    try {
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
          // Consumer-buying waves are scheduled late in the phase (~70-88%
          // through) and get cancelled if this transition fires early (host
          // force-advance, or a restart that dropped the timers) — give
          // bots one guaranteed last chance to buy before settling.
          await runFinalBotConsumerPass(sessionId);
          await settleRound(sessionId, n);
          await setPhase(sessionId, "SETTLEMENT");
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
            const narration = phaseNarration({
              status: "DEBRIEF",
              phase: null,
              currentRound: n,
              autoHost: session.autoHost,
            });
            const debrief = await db.gameSession.update({
              where: { id: sessionId },
              data: {
                status: "DEBRIEF",
                phase: null,
                phaseEndsAt,
                ...(narration != null ? { aiNarration: narration } : {}),
                stateVersion: { increment: 1 },
              },
              select: { stateVersion: true },
            });
            await finalizeSession(sessionId).catch((e) => console.error("finalize:", e));
            if (session.autoHost && phaseEndsAt) {
              scheduleAdvance(sessionId, phaseEndsAt.getTime() - Date.now());
            }
            await publishState(sessionId, debrief.stateVersion, "session:debrief");
          } else {
            await enterRound(sessionId, n + 1);
          }
          return;
      }
    } catch (error) {
      if (auto || isTransientDbError(error)) scheduleAdvance(sessionId, 2_000);
      throw error;
    }
  });
}

const transitionState = globalThis as typeof globalThis & {
  phaseTransitions?: Map<string, Promise<void>>;
};
const phaseTransitions =
  transitionState.phaseTransitions ?? new Map<string, Promise<void>>();
transitionState.phaseTransitions = phaseTransitions;

function runPhaseTransition(sessionId: string, auto: boolean): Promise<void> {
  const existing = phaseTransitions.get(sessionId);
  if (existing) return existing;
  const pending = transition(sessionId, auto).finally(() => {
    if (phaseTransitions.get(sessionId) === pending) phaseTransitions.delete(sessionId);
  });
  phaseTransitions.set(sessionId, pending);
  return pending;
}

// Persistent server timers (Docker deployment).
function scheduleAdvance(sessionId: string, ms: number): void {
  scheduleTimer(sessionId, ms, () => {
    void runPhaseTransition(sessionId, true).catch((e) => {
      console.error("advance:", e);
      // Lock busy / transient failure — retry so the phase machine never stalls.
      scheduleAdvance(sessionId, 2_000);
    });
  });
}

async function scheduleIntroAdvance(sessionId: string): Promise<void> {
  const phaseEndsAt = new Date(Date.now() + INTRO_DURATION_SEC * 1000);
  const narration = phaseNarration({
    status: "INTRO",
    phase: null,
    currentRound: 0,
    autoHost: true,
  });
  const updated = await db.gameSession.update({
    where: { id: sessionId },
    data: {
      phaseEndsAt,
      ...(narration != null ? { aiNarration: narration } : {}),
      stateVersion: { increment: 1 },
    },
    select: { stateVersion: true },
  });
  scheduleAdvance(sessionId, INTRO_DURATION_SEC * 1000);
  await publishState(sessionId, updated.stateVersion, "round:phase_changed", {
    phase: null,
    phaseEndsAt: phaseEndsAt.toISOString(),
    paused: false,
  });
}

/** Force next phase (timer skip / all-ready fast-forward). */
export async function requestPhaseTransition(sessionId: string): Promise<void> {
  clearTimer(sessionId);
  await runPhaseTransition(sessionId, false);
}

/**
 * All connected humans are ready — shorten the phase timer to a quick
 * countdown (default 5s) and reschedule advance. Does not advance immediately.
 */
export async function startAllReadyCountdown(sessionId: string): Promise<void> {
  await withSessionLock(sessionId, async () => {
    const session = await db.gameSession.findUnique({ where: { id: sessionId } });
    if (!session || session.paused) return;

    const readyEndsAt = new Date(Date.now() + ALL_READY_COUNTDOWN_SEC * 1000);
    // Already ending sooner than the ready countdown — keep the shorter timer.
    if (
      session.phaseEndsAt &&
      session.phaseEndsAt.getTime() <= readyEndsAt.getTime()
    ) {
      scheduleAdvance(
        sessionId,
        Math.max(0, session.phaseEndsAt.getTime() - Date.now()),
      );
      return;
    }

    await db.gameSession.update({
      where: { id: sessionId },
      data: { phaseEndsAt: readyEndsAt },
    });
    scheduleAdvance(sessionId, ALL_READY_COUNTDOWN_SEC * 1000);
    await touch(sessionId, "round:phase_changed", {
      phase: session.phase,
      phaseEndsAt: readyEndsAt.toISOString(),
      paused: session.paused,
      phaseExtensions: session.phaseExtensions,
      allReadyCountdown: true,
    });
  });
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

/** Lazy advance for serverless / missed timers: call when reading state. */
export async function maybeAutoAdvance(sessionId: string): Promise<void> {
  const s = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!s || s.paused || !s.phaseEndsAt) return;
  if (Date.now() < s.phaseEndsAt.getTime()) {
    // Timer still pending — ensure an in-process timer exists (e.g. after restart).
    const ms = s.phaseEndsAt.getTime() - Date.now();
    scheduleAdvance(sessionId, ms);
    return;
  }

  if (s.status === "INTRO" && s.autoHost) {
    await runPhaseTransition(sessionId, true);
    return;
  }
  if (s.status === "DEBRIEF" && s.autoHost) {
    await runPhaseTransition(sessionId, true);
    return;
  }
  if (!s.phase) return;
  const timed = TIMED_PHASES.includes(s.phase) || (s.phase === "RECAP" && s.autoHost);
  if (timed) await runPhaseTransition(sessionId, true);
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
  await runPhaseTransition(sessionId, false);
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

/** Toggle automatic role assignment for new participants (lobby only). */
export async function hostSetAutoAssignRoles(
  hostUserId: string,
  sessionId: string,
  autoAssignRoles: boolean,
): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.status !== "LOBBY") throw new ApiError("INVALID_STATE", 409);
  await db.gameSession.update({ where: { id: sessionId }, data: { autoAssignRoles } });
  await touch(sessionId, "session:auto_assign_roles", { autoAssignRoles });
}

/** Toggle in-session explanation guidance (lobby only). */
export async function hostSetGuidanceEnabled(
  hostUserId: string,
  sessionId: string,
  guidanceEnabled: boolean,
): Promise<void> {
  const s = await assertHost(hostUserId, sessionId);
  if (s.status !== "LOBBY") throw new ApiError("INVALID_STATE", 409);
  await db.gameSession.update({ where: { id: sessionId }, data: { guidanceEnabled } });
  await touch(sessionId, "session:guidance_enabled", { guidanceEnabled });
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
