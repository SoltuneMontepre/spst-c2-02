"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatSoloLobbyCountdown,
  soloLobbyRemainingMs,
} from "@/lib/lobby-solo";
import { cn } from "@/lib/utils";

export function SoloLobbyCountdown({
  soloSince,
  extendUsed,
  isHost,
  onExtend,
  extendPending,
  className,
}: {
  soloSince: string;
  extendUsed: boolean;
  isHost: boolean;
  onExtend?: () => void;
  extendPending?: boolean;
  className?: string;
}) {
  const [remainingMs, setRemainingMs] = useState(() =>
    soloLobbyRemainingMs(soloSince),
  );

  useEffect(() => {
    const tick = () => setRemainingMs(soloLobbyRemainingMs(soloSince));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [soloSince]);

  if (remainingMs <= 0) return null;

  const urgent = remainingMs <= 15_000;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        urgent
          ? "border-danger/40 bg-danger/10"
          : "border-primary/30 bg-primary/5",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Clock
          className={cn(
            "mt-0.5 size-4 shrink-0",
            urgent ? "text-danger" : "text-primary",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Phòng sẽ tự hủy sau{" "}
            <span className="font-mono tabular-nums">
              {formatSoloLobbyCountdown(remainingMs)}
            </span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {isHost
              ? "Mọi người đều đã ngoại tuyến. Quay lại phòng hoặc gia hạn thêm 1 phút."
              : "Mọi người trong phòng đều đã ngoại tuyến. Host có thể gia hạn thêm thời gian chờ."}
          </p>
          {isHost && onExtend && !extendUsed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full sm:w-auto"
              disabled={extendPending}
              onClick={onExtend}
            >
              {extendPending ? "Đang gia hạn…" : "Gia hạn thêm 1 phút"}
            </Button>
          ) : null}
          {isHost && extendUsed ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Đã gia hạn một lần trong lần chờ này.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
