"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { HomeDashboard } from "@/lib/session-service";
import { apiFetch } from "./use-api";

export type HomeStreamState = "connecting" | "connected" | "disconnected";

/** SSE-backed home dashboard invalidation stream (Redis fans out across instances). */
export function useHomeStream(): HomeStreamState {
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

    const onSnapshot = (e: Event) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data) as { dashboard: HomeDashboard };
        applyDashboard(payload.dashboard);
      } catch {
        /* malformed payload */
      }
    };

    const source = new EventSource("/api/me/home-stream");
    source.addEventListener("snapshot", onSnapshot);
    source.addEventListener("open", () => {
      if (closed) return;
      if (wasDisconnected.current) refetchDashboard();
      wasDisconnected.current = false;
      setStreamState("connected");
    });
    source.addEventListener("error", () => {
      if (!closed) {
        wasDisconnected.current = true;
        setStreamState("disconnected");
      }
    });

    return () => {
      closed = true;
      source.close();
      setStreamState("connecting");
    };
  }, [queryClient]);

  return streamState;
}
