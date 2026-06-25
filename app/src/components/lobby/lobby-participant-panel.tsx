"use client";

import { User, Check } from "lucide-react";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { ParticipantPresenceDot } from "@/components/lobby/participant-status-badge";

function LobbyParticipantRow({ p }: { p: ParticipantView }) {
  const showReadyIcon = !p.isBot && p.ready;

  return (
    <li className="flex items-center gap-2.5 border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-xl bg-muted">
        <User className="size-3.5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold">{p.displayName}</p>
          {p.isSelf ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
              Bạn
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {p.role ? ROLE_LABELS[p.role] : "Chưa phân vai"}
        </p>
      </div>
      {!p.isBot ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <ParticipantPresenceDot participant={p} className="size-1.5" />
          {showReadyIcon ? (
            <Check className="size-3.5 text-success" aria-label="Sẵn sàng" />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function LobbyParticipantPanel({
  participants,
  humanCount,
  maxPlayers,
}: {
  participants: ParticipantView[];
  humanCount: number;
  maxPlayers: number;
}) {
  return (
    <div className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <h3 className="text-sm font-bold">Người tham gia</h3>
        <span className="font-mono text-xs text-muted-foreground">
          {humanCount}/{maxPlayers}
        </span>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {participants.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có người chơi.
          </li>
        ) : (
          participants.map((p) => <LobbyParticipantRow key={p.id} p={p} />)
        )}
      </ul>
    </div>
  );
}
