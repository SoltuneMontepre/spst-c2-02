import type { ProductivityProfile } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { RoleBadge } from "./role-badge";
import { PRODUCTIVITY_PROFILES } from "@/lib/scenario";
import { cn } from "@/lib/utils";

export function LobbyRoster({ participants }: { participants: ParticipantView[] }) {
  if (participants.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có người chơi. Chia sẻ mã phòng để mời bạn bè vào nhé.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {participants.map((p) => (
        <li key={p.id} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                p.isBot || p.presence === "ONLINE"
                  ? "bg-success"
                  : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            <span className="font-medium">
              {p.displayName}
              {p.isSelf ? " (bạn)" : ""}
            </span>
            {p.isBot ? (
              <span className="text-xs text-muted-foreground">Bot</span>
            ) : !p.isSelf && p.presence === "OFFLINE" ? (
              <span className="text-xs text-danger">Mất kết nối</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={p.role} />
            {p.role === "PRODUCER" && p.productivityProfile ? (
              <span className="text-xs text-muted-foreground">
                {PRODUCTIVITY_PROFILES[p.productivityProfile as ProductivityProfile].label}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {p.ready ? "Sẵn sàng" : "Chưa sẵn sàng"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
