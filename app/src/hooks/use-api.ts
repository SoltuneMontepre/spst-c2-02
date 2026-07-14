"use client";

import { signOut } from "next-auth/react";
import { BACKEND_URL } from "@/lib/backend";

/** Thin fetch wrapper that throws a typed error carrying the server code. */
export class ApiClientError extends Error {
  constructor(
    public code: string,
    public status: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ApiClientError";
  }
}

let signingOut = false;

/** Clear the Auth.js session once when the backend rejects the cookie/JWT. */
function logoutOnUnauthorized() {
  if (signingOut || typeof window === "undefined") return;
  signingOut = true;
  void signOut({ callbackUrl: "/auth" });
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  // Auth endpoints (register/verify/password reset + NextAuth) stay on the Next
  // app; everything else goes to the game backend. Always send the Auth.js cookie.
  const sameOrigin = path.startsWith("http") || path.startsWith("/api/auth");
  const url = sameOrigin ? path : `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : null;
  if (!res.ok) {
    const code = data?.error ?? "REQUEST_FAILED";
    // Stale / missing session — don't leave the UI in a half-authed loop.
    if (
      !path.startsWith("/api/auth") &&
      (res.status === 401 || code === "UNAUTHORIZED")
    ) {
      logoutOnUnauthorized();
    }
    throw new ApiClientError(code, res.status, data?.message);
  }
  return data as T;
}
