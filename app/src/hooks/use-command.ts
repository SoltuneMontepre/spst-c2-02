"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

type CommandBody = { action: string } & Record<string, unknown>;

/** Send a gameplay command with optional stateVersion for optimistic concurrency. */
export function useCommand(sessionId: string, stateVersion?: number) {
  const queryClient = useQueryClient();
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}
