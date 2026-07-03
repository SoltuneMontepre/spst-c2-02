"use client";

import { Clock, Loader2, Pause } from "lucide-react";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import { PHASE_BANNERS, ROUND_NAMES, EVENT_COPY } from "@/lib/labels";
import { AiHostNarration } from "./ai-host-narration";

export function PhaseBanner({
  round,
  phase,
  phaseEndsAt,
  paused,
  aiNarration,
  autoHost,
}: {
  round: number;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
  aiNarration?: string | null;
  autoHost?: boolean;
}) {
  const remaining = useCountdown(phaseEndsAt, paused);
  const event = phase === "EVENT" ? EVENT_COPY[round] : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 rounded-[14px] bg-primary/10 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              Vòng {round}
              {ROUND_NAMES[round] ? ` · ${ROUND_NAMES[round]}` : ""}
            </span>
            <span className="text-sm font-semibold">
              {paused
                ? autoHost
                  ? "AI điều phối đã tạm dừng"
                  : "Host đã tạm dừng phiên"
                : phase
                  ? PHASE_BANNERS[phase]
                  : "Đang chuẩn bị"}
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-lg font-bold tabular-nums">
            {paused ? (
              <Pause className="size-4" />
            ) : remaining === 0 ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm font-semibold">Đang chuyển giai đoạn…</span>
              </>
            ) : (
              <>
                <Clock className="size-4" />
                {remaining !== null ? formatClock(remaining) : "--:--"}
              </>
            )}
          </span>
        </div>
        {event ? (
          <div className="rounded-lg bg-background/60 px-3 py-2 text-xs">
            <p className="font-semibold">{event.title}</p>
            <p className="text-muted-foreground">{event.body}</p>
          </div>
        ) : null}
      </div>
      {autoHost ? <AiHostNarration text={aiNarration} /> : null}
    </div>
  );
}
