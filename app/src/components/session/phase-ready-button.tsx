"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/hooks/use-api";
import type { SessionSnapshot } from "@/lib/session-service";
import { cn } from "@/lib/utils";

/** TFT-style "ready" to fast-forward the current phase when everyone is done. */
export function PhaseReadyButton({
  sessionId,
  phaseReady,
  autoHost,
  phase,
  disabled,
  className,
}: {
  sessionId: string;
  phaseReady: boolean;
  autoHost: boolean;
  phase?: string | null;
  disabled?: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;
  const mutation = useMutation({
    mutationFn: (ready: boolean) =>
      apiFetch(`/api/sessions/${sessionId}/phase-ready`, {
        method: "POST",
        body: JSON.stringify({ ready }),
      }),
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

  const idleLabel =
    phase === "MARKET_OPEN"
      ? "Tôi đã giao dịch xong"
      : phase === "DECISION"
        ? "Tôi đã ra quyết định xong"
      : autoHost
        ? "Sẵn sàng — chuyển giai đoạn"
        : "Báo đã xong cho host";
  const readyLabel =
    phase === "MARKET_OPEN"
      ? "Đã xong — chờ cả chợ"
      : phase === "DECISION"
        ? "Đã quyết định — chờ mọi người"
      : autoHost
        ? "Đã sẵn sàng — chờ người khác"
        : "Đã báo xong cho host";

  return (
    <Button
      size="sm"
      variant={phaseReady ? "secondary" : "primary"}
      disabled={disabled || mutation.isPending}
      onClick={() => mutation.mutate(!phaseReady)}
      className={cn("w-full", className)}
    >
      {phaseReady ? readyLabel : idleLabel}
    </Button>
  );
}
