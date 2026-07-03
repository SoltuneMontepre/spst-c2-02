// AI game director (TFT-style): auto-start, phase fast-forward, phase narration.

import { db } from "./db";
import { publish } from "./events";
import { ApiError } from "./api";
import { generateText, isGeminiQuotaError } from "./ai";
import { ROUND_EVENTS } from "./scenario";
import { ROUND_NAMES, PHASE_BANNERS } from "./labels";
import { canAutoStartLobby, startSession, startAllReadyCountdown } from "./game-service";
import { isDisconnectedForReady } from "./participant-presence";

/** Lobby: auto-start when every human is ready (AI host, no manual Start). */
export async function maybeAutoStartLobby(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!session?.autoHost || session.status !== "LOBBY") return;
  if (!canAutoStartLobby(session)) return;

  try {
    await startSession(session.hostUserId, sessionId);
  } catch (err) {
    const code = (err as { code?: string }).code;
    const expected = new Set([
      "UNDER_MIN_PLAYERS",
      "NOT_ALL_READY",
      "INVALID_STATE",
      "NOT_ALL_ROLES_ASSIGNED",
      "INVALID_COMPOSITION",
    ]);
    if (!expected.has(code ?? "")) {
      console.error("ai-host auto-start:", err);
    }
  }
}

/** In-game: when every connected human is ready, start a short 5s countdown
 *  (does not advance immediately — TFT-style "all ready" beat). */
export async function maybeFastForwardPhase(sessionId: string): Promise<void> {
  const session = await db.gameSession.findUnique({
    where: { id: sessionId },
    include: { participants: { where: { isBot: false } } },
  });
  if (!session?.autoHost || session.paused) return;

  const phaseKey =
    session.status === "INTRO"
      ? "INTRO"
      : session.status === "DEBRIEF"
        ? null
        : session.phase;
  // Only decision / market / recap support ready-to-advance.
  if (
    phaseKey !== "DECISION" &&
    phaseKey !== "MARKET_OPEN" &&
    phaseKey !== "RECAP"
  ) {
    return;
  }

  // Players disconnected for a while don't block the round from advancing.
  const humans = session.participants.filter(
    (p) => !isDisconnectedForReady(p.presence, p.lastSeenAt),
  );
  if (humans.length === 0) return;
  if (!humans.every((p) => p.phaseReady)) return;

  await startAllReadyCountdown(sessionId);
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

  const participant = await db.participant.findFirst({
    where: { sessionId, userId, isBot: false },
    select: { id: true },
  });
  if (!participant) throw new ApiError("FORBIDDEN", 403);

  await db.participant.update({
    where: { id: participant.id },
    data: { phaseReady: ready },
  });

  const s = await db.gameSession.update({
    where: { id: sessionId },
    data: { stateVersion: { increment: 1 } },
    select: { stateVersion: true },
  });
  await publish({
    sessionId,
    type: "participant:phase_ready",
    stateVersion: s.stateVersion,
    data: { participantId: participant.id, userId, phaseReady: ready },
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
    if (!isGeminiQuotaError(e)) console.error("ai-host narration:", e);
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
  4: "Công nghệ phổ biến — giá trị chuẩn giảm còn 6 nghìn Đồng.",
};
