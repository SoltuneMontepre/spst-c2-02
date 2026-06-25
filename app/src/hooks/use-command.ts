"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "./use-api";
import type { SessionSnapshot } from "@/lib/session-service";

type CommandBody = { action: string } & Record<string, unknown>;

async function postCommand(
  sessionId: string,
  body: CommandBody,
  expectedStateVersion?: number,
) {
  return apiFetch(`/api/sessions/${sessionId}/commands`, {
    method: "POST",
    body: JSON.stringify({
      clientActionId: crypto.randomUUID(),
      expectedStateVersion,
      ...body,
    }),
  });
}

/** Send a gameplay command with optional stateVersion for optimistic concurrency. */
export function useCommand(sessionId: string, stateVersion?: number) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;

  return useMutation({
    mutationFn: async (body: CommandBody) => {
      const snap = queryClient.getQueryData<SessionSnapshot>(queryKey);
      let version = snap?.stateVersion ?? stateVersion;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await postCommand(sessionId, body, version);
        } catch (error) {
          if (
            attempt === 0 &&
            error instanceof ApiClientError &&
            error.code === "STALE_STATE"
          ) {
            await queryClient.refetchQueries({ queryKey });
            const fresh = queryClient.getQueryData<SessionSnapshot>(queryKey);
            version = fresh?.stateVersion;
            continue;
          }
          throw error;
        }
      }
      throw new ApiClientError("STALE_STATE", 409);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      if (error instanceof ApiClientError && error.code === "STALE_STATE") {
        void queryClient.refetchQueries({ queryKey });
      }
    },
  });
}
