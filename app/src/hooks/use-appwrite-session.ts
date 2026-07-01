"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "./use-api";
import {
  clearAppwriteBrowserSession,
  isAppwriteRealtimeEnabled,
  setAppwriteBrowserSession,
} from "@/lib/appwrite-client";

interface AppwriteSessionResponse {
  userId: string;
  secret: string;
  expire: string;
}

/** Mint an Appwrite session for the logged-in NextAuth user (realtime auth bridge). */
export function useAppwriteSession(): boolean {
  const { status } = useSession();
  const [ready, setReady] = useState(!isAppwriteRealtimeEnabled());
  const inflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!isAppwriteRealtimeEnabled()) {
      setReady(true);
      return;
    }

    if (status === "unauthenticated") {
      clearAppwriteBrowserSession();
      setReady(false);
      return;
    }

    if (status !== "authenticated") return;

    if (!inflight.current) {
      inflight.current = apiFetch<AppwriteSessionResponse>("/api/me/appwrite-session")
        .then((session) => {
          setAppwriteBrowserSession(session.secret);
          setReady(true);
        })
        .catch(() => {
          setReady(false);
        })
        .finally(() => {
          inflight.current = null;
        });
    }
  }, [status]);

  return ready;
}
