"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

type CommandBody = { action: string } & Record<string, unknown>;

/** Send a gameplay command. Server validates against live DB state (wallet,
 *  capacity, phase) — no client stateVersion gate, so bot traffic cannot
 *  block produce/buy/list with STALE_STATE. */
export function useCommand(sessionId: string, _stateVersion?: number) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;

  return useMutation({
    mutationFn: async (body: CommandBody) => {
      const clientActionId = crypto.randomUUID();
      return apiFetch(`/api/sessions/${sessionId}/commands`, {
        method: "POST",
        body: JSON.stringify({
          clientActionId,
          ...body,
        }),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
