"use client";

import { useRouter } from "next/navigation";
import { Clock, LogOut, Wallet, Wifi } from "lucide-react";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import type { SessionStreamState } from "@/hooks/use-session-stream";
import { Brand } from "@/components/brand";
import { OpenProjectorButton } from "@/components/host/projector-mode-toggle";
import { CompactPhaseTimeline } from "@/components/session/game-phase-timeline";
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
  sessionId,
  variant = "default",
  isHost = false,
}: {
  data: Pick<
    SessionSnapshot,
    | "currentRound"
    | "totalRounds"
    | "phase"
    | "phaseEndsAt"
    | "paused"
    | "self"
    | "status"
  >;
  streamState: SessionStreamState;
  sessionId?: string;
  variant?: "default" | "map";
  isHost?: boolean;
}) {
  const router = useRouter();
  const remaining = useCountdown(data.phaseEndsAt, data.paused);
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] ?? data.phase : "Đang chờ";
  const connected = streamState === "connected";

  if (variant === "map") {
    return (
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Thoát phòng</span>
          </button>

          <div className="hidden h-4 w-px bg-border sm:block" />

          <Brand
            size={22}
            className="shrink-0 [&_span]:whitespace-nowrap [&_span]:text-[12px] [&_span]:font-black [&_span]:tracking-[-0.3px]"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
          <CompactPhaseTimeline
            phase={data.phase}
            currentRound={data.currentRound}
            totalRounds={data.totalRounds}
          />
          {data.paused ? (
            <span className="shrink-0 rounded-[8.5px] bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              Tạm dừng
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isHost && sessionId ? (
            <OpenProjectorButton sessionId={sessionId} size="sm" />
          ) : null}
          <span
            className={cn(
              "hidden items-center gap-1 text-[11px] font-semibold sm:flex",
              connected ? "text-success" : "text-muted-foreground",
            )}
          >
            <Wifi className="size-[13px]" aria-hidden />
            {connectionLabel(streamState)}
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="grid h-[42px] shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        <Brand
          size={24}
          className="shrink-0 [&_span]:whitespace-nowrap [&_span]:text-[12px] [&_span]:font-black [&_span]:tracking-[-0.3px]"
        />

        <div className="hidden h-[14px] w-px bg-border sm:block" />

        <span className="hidden shrink-0 rounded-[8.5px] border border-primary/25 bg-secondary px-[9.75px] py-[2.75px] text-[11px] font-bold text-primary sm:inline-flex">
          Vòng {data.currentRound}/{data.totalRounds}
        </span>

        <span className="hidden min-w-0 truncate rounded-[8.5px] bg-secondary px-[8.75px] py-[1.75px] text-[11px] font-semibold text-foreground sm:inline-flex">
          {phaseLabel}
        </span>

        {remaining !== null ? (
          <span className="hidden shrink-0 items-center gap-1 font-mono text-[14px] font-bold tabular-nums md:flex">
            <Clock className="size-[13px] text-muted-foreground" aria-hidden />
            {formatClock(remaining)}
          </span>
        ) : null}
      </div>

      {data.self?.balanceVnd != null ? (
        <span
          className="flex h-9 min-w-[138px] items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 shadow-sm ring-1 ring-primary/10 sm:min-w-[154px] sm:px-3"
          title="Tiền là thước đo giá trị và phương tiện lưu thông; giá trị biểu hiện thành giá cả khi giao dịch."
          aria-label={`Ví ${data.self.balanceVnd.toLocaleString("vi-VN")} Đồng`}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Wallet className="size-3.5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="text-[10px] font-semibold text-muted-foreground">Ví</span>
            <span className="whitespace-nowrap text-[13px] font-black text-primary">
              {formatThousandDong(data.self.balanceVnd)}
            </span>
          </span>
        </span>
      ) : (
        <span aria-hidden />
      )}

      <div className="flex min-w-0 items-center justify-end gap-2">
        <span
          className={cn(
            "hidden items-center gap-1 text-[11px] font-semibold sm:flex",
            connected ? "text-success" : "text-muted-foreground",
          )}
        >
          <Wifi className="size-[13px]" aria-hidden />
          {connectionLabel(streamState)}
        </span>

        <div className="hidden h-[14px] w-px bg-border sm:block" />

        {data.self?.role ? (
          <span className="min-w-0 max-w-[6.5rem] truncate rounded-full bg-secondary px-[8.75px] py-[3.5px] text-[11px] font-semibold text-accent">
            {ROLE_SHORT_LABELS[data.self.role]}
          </span>
        ) : null}
      </div>
    </header>
  );
}
