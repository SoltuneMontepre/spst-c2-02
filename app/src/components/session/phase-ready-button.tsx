"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/hooks/use-api";

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
  const mutation = useMutation({
    mutationFn: (ready: boolean) =>
      apiFetch(`/api/sessions/${sessionId}/phase-ready`, {
        method: "POST",
        body: JSON.stringify({ ready }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
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
