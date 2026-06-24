"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

export type SessionStreamState = "connecting" | "connected" | "disconnected";

/** SSE stream + heartbeat for presence / bot takeover (FR-GAME-03). */
export function useSessionStream(sessionId: string): SessionStreamState {
  const queryClient = useQueryClient();
  const [streamState, setStreamState] = useState<SessionStreamState>("connecting");

  useEffect(() => {
    const source = new EventSource(`/api/sessions/${sessionId}/stream`);
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });

    source.addEventListener("update", refresh);
    source.addEventListener("open", () => setStreamState("connected"));
    source.addEventListener("error", () => setStreamState("disconnected"));

    const heartbeat = () => {
      void apiFetch(`/api/sessions/${sessionId}/heartbeat`, { method: "POST" }).catch(
        () => {},
      );
    };
    heartbeat();
    const hb = setInterval(heartbeat, 10_000);

    return () => {
      clearInterval(hb);
      source.close();
      setStreamState("connecting");
    };
  }, [sessionId, queryClient]);

  return streamState;
}
