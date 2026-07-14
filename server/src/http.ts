import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { env } from "./env";
import { registerErrorHandler } from "./handle";
import { registerSessionRoutes } from "./routes/sessions";
import { registerMeRoutes } from "./routes/me";
import { db } from "@/lib/db";

/** Build the Fastify HTTP app (REST). Socket.IO attaches to the same server. */
export async function buildHttp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: env.isProd ? "info" : "debug" },
    trustProxy: true,
  });

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
  });
  await app.register(cookie);

  // The client always sends Content-Type: application/json even for bodyless POSTs
  // (see apiFetch). Treat an empty body as {} instead of erroring.
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => {
      if (!body || (body as string).length === 0) return done(null, {});
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  registerErrorHandler(app);

  await registerSessionRoutes(app);
  await registerMeRoutes(app);

  // Liveness must not queue behind the database pool: marking the only backend
  // pod unready during DB pressure removes every service endpoint and amplifies
  // a transient slowdown into a full outage.
  app.get("/api/health", async () => ({ ok: true }));

  // DB-aware readiness endpoint for deployments with more than one replica.
  app.get("/api/ready", async (_req, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });

  return app;
}
