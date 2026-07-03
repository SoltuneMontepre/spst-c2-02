"use client";

import { Clock, Pause, Sparkles } from "lucide-react";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import { useTutorial } from "@/components/learning/tutorial-provider";
import { PhaseReadyButton } from "@/components/session/phase-ready-button";
import { EVENT_COPY, PHASE_BANNERS, ROUND_NAMES } from "@/lib/labels";
import type { SessionSnapshot } from "@/lib/session-service";
import { cn } from "@/lib/utils";

function canFastForwardPhase(status: string, phase: string | null): boolean {
  if (status === "INTRO" || status === "DEBRIEF") return false;
  return phase === "DECISION" || phase === "MARKET_OPEN" || phase === "RECAP";
}

/** TFT-style top announcement: vòng · giai đoạn · điều phối viên · timer. */
export function GameAnnouncementBanner({
  sessionId,
  data,
}: {
  sessionId: string;
  data: Pick<
    SessionSnapshot,
    | "currentRound"
    | "phase"
    | "phaseEndsAt"
    | "paused"
    | "aiNarration"
    | "autoHost"
    | "participants"
    | "status"
  >;
}) {
  const { enabled: tutorialOn } = useTutorial();
  const remaining = useCountdown(data.phaseEndsAt, data.paused);
  const self = data.participants.find((p) => p.isSelf);
  const event = data.phase === "EVENT" ? EVENT_COPY[data.currentRound] : null;
  const showReady =
    data.status !== "LOBBY" &&
    data.phase !== "SETTLEMENT" &&
    canFastForwardPhase(data.status, data.phase) &&
    !!self &&
    !self.isBot;

  const phaseLabel = data.paused
    ? data.autoHost
      ? "AI điều phối đã tạm dừng"
      : "Host đã tạm dừng phiên"
    : data.phase
      ? PHASE_BANNERS[data.phase]
      : "Đang chuẩn bị";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[14px] border border-primary/35 bg-background shadow-md",
        "bg-gradient-to-r from-primary/20 via-primary/10 to-background",
      )}
      aria-label="Thông báo vòng và giai đoạn"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,220px)_1fr_minmax(0,200px)]">
        <div className="border-b border-primary/15 px-4 py-3 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Vòng {data.currentRound}
            {ROUND_NAMES[data.currentRound] ? ` · ${ROUND_NAMES[data.currentRound]}` : ""}
          </p>
          <p className="mt-0.5 text-lg font-bold leading-tight text-foreground">{phaseLabel}</p>
          {event ? (
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">{event.title}</span>
              {" — "}
              {event.body}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 items-center gap-3 border-b border-primary/15 px-4 py-3 lg:border-b-0">
          {data.autoHost && data.aiNarration ? (
            <>
              <Sparkles className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Điều phối viên AI
                </p>
                <p className="mt-0.5 text-sm leading-snug text-foreground">{data.aiNarration}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {event ? event.body : "Theo dõi nhiệm vụ và tài nguyên bên phải."}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2 px-4 py-3 lg:border-l lg:border-primary/15">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Thời gian</span>
            <span className="flex items-center gap-1.5 font-mono text-xl font-bold tabular-nums">
              {data.paused ? (
                <Pause className="size-4" />
              ) : (
                <Clock className="size-4 text-primary" />
              )}
              {remaining !== null ? formatClock(remaining) : "--:--"}
            </span>
          </div>
          {showReady ? (
            <div className="flex flex-col gap-1">
              <PhaseReadyButton
                sessionId={sessionId}
                phaseReady={self.phaseReady}
                autoHost={data.autoHost}
                phase={data.phase}
                disabled={data.paused}
              />
              {tutorialOn ? (
                <p className="text-center text-[10px] text-muted-foreground">
                  Bấm khi xong việc giai đoạn này
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
