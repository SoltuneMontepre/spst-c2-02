// AI game director (TFT-style): auto-start, phase fast-forward, static phase lines.

import { db } from "./db";
import { publish } from "./events";
import { ApiError } from "./api";
import { canAutoStartLobby, startSession, startAllReadyCountdown } from "./game-service";
import { isDisconnectedForReady } from "./participant-presence";
import { withSessionLock } from "./session-lock";

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

/** In-game: when every connected human is ready on RECAP, start a short
 *  countdown. DECISION / MARKET_OPEN always run their full timers — playtest
 *  showed a single "Tôi đã xong" click ending the market in 5s. */
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
  // Only recap supports ready-to-advance. Market/decision need the full clock.
  if (phaseKey !== "RECAP") {
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
  await withSessionLock(sessionId, async () => {
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

    // Lock GameSession first (parent), then participant — avoids FK lock-upgrade
    // deadlocks with phase transitions that touch both tables.
    const s = await db.$transaction(async (tx) => {
      const updated = await tx.gameSession.update({
        where: { id: sessionId },
        data: { stateVersion: { increment: 1 } },
        select: { stateVersion: true },
      });
      await tx.participant.update({
        where: { id: participant.id },
        data: { phaseReady: ready },
      });
      return updated;
    });

    await publish({
      sessionId,
      type: "participant:phase_ready",
      stateVersion: s.stateVersion,
      data: { participantId: participant.id, userId, phaseReady: ready },
    });
  });

  await maybeFastForwardPhase(sessionId);
}
