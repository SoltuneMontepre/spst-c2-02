"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "./use-api";

type CommandBody = { action: string } & Record<string, unknown>;

/** Send a gameplay command with optional stateVersion for optimistic concurrency. */
export function useCommand(sessionId: string, stateVersion?: number) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;
  return useMutation({
    mutationFn: (body: CommandBody) =>
      apiFetch(`/api/sessions/${sessionId}/commands`, {
        method: "POST",
        body: JSON.stringify({
          clientActionId: crypto.randomUUID(),
          expectedStateVersion: stateVersion,
          ...body,
        }),
      }),
    onError: (error) => {
      if (error instanceof ApiClientError && error.code === "STALE_STATE") {
        void queryClient.refetchQueries({ queryKey });
      }
    },
  });
}
