import { env } from "./env";
import { buildHttp } from "./http";
import { buildSocket } from "./socket";

/** Re-arm phase timers for in-flight sessions (ported from app instrumentation.ts).
 *  This backend is now the single authoritative owner of the game loop. */
async function startGameLoop(): Promise<void> {
  const { rescheduleActiveTimers } = await import("@/lib/timer-service");
  const { maybeAutoAdvance } = await import("@/lib/game-service");
  await rescheduleActiveTimers((sessionId) => maybeAutoAdvance(sessionId));
}

async function main(): Promise<void> {
  const app = await buildHttp();
  const io = buildSocket(app);

  await app.listen({ port: env.port, host: env.host });
  app.log.info(`Game backend listening on http://${env.host}:${env.port}`);

  await startGameLoop().catch((e) =>
    app.log.error(`game loop bootstrap failed: ${(e as Error).message}`),
  );
  app.log.info("Game loop armed (phase timers rescheduled)");

  const shutdown = async () => {
    app.log.info("Shutting down…");
    await io.close();
    await app.close();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Fatal: server failed to start", err);
  process.exit(1);
});
