"use client";

import { Clock } from "lucide-react";
import { useCountdown, formatClock } from "@/hooks/use-countdown";
import { PhaseReadyButton } from "@/components/session/phase-ready-button";
import { ParticipantAvatar } from "@/components/session/participant-avatar";
import { ROLE_LABELS } from "@/lib/display-labels";
import type { ParticipantView, SelfState } from "@/lib/session-service";
import type { RoleQuest } from "@/lib/role-quest";
import { cn } from "@/lib/utils";
import { canFastForwardPhase } from "@/lib/phase-timeline";

export function GameBottomPill({
  sessionId,
  self,
  selfParticipant,
  phase,
  phaseEndsAt,
  paused,
  status,
  phaseReady,
  autoHost,
  questStatus,
}: {
  sessionId: string;
  self: SelfState | null;
  selfParticipant: ParticipantView | undefined;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
  status: string;
  phaseReady: boolean;
  autoHost: boolean;
  questStatus?: RoleQuest["status"];
}) {
  const remaining = useCountdown(phaseEndsAt, paused);
  const urgent = remaining !== null && remaining <= 5;
  const canReady =
    Boolean(selfParticipant && !selfParticipant.isBot) &&
    canFastForwardPhase(status, phase);
  const needsAttention =
    canReady && !phaseReady && questStatus === "done";
  const showReady = canReady && (phase === "DECISION" || phase === "MARKET_OPEN");

  const displayName = selfParticipant?.displayName ?? "Bạn";
  const role = self?.role ?? selfParticipant?.role ?? null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-2 sm:px-4 sm:pb-2.5"
      aria-label="Thanh trạng thái phiên"
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-full border border-border/80 bg-surface/95 py-2 pl-2 pr-2 shadow-xl backdrop-blur-md sm:gap-4 sm:py-2.5 sm:pl-2.5 sm:pr-3",
          urgent && "border-danger/50 ring-2 ring-danger/30",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          {selfParticipant ? (
            <ParticipantAvatar
              participant={selfParticipant}
              size="md"
              showStatus
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-foreground">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
              {role ? ROLE_LABELS[role] : "Chưa phân vai"}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-2xl px-3 py-1 sm:px-4",
            urgent
              ? "bg-danger/15 text-danger"
              : "bg-muted/60 text-foreground",
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-current/70">
            <Clock className="size-3" aria-hidden />
            {paused ? "Tạm dừng" : urgent ? "Sắp hết giờ" : "Thời gian"}
          </span>
          <span
            className={cn(
              "font-mono text-2xl font-black tabular-nums leading-none sm:text-3xl",
              urgent && "animate-pulse",
            )}
          >
            {remaining !== null ? formatClock(remaining) : "--:--"}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 justify-end">
          {showReady ? (
            phaseReady ? (
              <span className="rounded-full bg-success/15 px-4 py-2.5 text-center text-xs font-bold text-success sm:text-sm">
                Đã sẵn sàng
              </span>
            ) : (
              <PhaseReadyButton
                sessionId={sessionId}
                phaseReady={phaseReady}
                autoHost={autoHost}
                phase={phase}
                disabled={paused}
                idleLabel="Tôi đã sẵn sàng"
                readyLabel="Đã sẵn sàng"
                attention={needsAttention}
                className="h-11 w-auto min-w-[9.5rem] rounded-full px-5 text-sm font-bold sm:min-w-[11rem] sm:text-base"
              />
            )
          ) : (
            <span className="rounded-full bg-muted px-4 py-2.5 text-xs font-medium text-muted-foreground">
              Đang chờ giai đoạn
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
