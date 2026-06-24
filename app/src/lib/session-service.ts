import type { Role, ControlMode, Presence, BadgeType } from "@/generated/prisma/enums";
import type { Presence as PresenceEnum } from "@/generated/prisma/enums";
import { db } from "./db";
import { ApiError, generateRoomCode } from "./api";
import { MAX_PLAYERS, SCENARIO_VERSION, ROOM_CODE_EXPIRY_HOURS } from "./scenario";
import { maybeAutoAdvance } from "./game-service";
import { ensureHostParticipant } from "./lobby-seat";
import { publish } from "./events";
import type { ParticipantOutcome } from "./finalize";
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
      data: {
        code,
        hostUserId,
        status: "LOBBY",
        scenarioVersion: SCENARIO_VERSION,
        autoHost: true,
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
  currentRound: number;
  stateVersion: number;
  maxPlayers: number;
  autoHost: boolean;
  aiNarration: string | null;
  isHost: boolean;
  participants: ParticipantView[];
  self: SelfState | null;
  market: MarketView | null;
  analytics: RoundAnalytics[];
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
    autoHost: session.autoHost,
    aiNarration: session.aiNarration,
    isHost,
    self,
    market,
    analytics,
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
}
