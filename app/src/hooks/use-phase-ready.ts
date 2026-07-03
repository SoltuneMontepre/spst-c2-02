"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/hooks/use-api";
import type { SessionSnapshot } from "@/lib/session-service";

export function usePhaseReady(sessionId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;

  return useMutation({
    mutationFn: (ready: boolean) =>
      apiFetch(`/api/sessions/${sessionId}/phase-ready`, {
        method: "POST",
        body: JSON.stringify({ ready }),
      }),
    onMutate: async (ready) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SessionSnapshot>(queryKey);
      if (previous) {
        const now = new Date().toISOString();
        queryClient.setQueryData<SessionSnapshot>(queryKey, {
          ...previous,
          participants: previous.participants.map((p) =>
            p.isSelf
              ? {
                  ...p,
                  phaseReady: ready,
                  lastSeenAt: now,
                  presence: "ONLINE",
                }
              : p,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _ready, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}

/** Auto-mark phase ready when the player has nothing to do this phase. */
export function useAutoPhaseReady({
  sessionId,
  phase,
  phaseReady,
  shouldAutoReady,
  paused,
  enabled = true,
}: {
  sessionId: string;
  phase: string | null;
  phaseReady: boolean;
  shouldAutoReady: boolean;
  paused: boolean;
  enabled?: boolean;
}) {
  const { mutate, isPending } = usePhaseReady(sessionId);
  const requestedForPhase = useRef<string | null>(null);
  const lastPhase = useRef(phase);

  useEffect(() => {
    if (lastPhase.current !== phase) {
      lastPhase.current = phase;
      requestedForPhase.current = null;
    }

    if (!enabled || paused || phaseReady || !shouldAutoReady) return;
    if (phase !== "DECISION" && phase !== "MARKET_OPEN") return;
    if (isPending) return;
    if (requestedForPhase.current === phase) return;

    requestedForPhase.current = phase;
    mutate(true, {
      onError: () => {
        requestedForPhase.current = null;
      },
    });
  }, [enabled, paused, phaseReady, shouldAutoReady, phase, mutate, isPending]);
}
