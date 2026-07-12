"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { HomeDashboard } from "@/lib/session-service";
import { apiFetch } from "./use-api";
import { getSocket } from "@/lib/realtime";

export type HomeStreamState = "connecting" | "connected" | "disconnected";

/** Socket.IO-backed home dashboard stream (Redis fans out across instances). */
export function useHomeStream(): HomeStreamState {
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<HomeStreamState>("connecting");
  const wasDisconnected = useRef(false);

  useEffect(() => {
    const socket = getSocket();
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

    const onSnapshot = (payload: { dashboard: HomeDashboard }) => {
      applyDashboard(payload.dashboard);
    };

    const subscribe = () => socket.emit("home:subscribe");
    const onConnect = () => {
      subscribe();
      if (wasDisconnected.current) refetchDashboard();
      wasDisconnected.current = false;
      setStreamState("connected");
    };
    const onDisconnect = () => {
      wasDisconnected.current = true;
      setStreamState("disconnected");
    };

    socket.on("home:snapshot", onSnapshot);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.emit("home:unsubscribe");
      socket.off("home:snapshot", onSnapshot);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      setStreamState("connecting");
    };
  }, [queryClient]);

  return streamState;
}
