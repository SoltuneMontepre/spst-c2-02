"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "./use-api";
import type { Role, ProductivityProfile } from "@/generated/prisma/enums";

export type HostAction =
  | "next"
  | "pause"
  | "resume"
  | "extend"
  | "end"
  | "cancel"
  | "extendSoloLobby"
  | "setAutoHost";

export type StartRoleAssignment = {
  participantId: string;
  role: Role;
  productivityProfile?: ProductivityProfile | null;
};

export type HostLobbyAction =
  | { action: "start"; roleAssignments?: StartRoleAssignment[] }
  | { action: "setAutoHost"; autoHost: boolean }
  | { action: "setAutoAssignRoles"; autoAssignRoles: boolean }
  | { action: "setGuidanceEnabled"; guidanceEnabled: boolean }
  | {
      action: "setRole";
      participantId: string;
      role: Role | null;
      productivityProfile?: ProductivityProfile | null;
    }
  | { action: "addBot"; role: Role; productivityProfile?: ProductivityProfile }
  | { action: "autoFillBots" }
  | { action: "removeBot"; participantId: string };

export type HostMutationAction = HostAction | HostLobbyAction | "start";

const STALE_HOST_CODES = new Set(["INVALID_STATE", "SESSION_LOCKED"]);

export function useHostControl(sessionId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;

  return useMutation({
    mutationFn: (action: HostMutationAction) =>
      apiFetch(`/api/sessions/${sessionId}/host`, {
        method: "POST",
        body: JSON.stringify(
          typeof action === "string"
            ? action === "start"
              ? { action: "start" }
              : { action }
            : action,
        ),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["home-dashboard"] });
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.status === 409 &&
        STALE_HOST_CODES.has(error.code)
      ) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
