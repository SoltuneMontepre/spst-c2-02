import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { ZodError } from "zod";
import { auth } from "./auth";
import { errorMessage } from "./error-messages";
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
  return NextResponse.json(
    { error: code, message: message ?? errorMessage(code) },
    { status },
  );
}

export function unauthorized() {
  return jsonError("UNAUTHORIZED", 401);
}

/** Map thrown service-layer errors to HTTP responses. */
export function mapServiceError(err: unknown): ApiError | null {
  if (err instanceof ApiError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  switch (msg) {
    case "FORBIDDEN":
      return new ApiError("FORBIDDEN", 403);
    case "ROOM_NOT_FOUND":
      return new ApiError("ROOM_NOT_FOUND", 404);
    case "INVALID_STATE":
      return new ApiError("INVALID_STATE", 409);
    default:
      return null;
  }
}

/** Wrap a handler, mapping zod and known errors to JSON responses.
 *  @param headers Optional response headers (e.g. cache-control). */
export async function handle<T>(
  fn: () => Promise<T>,
  headers?: Record<string, string>,
): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json(result, { headers });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", issues: err.issues },
        { status: 422 },
      );
    }
    const mapped = mapServiceError(err);
    if (mapped) {
      return jsonError(mapped.code, mapped.status, mapped.message);
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
