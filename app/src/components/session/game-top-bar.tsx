"use client";

import { Clock, Wifi } from "lucide-react";
import { Brand } from "@/components/brand";
import { RoleBadge } from "@/components/lobby/role-badge";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import type { SessionStreamState } from "@/hooks/use-session-stream";
import type { SessionSnapshot } from "@/lib/session-service";
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
    "currentRound" | "totalRounds" | "phase" | "phaseEndsAt" | "paused" | "self"
  >;
  streamState: SessionStreamState;
}) {
  const remaining = useCountdown(data.phaseEndsAt, data.paused);
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] ?? data.phase : "Đang chờ";
  const connected = streamState === "connected";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Brand className="shrink-0" />
        <div className="hidden items-center gap-2 sm:flex">
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Vòng {data.currentRound}/{data.totalRounds}
          </span>
          <span className="text-sm text-muted-foreground">{phaseLabel}</span>
          {remaining !== null ? (
            <span className="flex items-center gap-1 text-sm font-medium tabular-nums">
              <Clock className="size-3.5 text-muted-foreground" aria-hidden />
              {formatClock(remaining)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs sm:flex",
            connected ? "text-success" : "text-muted-foreground",
          )}
        >
          <Wifi className="size-3.5" aria-hidden />
          {connectionLabel(streamState)}
        </span>
        {data.self?.role ? <RoleBadge role={data.self.role} /> : null}
        {data.self?.balanceVnd != null ? (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Ví {formatThousandDong(data.self.balanceVnd)}
          </span>
        ) : null}
      </div>
    </header>
  );
}
