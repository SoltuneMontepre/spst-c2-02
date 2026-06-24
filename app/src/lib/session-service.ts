import type { Role, ControlMode, Presence } from "@/generated/prisma/enums";
import type { Presence as PresenceEnum } from "@/generated/prisma/enums";
import { db } from "./db";
import { ApiError, generateRoomCode } from "./api";
import { MAX_PLAYERS, SCENARIO_VERSION } from "./scenario";
import { maybeAutoAdvance } from "./game-service";
import { publish } from "./events";

/** Bump stateVersion and broadcast so all members refresh immediately. */
async function bumpAndPublish(
  sessionId: string,
  type: string,
  data?: unknown,
): Promise<void> {
  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({ sessionId, type, stateVersion: s.stateVersion, data });
}

const ACTIVE_STATUSES = [
  "CREATED",
  "LOBBY",
  "INTRO",
  "ROUND_1",
  "ROUND_2",
  "ROUND_3",
  "ROUND_4",
  "DEBRIEF",
] as const;

export interface CreatedSession {
  id: string;
  code: string;
}

export interface ActiveHostedSession {
  id: string;
  code: string;
  status: string;
}

/** The host's currently-open room, if any (for the Home "return to room" card). */
export async function getActiveHostedSession(
  hostUserId: string,
): Promise<ActiveHostedSession | null> {
  const s = await db.gameSession.findFirst({
    where: { hostUserId, status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true },
  });
  return s;
}

/** Host creates a room (FR-ROOM-01). One active hosted session per user. */
export async function createSession(hostUserId: string): Promise<CreatedSession> {
  const active = await db.gameSession.findFirst({
    where: { hostUserId, status: { in: [...ACTIVE_STATUSES] } },
    select: { id: true, code: true },
  });
  if (active) {
    throw new ApiError("ACTIVE_HOST_SESSION", 409, active.id);
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    const clash = await db.gameSession.findFirst({
      where: { code, status: { in: [...ACTIVE_STATUSES] } },
      select: { id: true },
    });
    if (clash) continue;
    const created = await db.gameSession.create({
      data: { code, hostUserId, status: "LOBBY", scenarioVersion: SCENARIO_VERSION },
      select: { id: true, code: true },
    });
    return created;
  }
  throw new ApiError("CODE_GENERATION_FAILED", 500);
}

export interface JoinResult {
  sessionId: string;
  participantId: string;
  code: string;
}

/** Player joins by code (FR-ROOM-02, §4.4). */
export async function joinSession(
  userId: string,
  code: string,
): Promise<JoinResult> {
  const session = await db.gameSession.findFirst({
    where: { code },
    orderBy: { createdAt: "desc" },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.hostUserId === userId) {
    throw new ApiError("HOST_CANNOT_JOIN", 409, "Host không chiếm ghế người chơi");
  }

  const existing = await db.participant.findUnique({
    where: { sessionId_userId: { sessionId: session.id, userId } },
  });
  if (existing) {
    return { sessionId: session.id, participantId: existing.id, code: session.code };
  }

  if (session.status !== "LOBBY") throw new ApiError("LATE_JOIN_FORBIDDEN", 409);

  const humanCount = await db.participant.count({
    where: { sessionId: session.id, isBot: false },
  });
  if (humanCount >= MAX_PLAYERS) throw new ApiError("SESSION_FULL", 409);

  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const participant = await db.participant.create({
    data: {
      sessionId: session.id,
      userId,
      displayNameSnapshot: user.displayName,
      avatarSnapshot: user.avatarUrl,
      presence: "ONLINE",
    },
  });
  await bumpAndPublish(session.id, "participant:joined", { userId });

  return { sessionId: session.id, participantId: participant.id, code: session.code };
}

export interface ParticipantView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role | null;
  isBot: boolean;
  presence: Presence;
  ready: boolean;
  controlMode: ControlMode;
  isSelf: boolean;
}

export interface SelfState {
  participantId: string;
  role: Role | null;
  isBot: boolean;
  balanceVnd: number | null;
  roleState: unknown;
}

