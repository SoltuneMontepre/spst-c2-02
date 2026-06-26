"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import type { HomeDashboard } from "@/lib/session-service";
import {
  createReconnectingWs,
  realtimeWsUrl,
  type RealtimeState,
} from "@/lib/realtime/ws-client";

export type HomeStreamState = RealtimeState;

const HomeRealtimeContext = createContext<HomeStreamState>("connecting");

export function HomeRealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const [streamState, setStreamState] = useState<HomeStreamState>("connecting");
  const wasDisconnected = useRef(false);
  const enabled = status === "authenticated";

  useEffect(() => {
    if (!enabled) {
      setStreamState("disconnected");
      return;
    }

    const queryKey = ["home-dashboard"] as const;
    const url = realtimeWsUrl("/api/realtime/home");

    const ws = createReconnectingWs(url, {
      onStateChange: setStreamState,
      onOpen: () => {
        if (wasDisconnected.current) {
          void queryClient.invalidateQueries({ queryKey });
        }
        wasDisconnected.current = false;
      },
      onMessage: (raw) => {
        try {
          const frame = JSON.parse(raw) as {
            op: string;
            dashboard?: HomeDashboard;
          };
          if (frame.op === "dashboard" && frame.dashboard) {
            queryClient.setQueryData(queryKey, frame.dashboard);
          }
        } catch {
          /* malformed */
        }
      },
    });

    return () => ws.close();
  }, [queryClient, enabled]);

  useEffect(() => {
    if (streamState === "disconnected") wasDisconnected.current = true;
  }, [streamState]);

  const value = useMemo(() => streamState, [streamState]);

  return (
    <HomeRealtimeContext.Provider value={value}>{children}</HomeRealtimeContext.Provider>
  );
}

export function useHomeStream(): HomeStreamState {
  return useContext(HomeRealtimeContext);
}
