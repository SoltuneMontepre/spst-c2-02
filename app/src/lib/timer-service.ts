// In-process phase timers for persistent server deployment.

const timers = new Map<string, NodeJS.Timeout>();

export function scheduleTimer(sessionId: string, ms: number, fn: () => void): void {
  const existing = timers.get(sessionId);
  if (existing) clearTimeout(existing);
  timers.set(
    sessionId,
    setTimeout(() => {
      timers.delete(sessionId);
      fn();
    }, Math.max(0, ms)),
  );
}

export function clearTimer(sessionId: string): void {
  const t = timers.get(sessionId);
  if (t) clearTimeout(t);
  timers.delete(sessionId);
}

/** Re-schedule timers after server restart (instrumentation hook). */
export async function rescheduleActiveTimers(
  advance: (sessionId: string) => Promise<void>,
): Promise<void> {
  const { db } = await import("./db");
  const sessions = await db.gameSession.findMany({
    where: {
      status: {
        in: ["INTRO", "ROUND_1", "ROUND_2", "ROUND_3", "ROUND_4", "DEBRIEF"],
      },
      paused: false,
      phaseEndsAt: { not: null },
    },
    select: { id: true, phaseEndsAt: true },
  });
  for (const s of sessions) {
    if (!s.phaseEndsAt) continue;
    const ms = s.phaseEndsAt.getTime() - Date.now();
    scheduleTimer(s.id, ms, () => {
      void advance(s.id).catch((e) => console.error("timer advance:", e));
    });
  }
}
