"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Channel } from "appwrite";
import type { HomeDashboard } from "@/lib/session-service";
import { apiFetch } from "./use-api";
import { useAppwriteSession } from "./use-appwrite-session";
import { appwriteConfig } from "@/lib/appwrite-config";
import {
  getAppwriteRealtimeClient,
  isAppwriteRealtimeEnabled,
} from "@/lib/appwrite-client";

export type HomeStreamState = "connecting" | "connected" | "disconnected";

const APPWRITE_SUBSCRIBE_TIMEOUT_MS = 3_000;

type RealtimeSubscription = { unsubscribe: () => Promise<void> };

function subscribeWithTimeout<T extends RealtimeSubscription>(
  subscribePromise: Promise<T>,
  shouldKeep: () => boolean,
): Promise<T> {
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  subscribePromise
    .then((sub) => {
      if (timedOut || !shouldKeep()) void sub.unsubscribe();
    })
    .catch(() => {});

  return new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("Appwrite realtime subscribe timed out"));
    }, APPWRITE_SUBSCRIBE_TIMEOUT_MS);

    subscribePromise.then(
      (sub) => {
        if (timedOut) return;
        if (timer) clearTimeout(timer);
        resolve(sub);
      },
      (error) => {
        if (timedOut) return;
        if (timer) clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Appwrite Realtime with SSE fallback for home dashboard invalidation. */
export function useHomeStream(): HomeStreamState {
  const useAppwrite = isAppwriteRealtimeEnabled();
  const appwriteReady = useAppwriteSession();
  const { data: authSession } = useSession();
  const userId = authSession?.user?.id;
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<HomeStreamState>("connecting");
  const wasDisconnected = useRef(false);

  useEffect(() => {
    const queryKey = ["home-dashboard"] as const;

    const applyDashboard = (dashboard: HomeDashboard) => {
      queryClient.setQueryData<HomeDashboard>(queryKey, dashboard);
    };

    const refetchDashboard = () => {
      void apiFetch<HomeDashboard>("/api/me/home-dashboard")
        .then(applyDashboard)
        .catch(() => {});
    };

    refetchDashboard();

    let closed = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;
    let appwriteSubs: Array<{ unsubscribe: () => Promise<void> }> = [];

    const onSnapshot = (e: Event) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as { dashboard: HomeDashboard };
        applyDashboard(payload.dashboard);
      } catch {
        /* malformed payload */
      }
    };

    const setupSSE = () => {
      if (closed || source) return;
      const newSource = new EventSource("/api/me/home-stream");
      newSource.addEventListener("snapshot", onSnapshot);
      newSource.addEventListener("open", () => {
        if (closed) return;
        if (wasDisconnected.current) refetchDashboard();
        wasDisconnected.current = false;
        setStreamState("connected");
      });
      newSource.addEventListener("error", () => {
        if (!closed) {
          wasDisconnected.current = true;
          setStreamState("disconnected");
        }
      });
      source = newSource;
    };

    const teardownSSE = () => {
      if (source) {
        source.close();
        source = null;
      }
    };

    const setupAppwrite = async () => {
      if (closed || appwriteSubs.length > 0 || !useAppwrite || !appwriteReady || !userId) return;
      const pendingSubs: RealtimeSubscription[] = [];
      try {
        const realtime = getAppwriteRealtimeClient();

        const subscribeRow = async (rowId: string) => {
          const sub = await subscribeWithTimeout(
            realtime.subscribe(
              Channel.tablesdb(appwriteConfig.databaseId)
                .table(appwriteConfig.homeSignalsTableId)
                .row(rowId)
                .update(),
              () => {
                if (!closed) refetchDashboard();
              },
            ),
            () => !closed && !source,
          );
          pendingSubs.push(sub);
          return sub;
        };

        const subs = await Promise.all([subscribeRow("public"), subscribeRow(userId)]);
        if (closed) {
          subs.forEach((s) => void s.unsubscribe());
          return;
        }
        appwriteSubs = subs;
        if (wasDisconnected.current) refetchDashboard();
        wasDisconnected.current = false;
        setStreamState("connected");

        // Appwrite is active — drop SSE to avoid duplicate updates
        teardownSSE();
      } catch {
        pendingSubs.forEach((s) => void s.unsubscribe());
        if (!closed) {
          wasDisconnected.current = true;
          setStreamState("disconnected");
          setupSSE();
        }
      }
    };

    if (useAppwrite && appwriteReady && userId) {
      void setupAppwrite();
    } else if (useAppwrite) {
      fallbackTimer = setTimeout(setupSSE, 3000);
    } else {
      setupSSE();
    }

    return () => {
      closed = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      teardownSSE();
      appwriteSubs.forEach((s) => void s.unsubscribe());
      setStreamState("connecting");
    };
  }, [queryClient, useAppwrite, appwriteReady, userId]);

  return streamState;
}
