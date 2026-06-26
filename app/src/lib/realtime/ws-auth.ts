import type { IncomingMessage } from "node:http";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import type { AuthedUser } from "@/lib/api";

function cookieHeader(req: IncomingMessage | Request): string | undefined {
  if (req instanceof Request) {
    return req.headers.get("cookie") ?? undefined;
  }
  return req.headers.cookie;
}

async function resolveUserFromCookieHeader(
  cookie: string | undefined,
): Promise<AuthedUser | null> {
  const token = await getToken({
    req: { headers: { cookie } } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  if (!token) return null;

  const userId =
    (typeof token.uid === "string" ? token.uid : null) ??
    (typeof token.sub === "string" ? token.sub : null);
  if (!userId) return null;

  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true },
  });
  return user ? { id: user.id, email: user.email } : null;
}

/** Resolve authenticated user from a WebSocket HTTP upgrade request. */
export async function resolveUserFromUpgrade(
  req: IncomingMessage,
): Promise<AuthedUser | null> {
  return resolveUserFromCookieHeader(cookieHeader(req));
}

/** Resolve authenticated user from a Bun `Request` (upgrade or fetch). */
export async function resolveUserFromRequest(
  req: Request,
): Promise<AuthedUser | null> {
  return resolveUserFromCookieHeader(cookieHeader(req));
}
