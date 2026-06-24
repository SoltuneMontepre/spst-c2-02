"use client";

import { Clock, Pause } from "lucide-react";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import { PHASE_BANNERS, ROUND_NAMES } from "@/lib/labels";

export function PhaseBanner({
  round,
  phase,
  phaseEndsAt,
  paused,
}: {
  round: number;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
}) {
  const remaining = useCountdown(phaseEndsAt, paused);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-4 py-2.5">
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
          Vòng {round}
          {ROUND_NAMES[round] ? ` · ${ROUND_NAMES[round]}` : ""}
        </span>
        <span className="text-sm font-semibold">
          {paused
            ? "Host đã tạm dừng phiên"
            : phase
              ? PHASE_BANNERS[phase]
              : "Đang chuẩn bị"}
        </span>
      </div>
      <span className="flex items-center gap-1 font-mono text-lg font-bold tabular-nums">
        {paused ? (
          <Pause className="size-4" />
        ) : (
          <>
            <Clock className="size-4" />
            {remaining !== null ? formatClock(remaining) : "--:--"}
          </>
        )}
      </span>
    </div>
  );
}
