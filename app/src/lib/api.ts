import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { ZodError } from "zod";
import { auth } from "./auth";
import { db } from "./db";

// Unambiguous room-code alphabet (no 0/O/1/I) — 6 chars (FR-ROOM-02).
const codeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function generateRoomCode(): string {
  return codeAlphabet();
}

export interface AuthedUser {
  id: string;
  email: string;
}

/** Resolve the authenticated user or null. Verifies the DB row still exists
 *  so a stale JWT (e.g. after a DB reset) is treated as unauthenticated. */
export async function currentUser(): Promise<AuthedUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;
  const user = await db.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, email: true },
  });
  return user ? { id: user.id, email: user.email } : null;
}

export function jsonError(code: string, status: number, message?: string) {
  return NextResponse.json({ error: code, message: message ?? code }, { status });
}

export function unauthorized() {
  return jsonError("UNAUTHORIZED", 401);
}

/** Wrap a handler, mapping zod and known errors to JSON responses. */
export async function handle<T>(
  fn: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", issues: err.issues },
        { status: 422 },
      );
    }
    if (err instanceof ApiError) {
      return jsonError(err.code, err.status, err.message);
    }
    console.error("Unhandled API error:", err);
    return jsonError("INTERNAL_ERROR", 500);
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ApiError";
  }
}
