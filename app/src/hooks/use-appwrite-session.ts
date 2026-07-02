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

let sharedSessionReady = false;
let sharedSessionPromise: Promise<void> | null = null;
let sharedSessionGeneration = 0;

/** Mint an Appwrite session for the logged-in NextAuth user (realtime auth bridge). */
export function useAppwriteSession(): boolean {
  const { status } = useSession();
  const [ready, setReady] = useState(
    !isAppwriteRealtimeEnabled() || sharedSessionReady,
  );
  const inflight = useRef<Promise<void> | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAppwriteRealtimeEnabled()) {
      setReady(true);
      return;
    }

    if (status === "unauthenticated") {
      sharedSessionGeneration += 1;
      sharedSessionReady = false;
      sharedSessionPromise = null;
      clearAppwriteBrowserSession();
      setReady(false);
      retryCount.current = 0;
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      return;
    }

    if (status !== "authenticated") return;

    const attempt = () => {
      if (inflight.current) return;
      if (sharedSessionReady) {
        setReady(true);
        retryCount.current = 0;
        return;
      }

      if (!sharedSessionPromise) {
        const generation = sharedSessionGeneration;
        sharedSessionPromise = apiFetch<AppwriteSessionResponse>("/api/me/appwrite-session")
          .then((session) => {
            if (generation !== sharedSessionGeneration) return;
            setAppwriteBrowserSession(session.secret);
            sharedSessionReady = true;
          })
          .finally(() => {
            sharedSessionPromise = null;
          });
      }

      inflight.current = sharedSessionPromise
        .then(() => {
          setReady(true);
          retryCount.current = 0;
        })
        .catch(() => {
          setReady(false);
          if (retryCount.current < 3) {
            retryCount.current += 1;
            const delay = 2000 * Math.pow(2, retryCount.current - 1); // 2s, 4s, 8s
            retryTimer.current = setTimeout(() => {
              retryTimer.current = null;
              attempt();
            }, delay);
          }
        })
        .finally(() => {
          inflight.current = null;
        });
    };

    attempt();

    return () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
    };
  }, [status]);

  return ready;
}
