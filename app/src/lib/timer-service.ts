// In-process phase timers for persistent server deployment.

const timers = new Map<string, NodeJS.Timeout>();

function timerKey(sessionId: string, name: string): string {
  return `${sessionId}:${name}`;
}

export function scheduleNamedTimer(
  sessionId: string,
  name: string,
  ms: number,
  fn: () => void,
): void {
  const key = timerKey(sessionId, name);
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      fn();
    }, Math.max(0, ms)),
  );
}

export function clearNamedTimer(sessionId: string, name: string): void {
  const key = timerKey(sessionId, name);
  const t = timers.get(key);
  if (t) clearTimeout(t);
  timers.delete(key);
}

export function scheduleTimer(sessionId: string, ms: number, fn: () => void): void {
  scheduleNamedTimer(sessionId, "phase", ms, fn);
}

export function clearTimer(sessionId: string): void {
  clearNamedTimer(sessionId, "phase");
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
