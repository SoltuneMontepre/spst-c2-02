// AI game director (TFT-style): auto-start, phase fast-forward, phase narration.

import { db } from "./db";
import { publish } from "./events";
import { ApiError } from "./api";
import { generateText, NoGeminiKeysError } from "./ai";
import { START_MIN_HUMANS, ROUND_EVENTS, PHASE_DURATIONS_SEC, INTRO_DURATION_SEC, DEBRIEF_DURATION_SEC } from "./scenario";
import { ROUND_NAMES, PHASE_BANNERS } from "./labels";
import { startSession, requestPhaseTransition } from "./game-service";

/** Minimum ms into a phase before all-ready fast-forward (anti-flash). */
const MIN_PHASE_MS: Record<string, number> = {
  EVENT: 12_000,
  DECISION: 30_000,
  MARKET_OPEN: 15_000,
  RECAP: 8_000,
  INTRO: 20_000,
};

function minHumansToStart(autoHost: boolean): number {
  return autoHost ? 1 : START_MIN_HUMANS;
}

/** Lobby: auto-start when every human is ready (AI host, no manual Start). */
export async function maybeAutoStartLobby(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!session?.autoHost || session.status !== "LOBBY") return;

  const humans = session.participants.filter((p) => !p.isBot);
  if (humans.length < minHumansToStart(true)) return;
  if (!humans.every((p) => p.ready)) return;

  const manualMode =
    session.participants.some((p) => p.isBot) ||
    session.participants.some((p) => p.role !== null);
  if (manualMode) {
    if (!humans.every((p) => p.role)) return;
    if (session.participants.some((p) => p.isBot && !p.role)) return;
  }

  try {
    await startSession(session.hostUserId, sessionId);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "UNDER_MIN_PLAYERS" && code !== "NOT_ALL_READY") {
      console.error("ai-host auto-start:", err);
    }
  }
}

/** In-game: skip remaining timer when all humans tap phase-ready (TFT-style). */
export async function maybeFastForwardPhase(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { where: { isBot: false } } },
  });
  if (!session?.autoHost || session.paused) return;

  const humans = session.participants;
  if (humans.length === 0) return;
  if (!humans.every((p) => p.phaseReady)) return;

  const phaseKey =
    session.status === "INTRO"
      ? "INTRO"
      : session.status === "DEBRIEF"
        ? null
        : session.phase;
  if (!phaseKey) return;

  const minMs = MIN_PHASE_MS[phaseKey] ?? 3000;
  if (session.phaseEndsAt) {
    const totalMs = phaseDurationMs(session);
    const elapsed = Date.now() - (session.phaseEndsAt.getTime() - totalMs);
    if (elapsed < minMs) return;
  }

  await requestPhaseTransition(sessionId);
}

function phaseDurationMs(session: {
  status: string;
  phase: string | null;
  autoHost: boolean;
}): number {
  if (session.status === "INTRO") return INTRO_DURATION_SEC * 1000;
  if (session.status === "DEBRIEF") return DEBRIEF_DURATION_SEC * 1000;
  if (session.phase && session.phase in PHASE_DURATIONS_SEC) {
    const sec = PHASE_DURATIONS_SEC[session.phase as keyof typeof PHASE_DURATIONS_SEC];
    if (session.phase === "RECAP" && session.autoHost) return 30_000;
    if (session.phase === "SETTLEMENT") return 4_000;
    return sec * 1000;
  }
  return 45_000;
}

/** Reset phase-ready flags when entering a new phase. */
export async function resetPhaseReady(sessionId: string): Promise<void> {
  await db.participant.updateMany({
    where: { sessionId, isBot: false },
    data: { phaseReady: false },
  });
}

/** Toggle human phase-ready during active phases. */
export async function setPhaseReady(
  userId: string,
  sessionId: string,
  ready: boolean,
): Promise<void> {
  const session = await db.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError("ROOM_NOT_FOUND", 404);
  if (
    !["INTRO", "ROUND_1", "ROUND_2", "ROUND_3", "ROUND_4", "DEBRIEF"].includes(
      session.status,
    )
  ) {
    throw new ApiError("INVALID_STATE", 409);
  }

  const updated = await db.participant.updateMany({
    where: { sessionId, userId, isBot: false },
    data: { phaseReady: ready },
  });
  if (updated.count === 0) throw new ApiError("FORBIDDEN", 403);

  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({
    sessionId,
    type: "participant:phase_ready",
    stateVersion: s.stateVersion,
    data: { userId, ready },
  });

  await maybeFastForwardPhase(sessionId);
}

/** Generate TFT-style announcer line for the current moment (best-effort). */
export async function announcePhase(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    select: {
      status: true,
      phase: true,
      currentRound: true,
      autoHost: true,
    },
  });
  if (!session?.autoHost) return;

  const round = session.currentRound;
  const phase = session.phase;
  const eventType = round > 0 ? ROUND_EVENTS[round] : null;

  let fallback = "Chào mừng đến Phiên chợ giá trị.";
  if (session.status === "INTRO") {
    fallback =
      "Điều phối viên AI chào mừng các bạn. Bốn vòng chợ thanh long sắp bắt đầu — hãy nhớ phân biệt giá trị và giá cả.";
  } else if (phase === "EVENT" && round) {
    fallback = `${ROUND_NAMES[round]}: ${EVENT_FALLBACK[round] ?? "Biến cố mới của vòng."}`;
  } else if (phase && PHASE_BANNERS[phase]) {
    fallback = `${PHASE_BANNERS[phase]}. ${round ? `Vòng ${round}.` : ""} Hãy ra quyết định trước khi hết giờ.`;
  } else if (session.status === "DEBRIEF") {
    fallback = "Phiên sắp kết thúc. Hãy xem lại dữ liệu thị trường và so sánh với lý thuyết.";
  }

  let narration = fallback;
  try {
    narration = await generateText({
      systemInstruction:
        "Bạn là điều phối viên AI của trò chơi giáo dục 'Phiên chợ giá trị' (kinh tế Mác-Lênin). " +
        "Viết đúng 1-2 câu tiếng Việt, giọng như MC TFT: ngắn, kịch tính nhẹ, không spoil chiến thuật. " +
        "Không đánh đồng giá trị với giá cả. Không dùng emoji.",
      prompt:
        `Trạng thái phiên: status=${session.status}, vòng=${round}, phase=${phase ?? "none"}, ` +
        `sự kiện=${eventType ?? "none"}. Viết lời dẫn cho người chơi.`,
    });
  } catch (e) {
    if (!(e instanceof NoGeminiKeysError)) console.error("ai-host narration:", e);
  }

  await db.gameSession.update({
    where: { id: sessionId },
    data: { aiNarration: narration },
  });

  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({
    sessionId,
    type: "host:narration",
    stateVersion: s.stateVersion,
    data: { narration },
  });
}

const EVENT_FALLBACK: Record<number, string> = {
  1: "Thị trường cơ sở — giá trị 10 nghìn Đồng là mốc so sánh.",
  2: "Được mùa — cung tăng, giá có thể chịu áp lực giảm.",
  3: "Thanh long viral — cầu tăng, chợ có thể nóng lên.",
  4: "Công nghệ phổ biến — giá trị xã hội giảm còn 6 nghìn Đồng.",
};
