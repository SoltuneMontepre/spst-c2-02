"use client";

import { useMemo } from "react";
import { Check, WifiOff } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { ParticipantAvatar } from "@/components/session/participant-avatar";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";
import {
  buildPlayerEntries,
  type DutyStatus,
  type PlayerTimelineEntry,
} from "@/lib/phase-timeline";
import type { SessionSnapshot } from "@/lib/session-service";
import { cn } from "@/lib/utils";

const ROLE_ORDER: Role[] = [
  "PRODUCER",
  "CONSUMER",
  "INTERMEDIARY",
  "GOVERNMENT",
];

const STATUS_TEXT: Record<DutyStatus, string> = {
  active: "text-emerald-600",
  waiting: "text-muted-foreground",
  done: "text-muted-foreground/70",
};

type RosterSnapshot = Pick<
  SessionSnapshot,
  | "phase"
  | "status"
  | "currentRound"
  | "self"
  | "market"
  | "autoHost"
  | "participants"
>;

function PlayerRow({ entry }: { entry: PlayerTimelineEntry }) {
  const { participant, activityLabel, status, showPhaseReady, disconnected } =
    entry;
  const isReady = showPhaseReady && participant.phaseReady && !disconnected;

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
        participant.isSelf
          ? "bg-primary/10 ring-1 ring-primary/35"
          : "hover:bg-muted/60",
        isReady && !participant.isSelf && "bg-success/5",
        disconnected && "opacity-60",
      )}
    >
      <ParticipantAvatar participant={participant} size="sm" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-foreground">
          {participant.displayName}
          {participant.isSelf ? (
            <span className="font-medium text-primary"> (bạn)</span>
          ) : null}
        </p>
        <p
          className={cn(
            "truncate text-xs",
            disconnected
              ? "font-medium text-danger"
              : isReady
                ? "font-medium text-success"
                : STATUS_TEXT[status],
            !disconnected && !isReady && status === "active" && "font-medium",
          )}
          title={
            disconnected
              ? "Mất kết nối"
              : isReady
                ? "Đã sẵn sàng"
                : activityLabel
          }
        >
          {disconnected
            ? "Mất kết nối"
            : isReady
              ? "Đã sẵn sàng"
              : activityLabel}
        </p>
      </div>
      {disconnected ? (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          title="Mất kết nối"
          aria-label="Mất kết nối"
        >
          <WifiOff className="size-3.5" aria-hidden />
        </span>
      ) : isReady ? (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white"
          title="Đã sẵn sàng"
          aria-label="Đã sẵn sàng"
        >
          <Check className="size-3.5 stroke-[3]" aria-hidden />
        </span>
      ) : null}
    </li>
  );
}

export function MapPlayerRoster({ snapshot }: { snapshot: RosterSnapshot }) {
  const entries = useMemo(
    () => buildPlayerEntries(snapshot),
    [
      snapshot.phase,
      snapshot.status,
      snapshot.currentRound,
      snapshot.self,
      snapshot.market,
      snapshot.autoHost,
      snapshot.participants,
    ],
  );

  const byRole = useMemo(() => {
    const map = new Map<Role, PlayerTimelineEntry[]>();
    for (const entry of entries) {
      const role = entry.participant.role!;
      const list = map.get(role) ?? [];
      list.push(entry);
      map.set(role, list);
    }
    return map;
  }, [entries]);

  const counted = entries.filter((e) => e.showPhaseReady && !e.disconnected);
  const readyCount = counted.filter((e) => e.participant.phaseReady).length;

  return (
    <aside
      className="flex h-full min-h-0 w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface sm:w-[280px]"
      aria-label="Danh sách người chơi"
    >
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Người chơi — {entries.length}
        </p>
        {counted.length > 0 ? (
          <p className="mt-0.5 text-[11px] font-medium text-success">
            {readyCount}/{counted.length} sẵn sàng
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {ROLE_ORDER.map((role) => {
          const list = byRole.get(role);
          if (!list?.length) return null;
          return (
            <section key={role} className="mb-3">
              <h3 className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {ROLE_SHORT_LABELS[role]} — {list.length}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {list.map((entry) => (
                  <PlayerRow key={entry.participant.id} entry={entry} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
