// Auth for the standalone backend. The Next app still owns login (Auth.js v5,
// JWT strategy), so we verify the same session token here using the shared
// AUTH_SECRET. Works for both REST (cookie) and Socket.IO (cookie or handshake
// auth token). No next-auth/Next runtime is imported — only @auth/core/jwt.

import { decode } from "@auth/core/jwt";
import { db } from "@/lib/db";
import { env, AUTHJS_COOKIE_NAMES } from "./env";

export interface AuthedUser {
  id: string;
  email: string;
}

interface SessionJwt {
  // Set by the Next app's jwt() callback (see app/src/lib/auth.ts).
  uid?: string;
  sub?: string;
  email?: string;
}

/** Decode an Auth.js session token, trying each cookie-name salt. Returns the uid or null. */
async function decodeUid(token: string): Promise<string | null> {
  for (const salt of AUTHJS_COOKIE_NAMES) {
    try {
      const payload = (await decode({
        token,
        secret: env.authSecret,
        salt,
      })) as SessionJwt | null;
      const uid = payload?.uid ?? payload?.sub;
      if (uid) return uid;
    } catch {
      // Wrong salt / not this cookie — try the next one.
    }
  }
  return null;
}

/** Resolve the raw session token from parsed cookies (either Auth.js cookie name).
 *  Handles Auth.js chunked cookies (name.0, name.1, …) for tokens >4KB. */
export function tokenFromCookies(
  cookies: Record<string, string | undefined> | undefined,
): string | null {
  if (!cookies) return null;
  for (const name of AUTHJS_COOKIE_NAMES) {
    const single = cookies[name];
    if (single) return single;
    // Reassemble chunked cookie value if present.
    if (cookies[`${name}.0`]) {
      let value = "";
      for (let i = 0; cookies[`${name}.${i}`] !== undefined; i++) {
        value += cookies[`${name}.${i}`];
      }
      if (value) return value;
    }
  }
  return null;
}

/** Parse a raw Cookie header into a name→value map (Socket.IO handshake). */
export function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

/** Verify a token → authenticated user, checking the DB row still exists (mirrors
 *  app currentUser(): a stale JWT after a DB reset is treated as unauthenticated). */
export async function userFromToken(token: string | null): Promise<AuthedUser | null> {
  if (!token) return null;
  const uid = await decodeUid(token);
  if (!uid) return null;
  const user = await db.user.findFirst({
    where: { id: uid, deletedAt: null },
    select: { id: true, email: true },
  });
  return user ? { id: user.id, email: user.email } : null;
}
