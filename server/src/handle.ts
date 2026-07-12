// Request helpers that mirror app/src/lib/api.ts handle(): map ZodError → 422,
// ApiError / known service-error strings → code+status, everything else → 500.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { ApiError, mapServiceError } from "@/lib/api";
import { errorMessage } from "@/lib/error-messages";
import { userFromToken, tokenFromCookies, type AuthedUser } from "./auth";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthedUser;
  }
}

/** Global error handler translating thrown domain errors into JSON responses. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(422).send({ error: "VALIDATION_ERROR", issues: err.issues });
    }
    const mapped = err instanceof ApiError ? err : mapServiceError(err);
    if (mapped) {
      const custom = mapped.message === mapped.code ? undefined : mapped.message;
      return reply
        .code(mapped.status)
        .send({ error: mapped.code, message: custom ?? errorMessage(mapped.code) });
    }
    req.log.error(err);
    return reply
      .code(500)
      .send({ error: "INTERNAL_ERROR", message: errorMessage("INTERNAL_ERROR") });
  });
}

function bearerToken(req: FastifyRequest): string | null {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7).trim() || null;
  return null;
}

/** Resolve the authenticated user from the Auth.js cookie or a Bearer JWT. */
export async function getUser(req: FastifyRequest): Promise<AuthedUser | null> {
  if (req.authUser) return req.authUser;
  const token = tokenFromCookies(req.cookies) ?? bearerToken(req);
  const user = await userFromToken(token);
  if (user) req.authUser = user;
  return user;
}

/** Like getUser() but throws 401 when unauthenticated — use inside route handlers. */
export async function requireUser(req: FastifyRequest): Promise<AuthedUser> {
  const user = await getUser(req);
  if (!user) throw new ApiError("UNAUTHORIZED", 401);
  return user;
}

/** Convenience for a handler that returns JSON; lets routes stay one-liners. */
export type Handler<T> = (req: FastifyRequest, reply: FastifyReply) => Promise<T>;
