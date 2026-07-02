"use client";

import { RoleBadge } from "@/components/lobby/role-badge";
import {
  ParticipantPresenceDot,
  ParticipantStatusBadge,
} from "@/components/lobby/participant-status-badge";
import type { DutyStatus, PlayerTimelineEntry } from "@/lib/phase-timeline";
import { cn } from "@/lib/utils";

type DutyStyle = { label: string; dot: string; card: string; pill: string };

export const DUTY_STATUS_STYLES: Record<DutyStatus, DutyStyle> = {
  active: {
    label: "Đang làm",
    dot: "bg-primary ring-2 ring-primary/30",
    card: "border-primary/40 bg-primary/5",
    pill: "bg-primary/15 text-primary",
  },
  waiting: {
    label: "Chờ",
    dot: "bg-muted-foreground/40",
    card: "border-border bg-surface",
    pill: "bg-muted text-muted-foreground",
  },
  done: {
    label: "Xong",
    dot: "bg-success",
    card: "border-success/30 bg-success/5",
    pill: "bg-success/15 text-success",
  },
};

const MAP_DUTY_STATUS_STYLES: Record<DutyStatus, DutyStyle> = {
  active: {
    label: "Đang làm",
    dot: "bg-stone-500",
    card: "border-stone-300/80 bg-white/90",
    pill: "bg-stone-200/80 text-stone-800",
  },
  waiting: {
    label: "Chờ",
    dot: "bg-stone-400",
    card: "border-stone-200/70 bg-white/70",
    pill: "bg-stone-100 text-stone-600",
  },
  done: {
    label: "Xong",
    dot: "bg-emerald-600",
    card: "border-emerald-200/80 bg-white/80",
    pill: "bg-emerald-100 text-emerald-800",
  },
};

export function PlayerDutyChip({
  entry,
  inGame,
  compact = false,
  variant = "timeline",
  className,
}: {
  entry: PlayerTimelineEntry;
  inGame: boolean;
  compact?: boolean;
  variant?: "timeline" | "map";
  className?: string;
}) {
  const { participant, title, action, status, showPhaseReady } = entry;
  const isMap = variant === "map";
  const style = isMap ? MAP_DUTY_STATUS_STYLES[status] : DUTY_STATUS_STYLES[status];
  const ariaLabel = `${participant.displayName}, ${title}. ${action}. ${style.label}.`;

  const phaseLabel = participant.phaseReady ? "Sẵn sàng" : "Đang chơi";

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-[14px] border p-3",
        compact ? "w-full" : "w-[min(100vw-2rem,16rem)]",
        style.card,
        !isMap && participant.isSelf && "ring-2 ring-primary",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2">
        <ParticipantPresenceDot participant={participant} />
        <span className="min-w-0 truncate text-sm font-semibold text-stone-900">
          {participant.displayName}
          {participant.isSelf ? (
            isMap ? (
              <span className="font-normal text-stone-500"> (bạn)</span>
            ) : (
              <span className="sr-only"> (bạn)</span>
            )
          ) : null}
        </span>
        {participant.isBot ? (
          <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            Bot
          </span>
        ) : showPhaseReady && !isMap ? (
          <ParticipantStatusBadge
            participant={participant}
            inGame={inGame}
            className="ml-auto"
          />
        ) : showPhaseReady && isMap ? (
          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              participant.phaseReady
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-200/80 text-stone-800",
            )}
          >
            {phaseLabel}
          </span>
        ) : (
          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              style.pill,
            )}
          >
            {style.label}
          </span>
        )}
      </div>
      <RoleBadge role={participant.role} />
      <p className="text-xs font-medium leading-snug">{title}</p>
      <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
        {action}
      </p>
    </div>
  );
}
