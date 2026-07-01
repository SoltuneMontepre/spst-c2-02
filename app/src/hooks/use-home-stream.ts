"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Channel, Realtime } from "appwrite";
import type { HomeDashboard } from "@/lib/session-service";
import { apiFetch } from "./use-api";
import { useAppwriteSession } from "./use-appwrite-session";
import { appwriteConfig } from "@/lib/appwrite-config";
import {
  getAppwriteBrowserClient,
  isAppwriteRealtimeEnabled,
} from "@/lib/appwrite-client";

export type HomeStreamState = "connecting" | "connected" | "disconnected";

/** Appwrite Realtime or SSE fallback for home dashboard invalidation. */
export function useHomeStream(): HomeStreamState {
  const useAppwrite = isAppwriteRealtimeEnabled();
  const appwriteReady = useAppwriteSession();
  const { data: authSession } = useSession();
  const userId = authSession?.user?.id;
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<HomeStreamState>("connecting");
  const wasDisconnected = useRef(false);

  useEffect(() => {
    if (useAppwrite && !appwriteReady) return;

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

    if (useAppwrite && userId) {
      let closed = false;
      const client = getAppwriteBrowserClient();
      const realtime = new Realtime(client);
      const subscriptions: Array<{ unsubscribe: () => Promise<void> }> = [];

      const subscribeRow = (rowId: string) =>
        realtime.subscribe(
          Channel.tablesdb(appwriteConfig.databaseId)
            .table(appwriteConfig.homeSignalsTableId)
            .row(rowId)
            .update(),
          () => {
            if (!closed) refetchDashboard();
          },
        );

      void Promise.all([subscribeRow("public"), subscribeRow(userId)])
        .then((subs) => {
          if (closed) {
            subs.forEach((s) => void s.unsubscribe());
            return;
          }
          subscriptions.push(...subs);
          if (wasDisconnected.current) refetchDashboard();
          wasDisconnected.current = false;
          setStreamState("connected");
        })
        .catch(() => {
          wasDisconnected.current = true;
          setStreamState("disconnected");
        });

      return () => {
        closed = true;
        subscriptions.forEach((s) => void s.unsubscribe());
        setStreamState("connecting");
      };
    }

    const source = new EventSource("/api/me/home-stream");

    const onSnapshot = (e: Event) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as { dashboard: HomeDashboard };
        applyDashboard(payload.dashboard);
      } catch {
        /* malformed payload */
      }
    };

    source.addEventListener("snapshot", onSnapshot);
    source.addEventListener("open", () => {
      if (wasDisconnected.current) refetchDashboard();
      wasDisconnected.current = false;
      setStreamState("connected");
    });
    source.addEventListener("error", () => {
      wasDisconnected.current = true;
      setStreamState("disconnected");
    });

    return () => {
      source.close();
      setStreamState("connecting");
    };
  }, [queryClient, useAppwrite, appwriteReady, userId]);

  return streamState;
}
