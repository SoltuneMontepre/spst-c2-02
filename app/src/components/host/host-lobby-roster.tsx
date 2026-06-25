"use client";

import { Check, User } from "lucide-react";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { cn } from "@/lib/utils";

export function HostLobbyRoster({
  participants,
  readyCount,
  humanCount,
}: {
  participants: ParticipantView[];
  readyCount: number;
  humanCount: number;
}) {
  const humans = participants.filter((p) => !p.isBot);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold">Người chơi</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-success">
            {humans.filter((p) => p.presence === "ONLINE").length} online
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{humanCount} tổng</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-2">
        {humans.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            Chưa có người chơi. Chia sẻ mã phòng để mời học sinh.
          </li>
        ) : (
          humans.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/30"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {p.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.role ? ROLE_LABELS[p.role] : "Chưa phân vai"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {p.presence === "ONLINE" ? (
                  <span className="size-2 rounded-full bg-success" aria-label="Online" />
                ) : null}
                {p.ready ? (
                  <Check className="size-4 text-success" aria-label="Sẵn sàng" />
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Đã sẵn sàng</span>
          <span className="font-semibold">
            {readyCount}/{humanCount}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all",
              humanCount > 0 ? `w-[${Math.round((readyCount / humanCount) * 100)}%]` : "w-0",
            )}
            style={{
              width: humanCount > 0 ? `${(readyCount / humanCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