export interface SessionSnapshot {
  id: string;
  code: string;
  status: string;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
  currentRound: number;
  stateVersion: number;
  maxPlayers: number;
  isHost: boolean;
  participants: ParticipantView[];
  self: SelfState | null;
}

/** Role-filtered snapshot (FR-MARKET-07, TECH-PRIVACY). */
export async function getSnapshot(
  userId: string,
  sessionId: string,
): Promise<SessionSnapshot> {
  // Serverless-safe: advance the phase machine if a timer elapsed.
  await maybeAutoAdvance(sessionId);

  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);

  const isHost = session.hostUserId === userId;
  const selfParticipant = session.participants.find((p) => p.userId === userId);
  if (!isHost && !selfParticipant) throw new ApiError("FORBIDDEN", 403);

  const self = await buildSelfState(selfParticipant?.id, session.currentRound);

  return {
    id: session.id,
    code: session.code,
    status: session.status,
    phase: session.phase,
    phaseEndsAt: session.phaseEndsAt?.toISOString() ?? null,
    paused: session.paused,
    currentRound: session.currentRound,
    stateVersion: session.stateVersion,
    maxPlayers: session.maxPlayers,
    isHost,
    self,
    participants: session.participants.map((p) => ({
      id: p.id,
      displayName: p.displayNameSnapshot,
      avatarUrl: p.avatarSnapshot,
      role: p.role,
      isBot: p.isBot,
      presence: p.presence,
      ready: p.ready,
      controlMode: p.controlMode,
      isSelf: p.userId === userId,
    })),
  };
}

async function buildSelfState(
  participantId: string | undefined,
  currentRound: number,
): Promise<SelfState | null> {
  if (!participantId) return null;
  const participant = await db.participant.findUnique({
    where: { id: participantId },
    include: {
      wallet: true,
      roleStates: { where: { round: { number: currentRound } }, take: 1 },
    },
  });
  if (!participant) return null;
  return {
    participantId: participant.id,
    role: participant.role,
    isBot: participant.isBot,
    balanceVnd: participant.wallet?.balanceVnd ?? null,
    roleState: participant.roleStates[0]?.state ?? null,
  };
}

/** Mark a participant online/offline from the realtime connection (FR-ROOM-07). */
export async function setPresence(
  userId: string,
  sessionId: string,
  presence: PresenceEnum,
): Promise<void> {
  const updated = await db.participant.updateMany({
    where: { sessionId, userId, isBot: false },
    data: { presence, lastSeenAt: new Date() },
  });
  if (updated.count === 0) return;
  const session = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({
    sessionId,
    type: "participant:presence",
    stateVersion: session.stateVersion,
    data: { userId, presence },
  });
}

/** The user's active non-hosted session, for "return to your session" (§4.4). */
export async function getActiveJoinedSession(
  userId: string,
): Promise<ActiveHostedSession | null> {
  const participant = await db.participant.findFirst({
    where: {
      userId,
      isBot: false,
      session: { status: { in: [...ACTIVE_STATUSES] }, hostUserId: { not: userId } },
    },
    orderBy: { createdAt: "desc" },
    select: { session: { select: { id: true, code: true, status: true } } },
  });
  return participant?.session ?? null;
}

/** Toggle ready in the lobby (FR-ROOM-03). */
export async function setReady(
  userId: string,
  sessionId: string,
  ready: boolean,
): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.status !== "LOBBY") throw new ApiError("SESSION_LOCKED", 409);

  const updated = await db.participant.updateMany({
    where: { sessionId, userId, isBot: false },
    data: { ready },
  });
  if (updated.count === 0) throw new ApiError("FORBIDDEN", 403);
  await bumpAndPublish(sessionId, "participant:ready", { userId, ready });
}

/** Leave a room — only frees a seat while in LOBBY (§4.4). */
export async function leaveSession(userId: string, sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.status !== "LOBBY") throw new ApiError("SESSION_LOCKED", 409);

  await db.participant.deleteMany({ where: { sessionId, userId, isBot: false } });
  await bumpAndPublish(sessionId, "participant:left", { userId });
}
