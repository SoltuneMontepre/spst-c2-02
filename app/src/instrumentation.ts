export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { rescheduleActiveTimers } = await import("./lib/timer-service");
  const { maybeAutoAdvance } = await import("./lib/game-service");
  await rescheduleActiveTimers((sessionId) => maybeAutoAdvance(sessionId));
}
