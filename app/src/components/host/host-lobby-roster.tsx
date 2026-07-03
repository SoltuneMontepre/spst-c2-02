"use client";

import type { ReactNode } from "react";
import { Check, User } from "lucide-react";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import {
  ParticipantPresenceDot,
  ParticipantStatusBadge,
} from "@/components/lobby/participant-status-badge";
import { cn } from "@/lib/utils";

export function HostLobbyRoster({
  participants,
  readyCount,
  humanCount,
  headerExtra,
}: {
  participants: ParticipantView[];
  readyCount: number;
  humanCount: number;
  headerExtra?: ReactNode;
}) {
  const humans = participants.filter((p) => !p.isBot);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="truncate text-sm font-semibold">Người chơi</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtra}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-success">
              {humans.filter((p) => p.presence === "ONLINE").length} online
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{humanCount} tổng</span>
          </div>
        </div>
      </div>
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Đã sẵn sàng</span>
          <span className="font-semibold">
            {readyCount}/{humanCount}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-primary transition-all")}
            style={{
              width: humanCount > 0 ? `${(readyCount / humanCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>
      <ul className="space-y-1 overflow-y-auto p-2">
        {humans.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            Chưa có người chơi. Chia sẻ mã phòng để mời học sinh.
          </li>
        ) : (
          humans.map((p) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 border-transparent px-3 py-2.5 hover:bg-muted/30",
                p.ready
                  ? "border-success bg-success/5"
                  : p.isSelf && "border-primary bg-primary/5",
              )}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {p.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium leading-snug break-words"
                    title={p.displayName}
                  >
                    {p.displayName}
                    {p.isSelf ? (
                      <span className="ml-1.5 text-xs font-semibold text-primary">
                        (bạn)
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.role ? ROLE_LABELS[p.role] : "Chưa phân vai"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <ParticipantPresenceDot participant={p} />
                    <ParticipantStatusBadge participant={p} inGame={false} />
                  </div>
                </div>
              </div>
              {p.ready ? (
                <Check
                  className="size-5 shrink-0 text-success"
                  aria-label="Đã sẵn sàng"
                />
              ) : null}
            </li>
          ))
        )}
      </ul>
      <div className="flex-1" aria-hidden />
    </div>
  );
}
