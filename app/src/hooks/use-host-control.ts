"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "./use-api";
import type { Role, ProductivityProfile } from "@/generated/prisma/enums";
import { useSessionRealtimeOptional } from "@/components/realtime/session-realtime-provider";
import type { SessionSnapshot } from "@/lib/session-service";

export type HostAction =
  | "start"
  | "next"
  | "pause"
  | "resume"
  | "extend"
  | "end"
  | "cancel"
  | "extendSoloLobby"
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

const STALE_HOST_CODES = new Set(["INVALID_STATE", "SESSION_LOCKED"]);

const LOBBY_PATCH_ACTIONS = new Set(["setRole", "removeBot"]);

function isLobbyPatchAction(
  action: HostMutationAction,
): action is Extract<HostLobbyAction, { action: "setRole" | "removeBot" }> {
  return typeof action !== "string" && LOBBY_PATCH_ACTIONS.has(action.action);
}

function patchRoleSet(
  snapshot: SessionSnapshot,
  participantId: string,
  role: Role | null,
  productivityProfile?: ProductivityProfile | null,
): SessionSnapshot {
  return {
    ...snapshot,
    participants: snapshot.participants.map((p) => {
      if (p.id !== participantId) return p;
      const profile =
        role === "PRODUCER"
          ? (productivityProfile ?? p.productivityProfile ?? "SOCIAL_AVERAGE")
          : null;
      return { ...p, role, productivityProfile: profile };
    }),
  };
}

export function useHostControl(sessionId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;
  const realtime = useSessionRealtimeOptional();

  return useMutation({
    mutationFn: async (action: HostMutationAction) => {
      const body =
        typeof action === "string" ? { action } : action;

      if (realtime?.sendRaw({ op: "host", ...body })) {
        return { ok: true };
      }

      return apiFetch(`/api/sessions/${sessionId}/host`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (action) => {
      if (!isLobbyPatchAction(action)) return;

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SessionSnapshot>(queryKey);
      if (!previous) return { previous };

      if (action.action === "setRole") {
        queryClient.setQueryData<SessionSnapshot>(
          queryKey,
          patchRoleSet(
            previous,
            action.participantId,
            action.role,
            action.productivityProfile,
          ),
        );
      } else if (action.action === "removeBot") {
        queryClient.setQueryData<SessionSnapshot>(queryKey, {
          ...previous,
          participants: previous.participants.filter(
            (p) => p.id !== action.participantId,
          ),
        });
      }

      return { previous };
    },
    onError: (error, _action, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      if (
        error instanceof ApiClientError &&
        error.status === 409 &&
        STALE_HOST_CODES.has(error.code)
      ) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    onSuccess: (_data, action) => {
      if (realtime && isLobbyPatchAction(action)) return;

      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["home-dashboard"] });
    },
  });
}
