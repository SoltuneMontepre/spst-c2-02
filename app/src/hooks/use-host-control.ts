"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";
import type { Role, ProductivityProfile } from "@/generated/prisma/enums";

export type HostAction =
  | "start"
  | "next"
  | "pause"
  | "resume"
  | "extend"
  | "end"
  | "cancel"
  | "setAutoHost";

export type HostLobbyAction =
  | { action: "setAutoHost"; autoHost: boolean }
  | {
      action: "setRole";
      participantId: string;
      role: Role | null;
      productivityProfile?: ProductivityProfile | null;
    }
  | { action: "addBot"; role: Role; productivityProfile?: ProductivityProfile }
  | { action: "removeBot"; participantId: string };

export type HostMutationAction = HostAction | HostLobbyAction;

export function useHostControl(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: HostMutationAction) =>
      apiFetch(`/api/sessions/${sessionId}/host`, {
        method: "POST",
        body: JSON.stringify(
          typeof action === "string" ? { action } : action,
        ),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}
