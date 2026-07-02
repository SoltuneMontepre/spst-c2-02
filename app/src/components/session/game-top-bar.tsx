"use client";

import { Clock, Wifi } from "lucide-react";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import type { SessionStreamState } from "@/hooks/use-session-stream";
import type { SessionSnapshot } from "@/lib/session-service";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";
import { PHASE_LABELS } from "@/lib/labels";
import { formatThousandDong } from "@/lib/money";
import { cn } from "@/lib/utils";

function connectionLabel(streamState: SessionStreamState): string {
  if (streamState === "connecting") return "Đang kết nối";
  if (streamState === "disconnected") return "Mất kết nối";
  return "Kết nối ổn định";
}

export function GameTopBar({
  data,
  streamState,
}: {
  data: Pick<
    SessionSnapshot,
    "currentRound" | "totalRounds" | "phase" | "phaseEndsAt" | "paused" | "self" | "status"
  >;
  streamState: SessionStreamState;
}) {
  const remaining = useCountdown(data.phaseEndsAt, data.paused);
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] ?? data.phase : "Đang chờ";
  const connected = streamState === "connected";

  return (
    <header className="flex h-[42px] shrink-0 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        {/* Brand icon placeholder */}
        <div className="shrink-0 size-[24.5px] rounded-[14.5px] bg-gradient-to-br from-[#c94a2d] to-[#e06040]" />
        <span className="text-[12px] font-black tracking-[-0.3px]">PHIÊN CHỢ</span>

        <div className="h-[14px] w-px bg-border" />

        <span className="rounded-[8.5px] bg-secondary border border-primary/25 px-[9.75px] py-[2.75px] text-[11px] font-bold text-primary">
          Vòng {data.currentRound}/{data.totalRounds}
        </span>

        <span className="rounded-[8.5px] bg-secondary px-[8.75px] py-[1.75px] text-[11px] font-semibold text-foreground">
          {phaseLabel}
        </span>

        {remaining !== null ? (
          <span className="flex items-center gap-1 text-[14px] font-bold font-mono tabular-nums">
            <Clock className="size-[13px] text-muted-foreground" aria-hidden />
            {formatClock(remaining)}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "hidden items-center gap-1 text-[11px] font-semibold sm:flex",
            connected ? "text-success" : "text-muted-foreground",
          )}
        >
          <Wifi className="size-[13px]" aria-hidden />
          {connectionLabel(streamState)}
        </span>

        <div className="h-[14px] w-px bg-border hidden sm:block" />

        {data.self?.role ? (
          <span className="rounded-full bg-secondary px-[8.75px] py-[3.5px] text-[11px] font-semibold text-accent">
            {ROLE_SHORT_LABELS[data.self.role]}
          </span>
        ) : null}

        {data.self?.balanceVnd != null ? (
          <span className="rounded-[10.5px] border border-border px-[11.5px] py-[6.25px] flex flex-col leading-none">
            <span className="text-[10px] text-muted-foreground">Ví</span>
            <span className="text-[13px] font-bold text-primary">{formatThousandDong(data.self.balanceVnd)}</span>
          </span>
        ) : null}
      </div>
    </header>
  );
}
