"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Subscribe to the session SSE stream and refresh the snapshot on updates.
 *  Falls back gracefully: the snapshot query keeps a slow poll as backup. */
export function useSessionStream(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`/api/sessions/${sessionId}/stream`);

    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });

    source.addEventListener("update", refresh);
    source.addEventListener("error", () => {
      // EventSource auto-reconnects; nothing to do.
    });

    return () => source.close();
  }, [sessionId, queryClient]);
}
