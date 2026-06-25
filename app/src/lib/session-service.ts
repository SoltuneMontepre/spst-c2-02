import type { Role, ControlMode, Presence, BadgeType } from "@/generated/prisma/enums";
import type { Presence as PresenceEnum } from "@/generated/prisma/enums";
import { db } from "./db";
import { ApiError, generateRoomCode } from "./api";
import { MAX_PLAYERS, SCENARIO_VERSION, ROOM_CODE_EXPIRY_HOURS, MAX_ACTIVE_HOST_ROOMS } from "./scenario";
import { maybeAutoAdvance } from "./game-service";
import { ensureHostParticipant } from "./lobby-seat";
import { sweepAbandonedSoloLobbies, syncLobbySoloSince } from "./lobby-maintenance";
import { publish } from "./events";
import type { ConsumerRoundState } from "./role-state";
import type { ParticipantOutcome } from "./finalize";
import { computeMarketPrice, unitValueVnd } from "./economy";
import type { CreateSessionInput } from "./create-session-schema";
export type { AiDebriefParticipantReview, AiDebriefReview } from "./debrief-review";
import {
  ensureAiDebriefReview,
} from "./debrief-ai";
import type { AiDebriefParticipantReview, AiDebriefReview } from "./debrief-review";

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

export const ACTIVE_STATUSES = [
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

/** The host's most recent open room (for legacy single-room UI). */
export async function getActiveHostedSession(
  hostUserId: string,
): Promise<ActiveHostedSession | null> {
  const sessions = await getActiveHostedSessions(hostUserId);
  return sessions[0] ?? null;
}

/** All active rooms this user hosts (up to MAX_ACTIVE_HOST_ROOMS). */
export async function getActiveHostedSessions(
  hostUserId: string,
): Promise<ActiveHostedSession[]> {
  return db.gameSession.findMany({
    where: { hostUserId, status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { createdAt: "desc" },
    take: MAX_ACTIVE_HOST_ROOMS,
    select: { id: true, code: true, status: true },
  });
}

/** Host creates a room (FR-ROOM-01). Up to MAX_ACTIVE_HOST_ROOMS concurrent hosted sessions. */
export async function createSession(
  hostUserId: string,
  config: CreateSessionInput,
): Promise<CreatedSession> {
  await sweepAbandonedSoloLobbies();

  const activeCount = await db.gameSession.count({
    where: { hostUserId, status: { in: [...ACTIVE_STATUSES] } },
  });
  if (activeCount >= MAX_ACTIVE_HOST_ROOMS) {
    throw new ApiError("HOST_SESSION_LIMIT", 409);
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    const clash = await db.gameSession.findFirst({
      where: { code, status: { in: [...ACTIVE_STATUSES] } },
      select: { id: true },
    });
    if (clash) continue;
    const created = await db.gameSession.create({
      data: {
        code,
        hostUserId,
        status: "LOBBY",
        scenarioVersion: SCENARIO_VERSION,
        maxPlayers: config.maxPlayers,
        totalRounds: config.totalRounds,
        autoAssignRoles: config.autoAssignRoles,
        guidanceEnabled: config.guidanceEnabled,
        autoHost: config.autoHost ?? true,
        lobbySoloSince: new Date(),
      },
      select: { id: true, code: true },
    });
    await ensureHostParticipant(created.id, hostUserId);
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
  await sweepAbandonedSoloLobbies();

  const session = await db.gameSession.findFirst({
    where: { code },
    orderBy: { createdAt: "desc" },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);

  const expiredAt = new Date(
    (session.endedAt ?? session.createdAt).getTime() +
      ROOM_CODE_EXPIRY_HOURS * 60 * 60 * 1000,
  );
  if (
    Date.now() > expiredAt.getTime() &&
    ["COMPLETED", "INCOMPLETE", "CANCELLED"].includes(session.status)
  ) {
    throw new ApiError("ROOM_EXPIRED", 410);
  }
  if (
    session.status === "LOBBY" &&
    Date.now() - session.createdAt.getTime() > ROOM_CODE_EXPIRY_HOURS * 60 * 60 * 1000
  ) {
    throw new ApiError("ROOM_EXPIRED", 410);
  }

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
  if (humanCount >= session.maxPlayers) throw new ApiError("SESSION_FULL", 409);

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
  await syncLobbySoloSince(session.id);

  return { sessionId: session.id, participantId: participant.id, code: session.code };
}

export interface ParticipantView {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role | null;
  productivityProfile: string | null;
  isBot: boolean;
  presence: Presence;
  ready: boolean;
  phaseReady: boolean;
  controlMode: ControlMode;
  isSelf: boolean;
}

export interface InventoryView {
  id: string;
  availableQuantity: number;
  unitCostVnd: number;
  status: string;
}

export interface ListingView {
  id: string;
  sellerName: string;
  sellerType: string;
  askPriceVnd: number;
  availableQuantity: number;
  isOwn: boolean;
}

export interface OfferView {
  id: string;
  listingId: string | null;
  fromName: string;
  toName: string;
  quantity: number;
  offerPriceVnd: number;
  status: string;
  isIncoming: boolean;
}

export interface WholesaleView {
  id: string;
  producerName: string;
  quantity: number;
  minimumPriceVnd: number;
  counterPriceVnd: number | null;
  status: string;
  isOwn: boolean;
}

export interface SelfState {
  participantId: string;
  role: Role | null;
  isBot: boolean;
  balanceVnd: number | null;
  roleState: unknown;
  inventory: InventoryView[];
  listings: ListingView[];
  incomingOffers: OfferView[];
  outgoingOffers: OfferView[];
}

export interface MarketView {
  listings: ListingView[];
  wholesaleOffers: WholesaleView[];
}

export interface TransactionView {
  id: string;
  completedAt: string;
  counterpartyName: string;
  channel: string;
  quantity: number;
  unitPriceVnd: number;
  totalPriceVnd: number;
  direction: "buy" | "sell";
}

export interface LiveRoundStats {
  unitValueVnd: number;
  marketPriceVnd: number | null;
  supplyQuantity: number;
  demandQuantity: number;
  expectedInventory: number;
}

export interface RoundAnalytics {
  number: number;
  unitValueVnd: number;
  marketPriceVnd: number | null;
  supplyQuantity: number;
  demandQuantity: number;
  retailSoldQuantity: number;
  spoiledQuantity: number;
}

export interface SessionSnapshot {
  id: string;
  code: string;
  status: string;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
  /** Extensions used in the current phase (max 2). */
  phaseExtensions: number;
  currentRound: number;
  stateVersion: number;
  maxPlayers: number;
  totalRounds: number;
  autoAssignRoles: boolean;
  guidanceEnabled: boolean;
  autoHost: boolean;
  aiNarration: string | null;
  isHost: boolean;
  /** When only the host remains in LOBBY — ISO timestamp solo countdown started. */
  lobbySoloSince: string | null;
  /** Host already used the one-time +1 minute extension for this solo wait. */
  lobbySoloExtendUsed: boolean;
  participants: ParticipantView[];
  self: SelfState | null;
  market: MarketView | null;
  analytics: RoundAnalytics[];
  recentTransactions: TransactionView[];
  liveRoundStats: LiveRoundStats | null;
}

export interface BadgeView {
  participantId: string;
  displayName: string;
  type: string;
}

export interface SessionResultView {
  status: string;
  narration: string | null;
  outcomes: ParticipantOutcome[];
  badges: BadgeView[];
  analytics: RoundAnalytics[];
  selfOutcome: ParticipantOutcome | null;
  selfBadges: BadgeView[];
  /** AI pedagogical grades + comments (overall + per participant), one generation pass. */
  aiDebrief: AiDebriefReview | null;
  selfAiReview: AiDebriefParticipantReview | null;
}

/** Role-filtered snapshot (FR-MARKET-07, TECH-PRIVACY). */
export async function getSnapshot(
  userId: string,
  sessionId: string,
): Promise<SessionSnapshot> {
  await sweepAbandonedSoloLobbies();
  // Serverless-safe: advance the phase machine if a timer elapsed.
  await maybeAutoAdvance(sessionId);
  void import("./ai-host").then((m) => m.maybeFastForwardPhase(sessionId));

  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);

  const isHost = session.hostUserId === userId;
  let participants = session.participants;
  if (isHost && session.status === "LOBBY") {
    const created = await ensureHostParticipant(session.id, userId);
    if (created) {
      participants = await db.participant.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
      });
    }
  }

  const selfParticipant = participants.find((p) => p.userId === userId);
  if (!isHost && !selfParticipant) throw new ApiError("FORBIDDEN", 403);

  const nameById = new Map(
    participants.map((p) => [p.id, p.displayNameSnapshot]),
  );
  const self = await buildSelfState(
    selfParticipant?.id,
    session.currentRound,
    nameById,
  );
  const market = await buildMarket(
    session.id,
    session.currentRound,
    session.phase,
    selfParticipant?.id,
    nameById,
  );
  const analytics = await buildAnalytics(session.id);
  const recentTransactions = selfParticipant
    ? await buildRecentTransactions(
        selfParticipant.id,
        session.id,
        session.currentRound,
        nameById,
      )
    : [];
  const liveRoundStats = await buildLiveRoundStats(
    session.id,
    session.currentRound,
    session.phase,
  );

  return {
    id: session.id,
    code: session.code,
    status: session.status,
    phase: session.phase,
    phaseEndsAt: session.phaseEndsAt?.toISOString() ?? null,
    paused: session.paused,
    phaseExtensions: session.phaseExtensions,
    currentRound: session.currentRound,
    stateVersion: session.stateVersion,
    maxPlayers: session.maxPlayers,
    totalRounds: session.totalRounds,
    autoAssignRoles: session.autoAssignRoles,
    guidanceEnabled: session.guidanceEnabled,
    autoHost: session.autoHost,
    aiNarration: session.aiNarration,
    isHost,
    lobbySoloSince: session.lobbySoloSince?.toISOString() ?? null,
    lobbySoloExtendUsed: session.lobbySoloExtendUsed,
    self,
    market,
    analytics,
    recentTransactions,
    liveRoundStats,
    participants: participants.map((p) => ({
      id: p.id,
      displayName: p.displayNameSnapshot,
      avatarUrl: p.avatarSnapshot,
      role: p.role,
      productivityProfile: p.productivityProfile,
      isBot: p.isBot,
      presence: p.presence,
      ready: p.ready,
      phaseReady: p.phaseReady,
      controlMode: p.controlMode,
      isSelf: p.userId === userId,
    })),
  };
}

async function buildSelfState(
  participantId: string | undefined,
  currentRound: number,
  nameById: Map<string, string>,
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

  const lots = await db.inventoryLot.findMany({
    where: {
      ownerParticipantId: participantId,
      availableQuantity: { gt: 0 },
      status: { in: ["AVAILABLE", "CARRIED"] },
    },
  });
  const ownListings = currentRound
    ? await db.listing.findMany({
        where: {
          sellerParticipantId: participantId,
          round: { number: currentRound },
          status: { in: ["OPEN", "PARTIALLY_FILLED"] },
        },
      })
    : [];

  const offers =
    currentRound && participantId
      ? await db.offer.findMany({
          where: {
            status: { in: ["OPEN"] },
            OR: [{ fromParticipantId: participantId }, { toParticipantId: participantId }],
            listing: { round: { sessionId: participant.sessionId, number: currentRound } },
          },
          include: {
            listing: { select: { id: true } },
          },
        })
      : [];

  const mapOffer = (o: (typeof offers)[0]): OfferView => ({
    id: o.id,
    listingId: o.listingId,
    fromName: nameById.get(o.fromParticipantId) ?? "?",
    toName: nameById.get(o.toParticipantId) ?? "?",
    quantity: o.quantity,
    offerPriceVnd: o.offerPriceVnd,
    status: o.status,
    isIncoming: o.toParticipantId === participantId,
  });

  return {
    participantId: participant.id,
    role: participant.role,
    isBot: participant.isBot,
    balanceVnd: participant.wallet?.balanceVnd ?? null,
    roleState: participant.roleStates[0]?.state ?? null,
    inventory: lots.map((l) => ({
      id: l.id,
      availableQuantity: l.availableQuantity,
      unitCostVnd: l.unitCostVnd,
      status: l.status,
    })),
    listings: ownListings.map((l) => ({
      id: l.id,
      sellerName: nameById.get(l.sellerParticipantId) ?? "?",
      sellerType: l.sellerType,
      askPriceVnd: l.askPriceVnd,
      availableQuantity: l.availableQuantity,
      isOwn: true,
    })),
    incomingOffers: offers.filter((o) => o.toParticipantId === participantId).map(mapOffer),
    outgoingOffers: offers.filter((o) => o.fromParticipantId === participantId).map(mapOffer),
  };
}

async function buildMarket(
  sessionId: string,
  currentRound: number,
  phase: string | null,
  selfId: string | undefined,
  nameById: Map<string, string>,
): Promise<MarketView | null> {
  if (!currentRound || (phase !== "MARKET_OPEN" && phase !== "SETTLEMENT")) return null;
  const listings = await db.listing.findMany({
    where: {
      round: { sessionId, number: currentRound },
      status: { in: ["OPEN", "PARTIALLY_FILLED"] },
      availableQuantity: { gt: 0 },
    },
    orderBy: { askPriceVnd: "asc" },
  });
  const wholesaleOffers = await db.wholesaleOffer.findMany({
    where: {
      round: { sessionId, number: currentRound },
      status: { in: ["OPEN", "COUNTERED"] },
    },
    orderBy: { minimumPriceVnd: "asc" },
  });
  return {
    listings: listings.map((l) => ({
      id: l.id,
      sellerName: nameById.get(l.sellerParticipantId) ?? "?",
      sellerType: l.sellerType,
      askPriceVnd: l.askPriceVnd,
      availableQuantity: l.availableQuantity,
      isOwn: l.sellerParticipantId === selfId,
    })),
    wholesaleOffers: wholesaleOffers.map((w) => ({
      id: w.id,
      producerName: nameById.get(w.producerId) ?? "?",
      quantity: w.quantity,
      minimumPriceVnd: w.minimumPriceVnd,
      counterPriceVnd: w.counterPriceVnd,
      status: w.status,
      isOwn: w.producerId === selfId,
    })),
  };
}

const RETAIL_CHANNELS = ["RETAIL_DIRECT", "RETAIL_INTERMEDIARY", "SYSTEM_EXPORT"] as const;

async function buildRecentTransactions(
  participantId: string,
  sessionId: string,
  currentRound: number,
  nameById: Map<string, string>,
): Promise<TransactionView[]> {
  if (!currentRound) return [];
  const round = await db.round.findUnique({
    where: { sessionId_number: { sessionId, number: currentRound } },
    select: { id: true },
  });
  if (!round) return [];

  const txs = await db.transaction.findMany({
    where: {
      roundId: round.id,
      status: "COMPLETED",
      OR: [{ sellerId: participantId }, { buyerId: participantId }],
    },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  return txs.map((t) => {
    const isSell = t.sellerId === participantId;
    const counterpartyId = isSell ? t.buyerId : t.sellerId;
    return {
      id: t.id,
      completedAt: t.completedAt.toISOString(),
      counterpartyName: counterpartyId ? (nameById.get(counterpartyId) ?? "?") : "Hệ thống",
      channel: t.channel,
      quantity: t.quantity,
      unitPriceVnd: t.unitPriceVnd,
      totalPriceVnd: t.totalPriceVnd,
      direction: isSell ? "sell" : "buy",
    };
  });
}

async function buildLiveRoundStats(
  sessionId: string,
  currentRound: number,
  phase: string | null,
): Promise<LiveRoundStats | null> {
  if (!currentRound || !phase) return null;
  if (!["MARKET_OPEN", "SETTLEMENT", "RECAP"].includes(phase)) return null;

  const round = await db.round.findUnique({
    where: { sessionId_number: { sessionId, number: currentRound } },
    include: {
      listings: true,
      roleStates: true,
      transactions: { where: { status: "COMPLETED" } },
    },
  });
  if (!round) return null;

  const retail = round.transactions.filter((t) =>
    RETAIL_CHANNELS.includes(t.channel as (typeof RETAIL_CHANNELS)[number]),
  );
  const price = computeMarketPrice(
    retail.map((t) => ({ unitPriceVnd: t.unitPriceVnd, quantity: t.quantity })),
  );

  const supplyQuantity = round.listings.reduce((sum, l) => sum + l.quantity, 0);
  const demandQuantity = round.roleStates
    .filter((r) => r.role === "CONSUMER")
    .reduce(
      (sum, r) => sum + (r.state as unknown as ConsumerRoundState).needTarget,
      0,
    );

  return {
    unitValueVnd: unitValueVnd(currentRound),
    marketPriceVnd: price.marketPriceVnd,
    supplyQuantity,
    demandQuantity,
    expectedInventory: Math.max(0, supplyQuantity - demandQuantity),
  };
}

/** Mark a participant online/offline from the realtime connection (FR-ROOM-07). */
export async function setPresence(
  userId: string,
  sessionId: string,
  presence: PresenceEnum,
): Promise<void> {
  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
    select: { id: true },
  });
  if (!participant) return;

  await db.participant.update({
    where: { id: participant.id },
    data: { presence, lastSeenAt: new Date() },
  });
  const session = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({
    sessionId,
    type: "participant:presence",
    stateVersion: session.stateVersion,
    data: { participantId: participant.id, userId, presence },
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

  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
    select: { id: true },
  });
  if (!participant) throw new ApiError("FORBIDDEN", 403);

  await db.participant.update({
    where: { id: participant.id },
    data: { ready },
  });
  await bumpAndPublish(sessionId, "participant:ready", {
    participantId: participant.id,
    userId,
    ready,
  });
  void import("./ai-host").then((m) => m.maybeAutoStartLobby(sessionId));
}

/** Final per-round market snapshots for the observatory/recap (FR-ANALYTICS). */
async function buildAnalytics(sessionId: string): Promise<RoundAnalytics[]> {
  const snapshots = await db.marketSnapshot.findMany({
    where: { isFinal: true, round: { sessionId } },
    include: { round: { select: { number: true } } },
    orderBy: { round: { number: "asc" } },
  });
  return snapshots.map((s) => ({
    number: s.round.number,
    unitValueVnd: s.unitValueVnd,
    marketPriceVnd: s.marketPriceVnd,
    supplyQuantity: s.supplyQuantity,
    demandQuantity: s.demandQuantity,
    retailSoldQuantity: s.retailSoldQuantity,
    spoiledQuantity: s.spoiledQuantity,
  }));
}

const RESULT_STATUSES = ["DEBRIEF", "COMPLETED", "INCOMPLETE"] as const;

/** Final scores, badges, and narration (SRS §5.9). */
export async function getSessionResult(
  userId: string,
  sessionId: string,
): Promise<SessionResultView> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);

  const isHost = session.hostUserId === userId;
  const selfParticipant = session.participants.find((p) => p.userId === userId);
  if (!isHost && !selfParticipant) throw new ApiError("FORBIDDEN", 403);
  if (!RESULT_STATUSES.includes(session.status as (typeof RESULT_STATUSES)[number])) {
    throw new ApiError("RESULT_NOT_READY", 409);
  }

  const result = await db.sessionResult.findUnique({ where: { sessionId } });
  if (!result) throw new ApiError("RESULT_NOT_READY", 404);

  const dbBadges = await db.badge.findMany({
    where: { sessionId },
    include: { participant: { select: { displayNameSnapshot: true } } },
  });
  const nameById = new Map(
    session.participants.map((p) => [p.id, p.displayNameSnapshot]),
  );
  const badges: BadgeView[] = dbBadges.map((b) => ({
    participantId: b.participantId,
    displayName: b.participant.displayNameSnapshot,
    type: b.type,
  }));

  const outcomes = result.participantOutcomes as unknown as ParticipantOutcome[];
  const selfId = selfParticipant?.id;
  const analytics = await buildAnalytics(sessionId);
  const sessionCompleted = session.status === "COMPLETED";

  const aiDebrief = await ensureAiDebriefReview({
    sessionId,
    outcomes,
    badges: dbBadges.map((b) => ({
      participantId: b.participantId,
      type: b.type as BadgeType,
    })),
    analytics,
    sessionCompleted,
    existing: result.aiDebrief,
  }).catch((e) => {
    console.error("ensureAiDebriefReview:", e);
    return null;
  });

  return {
    status: session.status,
    narration: aiDebrief?.overall.comment ?? result.narration,
    outcomes,
    badges,
    analytics,
    selfOutcome: selfId ? outcomes.find((o) => o.participantId === selfId) ?? null : null,
    selfBadges: selfId ? badges.filter((b) => b.participantId === selfId) : [],
    aiDebrief,
    selfAiReview: selfId
      ? aiDebrief?.participants.find((p) => p.participantId === selfId) ?? null
      : null,
  };
}

