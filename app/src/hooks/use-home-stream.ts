"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { HomeStreamSnapshotPayload } from "@/lib/events";
import type { HomeDashboard } from "@/lib/session-service";
import { apiFetch } from "./use-api";

export type HomeStreamState = "connecting" | "connected" | "disconnected";

/** SSE stream for home dashboard (public rooms, recent sessions). */
export function useHomeStream(): HomeStreamState {
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<HomeStreamState>("connecting");
  const wasDisconnected = useRef(false);

  useEffect(() => {
    const source = new EventSource("/api/me/home-stream");
    const queryKey = ["home-dashboard"] as const;

    const applyDashboard = (dashboard: HomeDashboard) => {
      queryClient.setQueryData<HomeDashboard>(queryKey, dashboard);
    };

    const onSnapshot = (e: Event) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as HomeStreamSnapshotPayload;
        applyDashboard(payload.dashboard);
      } catch {
        /* malformed payload */
      }
    };

    source.addEventListener("snapshot", onSnapshot);
    source.addEventListener("open", () => {
      if (wasDisconnected.current) {
        void apiFetch<HomeDashboard>("/api/me/home-dashboard")
          .then(applyDashboard)
          .catch(() => {});
      }
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
  }, [queryClient]);

  return streamState;
}
