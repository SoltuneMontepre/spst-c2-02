// The game loop (phase timers + bots) now runs in the standalone backend
// (server/), which is the single authoritative writer. The Next app is
// frontend + auth only and must NOT reschedule timers, or two processes would
// advance sessions and double-write. Intentionally a no-op.
export async function register(): Promise<void> {
  // no-op — see server/src/index.ts startGameLoop()
}
