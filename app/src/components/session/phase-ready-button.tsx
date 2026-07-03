"use client";

import { Button } from "@/components/ui/button";
import { usePhaseReady } from "@/hooks/use-phase-ready";
import { cn } from "@/lib/utils";

/** TFT-style "ready" to fast-forward the current phase when everyone is done. */
export function PhaseReadyButton({
  sessionId,
  phaseReady,
  autoHost,
  phase,
  disabled,
  className,
  idleLabel,
  readyLabel,
  attention = false,
}: {
  sessionId: string;
  phaseReady: boolean;
  autoHost: boolean;
  phase?: string | null;
  disabled?: boolean;
  className?: string;
  idleLabel?: string;
  readyLabel?: string;
  /** Pulse / glow after the player finishes an action. */
  attention?: boolean;
}) {
  const mutation = usePhaseReady(sessionId);

  const defaultIdleLabel =
    phase === "MARKET_OPEN"
      ? "Tôi đã giao dịch xong"
      : phase === "DECISION"
        ? "Tôi đã ra quyết định xong"
        : autoHost
          ? "Sẵn sàng — chuyển giai đoạn"
          : "Báo đã xong cho host";
  const defaultReadyLabel =
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
      className={cn(
        "w-full",
        attention &&
          !phaseReady &&
          "animate-bounce shadow-lg shadow-primary/40 ring-4 ring-primary/35",
        className,
      )}
    >
      {phaseReady
        ? (readyLabel ?? defaultReadyLabel)
        : (idleLabel ?? defaultIdleLabel)}
    </Button>
  );
}
