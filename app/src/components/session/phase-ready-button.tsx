"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/hooks/use-api";
import { useSessionRealtimeOptional } from "@/components/realtime/session-realtime-provider";
import type { SessionSnapshot } from "@/lib/session-service";

/** TFT-style "ready" to fast-forward the current phase when everyone is done. */
export function PhaseReadyButton({
  sessionId,
  phaseReady,
  autoHost,
  disabled,
}: {
  sessionId: string;
  phaseReady: boolean;
  autoHost: boolean;
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;
  const realtime = useSessionRealtimeOptional();
  const mutation = useMutation({
    mutationFn: async (ready: boolean) => {
      if (realtime?.send({ op: "phaseReady", ready })) {
        return { ok: true };
      }
      return apiFetch(`/api/sessions/${sessionId}/phase-ready`, {
        method: "POST",
        body: JSON.stringify({ ready }),
      });
    },
    onMutate: async (ready) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SessionSnapshot>(queryKey);
      if (previous) {
        queryClient.setQueryData<SessionSnapshot>(queryKey, {
          ...previous,
          participants: previous.participants.map((p) =>
            p.isSelf ? { ...p, phaseReady: ready } : p,
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

  if (!autoHost) return null;

  return (
    <Button
      size="sm"
      variant={phaseReady ? "secondary" : "primary"}
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate(!phaseReady)}
      className="w-full"
    >
      {phaseReady ? "Đã sẵn sàng — chờ người khác" : "Sẵn sàng — chuyển giai đoạn"}
    </Button>
  );
}
