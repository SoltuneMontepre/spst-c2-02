"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

/** SSE stream + heartbeat for presence / bot takeover (FR-GAME-03). */
export function useSessionStream(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`/api/sessions/${sessionId}/stream`);
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });

    source.addEventListener("update", refresh);

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
    };
  }, [sessionId, queryClient]);
}