/** Leave a room — only frees a seat while in LOBBY (§4.4). */
export async function leaveSession(userId: string, sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (session.status !== "LOBBY") throw new ApiError("SESSION_LOCKED", 409);

  await db.participant.deleteMany({ where: { sessionId, userId, isBot: false } });
  await bumpAndPublish(sessionId, "participant:left", { userId });
  await syncLobbySoloSince(sessionId);
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export interface HomeDashboardStats {
  sessionsPlayed: number;
  totalScore: number;
  roundsCompleted: number;
  topRole: Role | null;
}

export interface HomeRecentSession {
  sessionId: string;
  code: string;
  status: string;
  role: Role | null;
  hostDisplayName: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  joinedAt: string;
  participantCount: number;
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  isActive: boolean;
  isHost: boolean;
  isJoined: boolean;
  selfScore?: number;
}

export interface HomeDashboard {
  stats: HomeDashboardStats;
  recentSessions: HomeRecentSession[];
  publicOpenRooms: PublicOpenRoom[];
  activeHostedSessions: ActiveHostedSession[];
  activeHostedSession: ActiveHostedSession | null;
}

export interface PublicOpenRoom {
  sessionId: string;
  code: string;
  hostDisplayName: string;
  participantCount: number;
  maxPlayers: number;
  totalRounds: number;
  createdAt: string;
}

/** LOBBY rooms from other hosts, discoverable on the home hub. */
export async function listPublicOpenRooms(userId: string): Promise<PublicOpenRoom[]> {
  await sweepAbandonedSoloLobbies();

  const expiryCutoff = new Date(
    Date.now() - ROOM_CODE_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  const joinedLobbyIds = await db.participant.findMany({
    where: {
      userId,
      isBot: false,
      session: { status: "LOBBY" },
    },
    select: { sessionId: true },
  });
  const excludeIds = joinedLobbyIds.map((p) => p.sessionId);

  const sessions = await db.gameSession.findMany({
    where: {
      status: "LOBBY",
      hostUserId: { not: userId },
      createdAt: { gt: expiryCutoff },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    include: {
      host: { select: { displayName: true } },
      _count: { select: { participants: { where: { isBot: false } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return sessions
    .filter((s) => s._count.participants < s.maxPlayers)
    .map((s) => ({
      sessionId: s.id,
      code: s.code,
      hostDisplayName: s.host.displayName,
      participantCount: s._count.participants,
      maxPlayers: s.maxPlayers,
      totalRounds: s.totalRounds,
      createdAt: s.createdAt.toISOString(),
    }));
}

/** Aggregated home hub stats and enriched recent sessions for the dashboard. */
export async function getHomeDashboard(userId: string): Promise<HomeDashboard> {
  await sweepAbandonedSoloLobbies();

  const participants = await db.participant.findMany({
    where: { userId, isBot: false },
    include: {
      session: {
        include: {
          host: { select: { displayName: true } },
          _count: { select: { participants: { where: { isBot: false } } } },
          result: { select: { participantOutcomes: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const fourWeeksAgo = new Date(Date.now() - FOUR_WEEKS_MS);
  let sessionsPlayed = 0;
  let totalScore = 0;
  let roundsCompleted = 0;
  const roleCounts = new Map<Role, number>();
  const recentBySession = new Map<string, HomeRecentSession>();

  for (const p of participants) {
    const s = p.session;
    const isActive = (ACTIVE_STATUSES as readonly string[]).includes(s.status);
    const isHost = s.hostUserId === userId;

    if (p.role) {
      roleCounts.set(p.role, (roleCounts.get(p.role) ?? 0) + 1);
    }

    const outcomes = s.result?.participantOutcomes as ParticipantOutcome[] | undefined;
    const selfOutcome = outcomes?.find((o) => o.participantId === p.id);

    if (
      (s.status === "COMPLETED" || s.status === "INCOMPLETE") &&
      s.endedAt &&
      s.endedAt >= fourWeeksAgo
    ) {
      sessionsPlayed++;
      roundsCompleted += s.currentRound;
      if (selfOutcome) totalScore += selfOutcome.scoreVnd;
    }

    const entry: HomeRecentSession = {
      sessionId: s.id,
      code: s.code,
      status: s.status,
      role: p.role,
      hostDisplayName: s.host.displayName,
      createdAt: s.createdAt.toISOString(),
      startedAt: s.startedAt?.toISOString() ?? null,
      endedAt: s.endedAt?.toISOString() ?? null,
      joinedAt: p.createdAt.toISOString(),
      participantCount: s._count.participants,
      maxPlayers: s.maxPlayers,
      currentRound: s.currentRound,
      totalRounds: s.totalRounds,
      isActive,
      isHost,
      isJoined: isActive && !isHost,
      selfScore: selfOutcome?.scoreVnd,
    };

    const existing = recentBySession.get(s.id);
    if (!existing || p.createdAt > new Date(existing.joinedAt)) {
      recentBySession.set(s.id, entry);
    }
  }

  let topRole: Role | null = null;
  let maxRoleCount = 0;
  for (const [role, count] of roleCounts) {
    if (count > maxRoleCount) {
      maxRoleCount = count;
      topRole = role;
    }
  }

  const hostedActive = await db.gameSession.findMany({
    where: { hostUserId: userId, status: { in: [...ACTIVE_STATUSES] } },
    include: {
      host: { select: { displayName: true } },
      _count: { select: { participants: { where: { isBot: false } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const s of hostedActive) {
    if (recentBySession.has(s.id)) continue;
    const hostParticipant = participants.find((p) => p.sessionId === s.id);
    recentBySession.set(s.id, {
      sessionId: s.id,
      code: s.code,
      status: s.status,
      role: hostParticipant?.role ?? null,
      hostDisplayName: s.host.displayName,
      createdAt: s.createdAt.toISOString(),
      startedAt: s.startedAt?.toISOString() ?? null,
      endedAt: s.endedAt?.toISOString() ?? null,
      joinedAt: s.createdAt.toISOString(),
      participantCount: s._count.participants,
      maxPlayers: s.maxPlayers,
      currentRound: s.currentRound,
      totalRounds: s.totalRounds,
      isActive: true,
      isHost: true,
      isJoined: false,
    });
  }

  const recentSessions = [...recentBySession.values()]
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      const aTime = new Date(a.endedAt ?? a.startedAt ?? a.joinedAt).getTime();
      const bTime = new Date(b.endedAt ?? b.startedAt ?? b.joinedAt).getTime();
      return bTime - aTime;
    });

  const activeSessions = recentSessions.filter((s) => s.isActive);
  const endedSessions = recentSessions.filter((s) => !s.isActive).slice(0, 10);

  const activeHostedSessions = await getActiveHostedSessions(userId);
  const activeHostedSession = activeHostedSessions[0] ?? null;

  const ownActiveSessionIds = new Set(
    recentSessions
      .filter((s) => s.isActive && (s.isHost || s.isJoined))
      .map((s) => s.sessionId),
  );
  const publicOpenRooms = (await listPublicOpenRooms(userId)).filter(
    (r) => !ownActiveSessionIds.has(r.sessionId),
  );

  return {
    stats: { sessionsPlayed, totalScore, roundsCompleted, topRole },
    recentSessions: [...activeSessions, ...endedSessions],
    publicOpenRooms,
    activeHostedSessions,
    activeHostedSession,
  };
}
